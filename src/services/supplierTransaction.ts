// src/services/supplierTransaction.ts
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseClient";
import type { SupplierTransaction, SupplierTransactionType } from "../models/supplierTransaction";

const suppliersCol = (accountId: string) =>
  collection(db, "accounts", accountId, "suppliers");

export async function createSupplierTransaction(params: {
  accountId: string;
  id?: string;
  supplierName: string;
  transactionDate?: Date;
  totalAmount: number;
  currency?: string;
  transactionType?: SupplierTransactionType;
  receiptImageUrl?: string;
  ocrText?: string;
  notes?: string;
}) {
  const {
    accountId,
    id,
    supplierName,
    transactionDate,
    totalAmount,
    currency,
    transactionType = "inventory",
    receiptImageUrl,
    ocrText,
    notes,
  } = params;

  if (id) {
    const ref = doc(suppliersCol(accountId), id);
    await setDoc(
      ref,
      {
        id,
        accountId,
        supplierName,
        transactionDate: transactionDate ?? new Date(),
        totalAmount,
        currency: currency ?? null,
        transactionType,
        receiptImageUrl: receiptImageUrl ?? null,
        ocrText: ocrText ?? null,
        notes: notes ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return id;
  } else {
    const ref = await addDoc(suppliersCol(accountId), {
      accountId,
      supplierName,
      transactionDate: transactionDate ?? new Date(),
      totalAmount,
      currency: currency ?? null,
      transactionType,
      receiptImageUrl: receiptImageUrl ?? null,
      ocrText: ocrText ?? null,
      notes: notes ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(ref, { id: ref.id }, { merge: true });
    return ref.id;
  }
}

export async function listSupplierTransactions(
  accountId: string
): Promise<SupplierTransaction[]> {
  const q = query(suppliersCol(accountId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as SupplierTransaction);
}

