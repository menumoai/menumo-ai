import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";

// Vercel serverless function. Holds the Anthropic token server-side so it is
// never shipped to the browser. Set ANTHROPIC_API_KEY (NO `VITE_` prefix) in
// the Vercel project settings and in local `.env.local` for `vercel dev`.

type CompanionCategory =
    | "revenue"
    | "menu"
    | "orders"
    | "expenses"
    | "locations"
    | "operations";
type CompanionUrgency = "now" | "soon" | "idea";

interface GeneratedSuggestion {
    id: string;
    icon: string;
    title: string;
    description: string;
    detail: string;
    projectedValue: string;
    category: CompanionCategory;
    urgency: CompanionUrgency;
}

const SUGGESTION_SCHEMA: Record<string, unknown> = {
    type: "object",
    additionalProperties: false,
    properties: {
        suggestions: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    id: { type: "string" },
                    icon: {
                        type: "string",
                        description: "A single emoji that fits the suggestion",
                    },
                    title: { type: "string" },
                    description: { type: "string" },
                    detail: {
                        type: "string",
                        description:
                            "1-3 sentences explaining the reasoning, grounded in the supplied numbers",
                    },
                    projectedValue: {
                        type: "string",
                        description:
                            "Short impact estimate, e.g. '+$90/week' or '-45 sec per order'",
                    },
                    category: {
                        type: "string",
                        enum: [
                            "revenue",
                            "menu",
                            "orders",
                            "expenses",
                            "locations",
                            "operations",
                        ],
                    },
                    urgency: {
                        type: "string",
                        enum: ["now", "soon", "idea"],
                    },
                },
                required: [
                    "id",
                    "icon",
                    "title",
                    "description",
                    "detail",
                    "projectedValue",
                    "category",
                    "urgency",
                ],
            },
        },
    },
    required: ["suggestions"],
};

const SYSTEM_PROMPT = [
    "You are Menumo's AI companion: a sharp, practical business advisor for food-truck and",
    "small-restaurant owners. You are given a JSON summary of one account's real analytics and the",
    "app section the owner is currently viewing. Produce 2-3 concrete, specific suggestions that are",
    "directly grounded in the supplied numbers (reference real item names, channels, days, and",
    "dollar figures from the data). Keep titles short and plain-English; keep descriptions to one or",
    "two sentences. Prefer suggestions relevant to the current section. Never invent data that is not",
    "present in the summary. If the data is too sparse to say anything useful, return fewer, honest",
    "suggestions rather than filler.",
].join(" ");

/**
 * Core Anthropic call. Shared by the Vercel function (below) and the Vite dev
 * middleware in `vite.config.ts`, so `npm run dev` and production behave alike.
 */
export async function generateCompanionSuggestions(params: {
    context: string;
    summary: unknown;
    apiKey: string;
}): Promise<GeneratedSuggestion[]> {
    const client = new Anthropic({ apiKey: params.apiKey });

    const message = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 2048,
        thinking: { type: "adaptive" },
        output_config: {
            effort: "low",
            format: {
                type: "json_schema",
                schema: SUGGESTION_SCHEMA,
            },
        },
        system: SYSTEM_PROMPT,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `Current app section: "${params.context}".\n\nAccount analytics summary (JSON):\n${JSON.stringify(
                            params.summary,
                        )}`,
                    },
                ],
            },
        ],
    });

    const textBlock = message.content.find(
        (block): block is Anthropic.TextBlock => block.type === "text",
    );

    const parsed = textBlock ? safeParse(textBlock.text) : null;
    return Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
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
        // No key configured — signal the client to fall back to demo content.
        res.status(503).json({ error: "AI companion is not configured." });
        return;
    }

    const body = typeof req.body === "string" ? safeParse(req.body) : req.body;
    const context: string = body?.context ?? "default";
    const summary = body?.summary ?? null;

    if (!summary) {
        res.status(400).json({ error: "Missing analytics summary." });
        return;
    }

    try {
        const suggestions = await generateCompanionSuggestions({
            context,
            summary,
            apiKey,
        });
        res.status(200).json({ suggestions });
    } catch (error) {
        // Do not leak token/stack details to the client.
        console.error("AI companion request failed", error);
        res.status(500).json({ error: "Failed to generate suggestions." });
    }
}

function safeParse(value: string): any {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}
