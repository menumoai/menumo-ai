// src/models/profitSnapshot.ts
import type { Timestamp } from "firebase/firestore";

export type ProfitGranularity = "day" | "event" | "custom";

export interface ProfitSnapshot {
  id: string;
  accountId: string;

  granularity: ProfitGranularity;
  label?: string | null;

  startAt: Timestamp;
  endAt: Timestamp;

  grossSales: number;
  discounts: number;
  refunds: number;
  netSales: number;
  costOfGoodsSold: number;
  otherExpenses: number;
  profit: number;

  generatedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

