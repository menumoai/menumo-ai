// src/services/receiptIntake.ts
//
// Orchestrates logging a received-inventory receipt once the owner has reviewed
// the OCR extraction: writes the supplier transaction, persists the receipt
// image, resolves each line to a product (creating new ones as needed), and logs
// a dated batch per line. Keeps the multi-collection write out of the page.

import type { StockUnit } from "../models/product";
import type { PerishableCategory } from "../models/inventoryBatch";
import { createProduct } from "./product";
import {
    createSupplierTransaction,
    setSupplierReceiptImageUrl,
} from "./supplierTransaction";
import { uploadReceiptImage } from "./receiptStorage";
import { createBatchFromPurchase } from "./inventoryBatch";

/** A confirmed line maps to an existing product or defines a new one to create. */
export type ReceiptIntakeProduct =
    | { kind: "existing"; productId: string }
    | { kind: "new"; name: string; stockUnit: StockUnit; cost?: number; category?: string };

export interface ReceiptIntakeLine {
    product: ReceiptIntakeProduct;
    quantity: number;
    unit: string;
    unitCost?: number;
    perishableCategory: PerishableCategory;
    shelfLifeDays: number;
}

export interface LogReceivedInventoryParams {
    accountId: string;
    supplierName: string;
    /** Receipt "Log Date"; also used as each batch's receive/expiry basis. */
    transactionDate?: Date;
    totalAmount: number;
    currency?: string;
    ocrText?: string;
    imageFile?: File | null;
    lines: ReceiptIntakeLine[];
}

export interface LogReceivedInventoryResult {
    transactionId: string;
    batchIds: string[];
}

export async function logReceivedInventory(
    params: LogReceivedInventoryParams
): Promise<LogReceivedInventoryResult> {
    const {
        accountId,
        supplierName,
        transactionDate,
        totalAmount,
        currency,
        ocrText,
        imageFile,
        lines,
    } = params;

    const transactionId = await createSupplierTransaction({
        accountId,
        supplierName,
        transactionDate,
        totalAmount,
        currency,
        ocrText,
        transactionType: "inventory",
    });

    if (imageFile) {
        const url = await uploadReceiptImage(accountId, transactionId, imageFile);
        await setSupplierReceiptImageUrl(accountId, transactionId, url);
    }

    const batchIds: string[] = [];
    for (const line of lines) {
        let productId: string;
        if (line.product.kind === "existing") {
            productId = line.product.productId;
        } else {
            productId = await createProduct({
                accountId,
                name: line.product.name,
                price: 0, // ingredients are stock, not sold directly
                cost: line.product.cost,
                category: line.product.category,
                stockUnit: line.product.stockUnit,
                isActive: true,
                menuType: "food",
            });
        }

        const { batchId } = await createBatchFromPurchase({
            accountId,
            productId,
            supplierTransactionId: transactionId,
            quantityReceived: line.quantity,
            unit: line.unit,
            unitCost: line.unitCost,
            perishableCategory: line.perishableCategory,
            shelfLifeDays: line.shelfLifeDays,
            receivedAt: transactionDate,
        });
        batchIds.push(batchId);
    }

    return { transactionId, batchIds };
}
