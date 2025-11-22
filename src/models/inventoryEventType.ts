// src/models/inventoryEvent.ts
import type { Timestamp } from "firebase/firestore";

export type InventoryEventType = "purchase" | "sale" | "waste" | "adjustment";

export interface InventoryEvent {
  id: string;
  accountId: string;
  productId: string;

  type: InventoryEventType;
  quantityDelta: number;  // + for in, - for out
  unitCost?: number;      // per-unit cost for purchases

  supplierTransactionId?: string | null;

  reason?: string | null;
  occurredAt: Timestamp;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

