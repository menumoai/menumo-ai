// src/models/loyalty.ts
import type { Timestamp } from "firebase/firestore";

export type LoyaltyEventType =
  | "signup"
  | "points_earned"
  | "points_spent"
  | "reward_redeemed"
  | "tier_change"
  | "adjustment";

export interface LoyaltyEvent {
  id: string;
  accountId: string;
  customerId: string;

  orderId?: string | null;

  type: LoyaltyEventType;
  pointsDelta: number;

  description?: string | null;
  occurredAt: Timestamp;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

