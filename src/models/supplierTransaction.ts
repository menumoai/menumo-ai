// src/models/supplierTransaction.ts
import type { Timestamp } from "firebase/firestore";

export type SupplierTransactionType = "inventory" | "equipment" | "fees" | "other";

export interface SupplierTransaction {
  id: string;
  accountId: string;

  supplierName: string;
  transactionDate: Timestamp;

  totalAmount: number;
  currency?: string | null;

  transactionType: SupplierTransactionType;

  receiptImageUrl?: string | null;
  ocrText?: string | null;

  notes?: string | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

