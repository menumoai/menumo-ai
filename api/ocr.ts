import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";

// Vercel serverless function. Reads a receipt/invoice image with Claude vision
// and returns structured line items for the inventory intake flow. Holds the
// Anthropic token server-side (ANTHROPIC_API_KEY, NO `VITE_` prefix), same as
// `api/companion.ts`. The Vite dev middleware in `vite.config.ts` reuses
// `extractReceipt` so `npm run dev` behaves like production.

type SupportedMediaType =
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp";

const SUPPORTED_MEDIA_TYPES: SupportedMediaType[] = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
];

type PerishableCategory =
    | "dairy"
    | "produce"
    | "protein"
    | "non_perishable"
    | "other";

interface ExtractedLineItem {
    rawText: string;
    itemName: string;
    quantity: number;
    unit: string;
    unitCost: number;
    suggestedCategory: PerishableCategory;
}

export interface ExtractedReceipt {
    supplierName: string;
    /** ISO date (YYYY-MM-DD) of the receipt / log date; "" if not found. */
    transactionDate: string;
    currency: string;
    totalAmount: number;
    lineItems: ExtractedLineItem[];
}

const RECEIPT_SCHEMA: Record<string, unknown> = {
    type: "object",
    additionalProperties: false,
    properties: {
        supplierName: {
            type: "string",
            description: "Vendor/supplier/store name; empty string if not shown",
        },
        transactionDate: {
            type: "string",
            description:
                "Receipt date as ISO YYYY-MM-DD (the log date). Empty string if not found.",
        },
        currency: {
            type: "string",
            description: "ISO currency code, e.g. 'USD'; default 'USD' if unclear",
        },
        totalAmount: {
            type: "number",
            description: "Receipt grand total in the main currency unit (dollars)",
        },
        lineItems: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    rawText: {
                        type: "string",
                        description: "The line exactly as printed on the receipt",
                    },
                    itemName: {
                        type: "string",
                        description: "Clean product/ingredient name",
                    },
                    quantity: {
                        type: "number",
                        description:
                            "TOTAL quantity in the base unit. If sold as cases/packs, multiply out (e.g. '2 cases (10 lbs total)' => 10).",
                    },
                    unit: {
                        type: "string",
                        description:
                            "Base tracking unit: one of 'each', 'lb', 'oz', 'liter', 'pack'.",
                    },
                    unitCost: {
                        type: "number",
                        description:
                            "Per-base-unit cost in dollars. 0 if it cannot be determined.",
                    },
                    suggestedCategory: {
                        type: "string",
                        enum: [
                            "dairy",
                            "produce",
                            "protein",
                            "non_perishable",
                            "other",
                        ],
                        description:
                            "Spoilage class: dairy, produce, protein (raw meat/fish/poultry), non_perishable (dry/canned/frozen), else other.",
                    },
                },
                required: [
                    "rawText",
                    "itemName",
                    "quantity",
                    "unit",
                    "unitCost",
                    "suggestedCategory",
                ],
            },
        },
    },
    required: [
        "supplierName",
        "transactionDate",
        "currency",
        "totalAmount",
        "lineItems",
    ],
};

const SYSTEM_PROMPT = [
    "You are an OCR and data-extraction engine for a food-truck inventory app.",
    "You are given a photo of a supplier invoice or store receipt for food/beverage stock.",
    "Read it carefully and return each purchased line item with a clean name, the TOTAL quantity",
    "expressed in a single base tracking unit (each, lb, oz, liter, pack), the per-unit cost in",
    "dollars, and a spoilage category. Normalize case/pack quantities to the total base amount.",
    "Ignore tax, subtotal, and non-item lines. If a value is illegible or absent, use an empty",
    "string for text or 0 for numbers rather than guessing. Never invent items that are not on the",
    "receipt.",
].join(" ");

/**
 * Core Anthropic vision call. Shared by the Vercel function (below) and the Vite
 * dev middleware, so `npm run dev` and production behave alike.
 */
export async function extractReceipt(params: {
    imageBase64: string;
    mediaType: SupportedMediaType;
    apiKey: string;
}): Promise<ExtractedReceipt> {
    const client = new Anthropic({ apiKey: params.apiKey });

    const message = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 4096,
        thinking: { type: "adaptive" },
        output_config: {
            effort: "low",
            format: {
                type: "json_schema",
                schema: RECEIPT_SCHEMA,
            },
        },
        system: SYSTEM_PROMPT,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "image",
                        source: {
                            type: "base64",
                            media_type: params.mediaType,
                            data: params.imageBase64,
                        },
                    },
                    {
                        type: "text",
                        text: "Extract the supplier, date, total, and every stock line item from this receipt.",
                    },
                ],
            },
        ],
    });

    const textBlock = message.content.find(
        (block): block is Anthropic.TextBlock => block.type === "text",
    );

    const parsed = textBlock ? safeParse(textBlock.text) : null;
    return normalizeReceipt(parsed);
}

export function isSupportedMediaType(value: unknown): value is SupportedMediaType {
    return (
        typeof value === "string" &&
        SUPPORTED_MEDIA_TYPES.includes(value as SupportedMediaType)
    );
}

export default async function handler(
    req: VercelRequest,
    res: VercelResponse,
) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        res.status(503).json({ error: "OCR is not configured." });
        return;
    }

    const body = asRecord(
        typeof req.body === "string" ? safeParse(req.body) : req.body,
    );
    const imageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64 : "";
    const mediaType: unknown = body.mediaType;

    if (!imageBase64) {
        res.status(400).json({ error: "Missing image data." });
        return;
    }
    if (!isSupportedMediaType(mediaType)) {
        res.status(400).json({ error: "Unsupported image type." });
        return;
    }

    try {
        const receipt = await extractReceipt({ imageBase64, mediaType, apiKey });
        res.status(200).json({ receipt });
    } catch (error) {
        // Do not leak token/stack details to the client.
        console.error("OCR request failed", error);
        res.status(500).json({ error: "Failed to read the receipt." });
    }
}

function asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object"
        ? (value as Record<string, unknown>)
        : {};
}

function asString(value: unknown, fallback = ""): string {
    return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeReceipt(parsed: unknown): ExtractedReceipt {
    const root = asRecord(parsed);
    const rawItems = Array.isArray(root.lineItems) ? root.lineItems : [];
    return {
        supplierName: asString(root.supplierName),
        transactionDate: asString(root.transactionDate),
        currency: asString(root.currency, "USD"),
        totalAmount: asNumber(root.totalAmount),
        lineItems: rawItems.map((raw): ExtractedLineItem => {
            const item = asRecord(raw);
            return {
                rawText: asString(item.rawText),
                itemName: asString(item.itemName),
                quantity: asNumber(item.quantity),
                unit: asString(item.unit, "each"),
                unitCost: asNumber(item.unitCost),
                suggestedCategory: normalizeCategory(item.suggestedCategory),
            };
        }),
    };
}

function normalizeCategory(value: unknown): PerishableCategory {
    const known: PerishableCategory[] = [
        "dairy",
        "produce",
        "protein",
        "non_perishable",
        "other",
    ];
    return known.includes(value as PerishableCategory)
        ? (value as PerishableCategory)
        : "other";
}

function safeParse(value: string): unknown {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}
