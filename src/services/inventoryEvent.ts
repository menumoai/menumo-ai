// src/services/inventoryEvent.ts
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseClient";
import type { InventoryEvent, InventoryEventType } from "../models/inventoryEvent";

const inventoryEventsCol = (accountId: string) =>
  collection(db, "accounts", accountId, "inventoryEvents");

export async function createInventoryEvent(params: {
  accountId: string;
  productId: string;
  type: InventoryEventType;
  quantityDelta: number;
  unitCost?: number;
  supplierTransactionId?: string;
  reason?: string;
  occurredAt?: Date;
}) {
  const {
    accountId,
    productId,
    type,
    quantityDelta,
    unitCost,
    supplierTransactionId,
    reason,
    occurredAt,
  } = params;

  const col = inventoryEventsCol(accountId);
  const ref = doc(col);

  await setDoc(ref, {
    id: ref.id,
    accountId,
    productId,
    type,
    quantityDelta,
    unitCost: unitCost ?? null,
    supplierTransactionId: supplierTransactionId ?? null,
    reason: reason ?? null,
    occurredAt: occurredAt ?? new Date(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

