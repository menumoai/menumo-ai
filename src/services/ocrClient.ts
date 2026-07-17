// src/services/ocrClient.ts
//
// Browser helper for the /api/ocr serverless endpoint. Reads a receipt image to
// base64 and posts it for Claude-vision extraction. The response shape mirrors
// `ExtractedReceipt` in `api/ocr.ts` (re-declared here so the client bundle does
// not pull in the server SDK, same convention as companionClient.ts).

import type { PerishableCategory } from "../models/inventoryBatch";

export interface ExtractedLineItem {
    rawText: string;
    itemName: string;
    quantity: number;
    unit: string;
    unitCost: number;
    suggestedCategory: PerishableCategory;
}

export interface ExtractedReceipt {
    supplierName: string;
    /** ISO YYYY-MM-DD, or "" if the model could not read a date. */
    transactionDate: string;
    currency: string;
    totalAmount: number;
    lineItems: ExtractedLineItem[];
}

const SUPPORTED_MEDIA_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
];

/** Thrown on any non-OK response so the caller can surface a clear error. */
export class OcrRequestError extends Error {
    status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.name = "OcrRequestError";
        this.status = status;
    }
}

/** Read a File into its raw base64 payload (without the data: URL prefix). */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
        reader.onload = () => {
            const result = reader.result;
            if (typeof result !== "string") {
                reject(new Error("Unexpected file read result"));
                return;
            }
            const comma = result.indexOf(",");
            resolve(comma >= 0 ? result.slice(comma + 1) : result);
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Send a receipt image to the OCR endpoint and return the structured
 * extraction. Throws an OcrRequestError on unsupported types, network failure,
 * or any non-200 response.
 */
export async function extractReceiptFromImage(
    file: File,
    signal?: AbortSignal,
): Promise<ExtractedReceipt> {
    if (!SUPPORTED_MEDIA_TYPES.includes(file.type)) {
        throw new OcrRequestError(
            "That image type isn't supported. Use a JPG, PNG, or WebP photo.",
        );
    }

    const imageBase64 = await fileToBase64(file);

    let response: Response;
    try {
        response = await fetch("/api/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64, mediaType: file.type }),
            signal,
        });
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            throw error;
        }
        throw new OcrRequestError(
            "Could not reach the OCR service. Check your connection and try again.",
        );
    }

    if (!response.ok) {
        let serverMessage: string | undefined;
        try {
            serverMessage = (await response.json())?.error;
        } catch {
            // Non-JSON error body — fall back to a status-based message.
        }
        throw new OcrRequestError(
            serverMessage ?? `Request failed (${response.status}).`,
            response.status,
        );
    }

    const data: { receipt?: ExtractedReceipt } = await response.json();
    if (!data.receipt) {
        throw new OcrRequestError("The service returned no receipt data.");
    }
    return data.receipt;
}
