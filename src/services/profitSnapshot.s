// src/services/profitSnapshot.ts
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseClient";
import type { ProfitSnapshot } from "../models/profitSnapshot";

const profitSnapshotsCol = (accountId: string) =>
  collection(db, "accounts", accountId, "profitSnapshots");

export async function createProfitSnapshot(params: {
  accountId: string;
  label?: string;
  granularity: ProfitSnapshot["granularity"];
  startAt: Date;
  endAt: Date;
  grossSales: number;
  discounts?: number;
  refunds?: number;
  netSales: number;
  costOfGoodsSold: number;
  otherExpenses?: number;
  profit: number;
}) {
  const {
    accountId,
    label,
    granularity,
    startAt,
    endAt,
    grossSales,
    discounts = 0,
    refunds = 0,
    netSales,
    costOfGoodsSold,
    otherExpenses = 0,
    profit,
  } = params;

  const ref = await addDoc(profitSnapshotsCol(accountId), {
    accountId,
    label: label ?? null,
    granularity,
    startAt,
    endAt,
    grossSales,
    discounts,
    refunds,
    netSales,
    costOfGoodsSold,
    otherExpenses,
    profit,
    generatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(ref, { id: ref.id }, { merge: true });
  return ref.id;
}

export async function listProfitSnapshots(
  accountId: string
): Promise<ProfitSnapshot[]> {
  const q = query(profitSnapshotsCol(accountId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ProfitSnapshot);
}

