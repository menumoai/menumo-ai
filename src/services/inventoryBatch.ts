// src/services/inventoryBatch.ts
import {
    collection,
    getDocs,
    orderBy,
    query,
    setDoc,
    doc,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";
import { db } from "../firebaseClient";
import type { InventoryBatch, PerishableCategory } from "../models/inventoryBatch";
import { recordInventoryEvent } from "./inventoryEvent";

const DAY_MS = 24 * 60 * 60 * 1000;

const inventoryBatchesCol = (accountId: string) =>
    collection(db, "accounts", accountId, "inventoryBatches");

export interface CreateBatchFromPurchaseParams {
    accountId: string;
    productId: string;
    supplierTransactionId?: string | null;
    /** Amount received, in the product's stock unit. */
    quantityReceived: number;
    unit: string;
    unitCost?: number;
    perishableCategory: PerishableCategory;
    /** Resolved shelf life in days (default or owner override). */
    shelfLifeDays: number;
    /** Receipt "Log Date"; defaults to now. */
    receivedAt?: Date;
}

export interface CreateBatchFromPurchaseResult {
    batchId: string;
    eventId: string;
    /** Product on-hand stock after the purchase. */
    newStock: number;
}

/**
 * Log a received lot: bump the product's on-hand stock via a `purchase`
 * inventory event, then write the batch doc that carries the receive date and
 * estimated expiry. The event/stock update runs first (its transaction keeps
 * `currentStock` and the ledger in lock-step); the batch doc is written after
 * and linked by id, so `currentStock` stays authoritative even if the aux batch
 * write fails. Expiry is `receivedAt + shelfLifeDays`.
 */
export async function createBatchFromPurchase(
    params: CreateBatchFromPurchaseParams
): Promise<CreateBatchFromPurchaseResult> {
    const {
        accountId,
        productId,
        supplierTransactionId,
        quantityReceived,
        unit,
        unitCost,
        perishableCategory,
        shelfLifeDays,
        receivedAt,
    } = params;

    const received = receivedAt ?? new Date();
    const expiresAt = new Date(received.getTime() + shelfLifeDays * DAY_MS);
    const batchRef = doc(inventoryBatchesCol(accountId));

    const { eventId, newStock } = await recordInventoryEvent({
        accountId,
        productId,
        type: "purchase",
        quantityDelta: quantityReceived,
        unitCost,
        supplierTransactionId: supplierTransactionId ?? null,
        batchId: batchRef.id,
        occurredAt: received,
    });

    await setDoc(batchRef, {
        id: batchRef.id,
        accountId,
        productId,
        supplierTransactionId: supplierTransactionId ?? null,
        quantityReceived,
        quantityRemaining: quantityReceived,
        unit,
        unitCost: unitCost ?? null,
        perishableCategory,
        receivedAt: Timestamp.fromDate(received),
        shelfLifeDays,
        expiresAt: Timestamp.fromDate(expiresAt),
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return { batchId: batchRef.id, eventId, newStock };
}

/**
 * Active (not yet depleted) batches, soonest received first. Status is filtered
 * client-side to avoid a composite index (same convention as
 * `listInventoryEvents`). Expiry-risk classification is done client-side in
 * `src/analysis/shelfLife.ts`.
 */
export async function listActiveBatches(
    accountId: string
): Promise<InventoryBatch[]> {
    const q = query(inventoryBatchesCol(accountId), orderBy("receivedAt", "asc"));
    const snap = await getDocs(q);
    return snap.docs
        .map((d) => d.data() as InventoryBatch)
        .filter((b) => b.status === "active");
}
