// src/models/inventoryBatch.ts
import type { Timestamp } from "firebase/firestore";

/**
 * Coarse spoilage class used to pick a default shelf life when stock is logged.
 * The owner can override the resolved days in the receipt review UI. See
 * `src/analysis/shelfLife.ts` for the default day counts and expiry math.
 */
export type PerishableCategory =
    | "dairy"
    | "produce"
    | "protein"
    | "non_perishable"
    | "other";

/**
 * `active`   - still has stock remaining and is not past its expiry.
 * `depleted` - `quantityRemaining` reached zero (FIFO deductions consumed it).
 * `expired`  - passed `expiresAt` while stock still remained.
 */
export type BatchStatus = "active" | "depleted" | "expired";

/**
 * A single received lot of one product, created when inventory is logged (today
 * from an OCR'd receipt). Batches carry the receive date and estimated expiry so
 * stock can be tracked FIFO and flagged before it spoils. The product's running
 * `currentStock` remains the source of truth for total on-hand; a batch's
 * `quantityRemaining` is the per-lot slice of that total.
 */
export interface InventoryBatch {
    id: string;
    accountId: string;
    productId: string;

    /** Links the batch back to the receipt/invoice it was logged from. */
    supplierTransactionId?: string | null;

    /** Original amount received, in the product's `stockUnit`. */
    quantityReceived: number;
    /** Amount still on hand; equals `quantityReceived` until FIFO decrements it. */
    quantityRemaining: number;
    /** Mirrors `Product.stockUnit` at receive time (e.g. "lb", "each"). */
    unit: string;

    /** Per-unit cost parsed from the receipt, if available. */
    unitCost?: number | null;

    perishableCategory: PerishableCategory;

    /** The receipt "Log Date" - when the stock was received. */
    receivedAt: Timestamp;
    /** Resolved shelf-life default or owner override, in days. */
    shelfLifeDays: number;
    /** `receivedAt` + `shelfLifeDays`. */
    expiresAt: Timestamp;

    status: BatchStatus;

    createdAt: Timestamp;
    updatedAt: Timestamp;
}
