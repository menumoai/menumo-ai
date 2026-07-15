// src/services/inventoryEvent.ts
import {
    collection,
    doc,
    getDocs,
    limit as fbLimit,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";
import { db } from "../firebaseClient";
import type {
    InventoryEvent,
    InventoryEventType,
} from "../models/inventoryEventType";

const inventoryEventsCol = (accountId: string) =>
    collection(db, "accounts", accountId, "inventoryEvents");

const productDoc = (accountId: string, productId: string) =>
    doc(db, "accounts", accountId, "products", productId);

export interface RecordInventoryEventParams {
    accountId: string;
    productId: string;
    type: InventoryEventType;
    /** Signed change to on-hand stock: + for stock in, - for stock out. */
    quantityDelta: number;
    /** Per-unit cost, only meaningful for purchases. */
    unitCost?: number;
    reason?: string;
    supplierTransactionId?: string | null;
    /** Defaults to now. */
    occurredAt?: Date;
}

export interface RecordInventoryEventResult {
    eventId: string;
    /** Product on-hand stock after applying the event. */
    newStock: number;
}

/**
 * Append an inventory event to the ledger and atomically move the product's
 * `currentStock` by `quantityDelta`. The event and the stock update either both
 * commit or both fail, so the running on-hand count always matches the ledger.
 */
export async function recordInventoryEvent(
    params: RecordInventoryEventParams
): Promise<RecordInventoryEventResult> {
    const {
        accountId,
        productId,
        type,
        quantityDelta,
        unitCost,
        reason,
        supplierTransactionId,
        occurredAt,
    } = params;

    const eventRef = doc(inventoryEventsCol(accountId));
    const prodRef = productDoc(accountId, productId);
    const occurred = occurredAt
        ? Timestamp.fromDate(occurredAt)
        : Timestamp.now();

    const newStock = await runTransaction(db, async (tx) => {
        const prodSnap = await tx.get(prodRef);
        if (!prodSnap.exists()) {
            throw new Error(`Product ${productId} not found`);
        }

        const currentStock = (prodSnap.data().currentStock as number) ?? 0;
        const nextStock = currentStock + quantityDelta;

        tx.set(eventRef, {
            id: eventRef.id,
            accountId,
            productId,
            type,
            quantityDelta,
            unitCost: unitCost ?? null,
            supplierTransactionId: supplierTransactionId ?? null,
            reason: reason ?? null,
            occurredAt: occurred,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        tx.update(prodRef, {
            currentStock: nextStock,
            updatedAt: serverTimestamp(),
        });

        return nextStock;
    });

    return { eventId: eventRef.id, newStock };
}

export interface ListInventoryEventsArgs {
    limit?: number;
}

/**
 * Recent inventory events across all products, newest first. Filtering by a
 * single product is done client-side to avoid a composite index requirement.
 */
export async function listInventoryEvents(
    accountId: string,
    args: ListInventoryEventsArgs = {}
): Promise<InventoryEvent[]> {
    const { limit = 100 } = args;
    const q = query(
        inventoryEventsCol(accountId),
        orderBy("occurredAt", "desc"),
        fbLimit(limit)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as InventoryEvent);
}
