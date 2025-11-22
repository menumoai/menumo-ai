// src/models/account.ts
import type { Timestamp } from "firebase/firestore";

export type SubscriptionTier = "mvp" | "growth" | "pro" | "custom";
export type SubscriptionStatus = "trial" | "active" | "past_due" | "canceled";

export interface BusinessAccount {
  id: string; // Firestore doc ID: /accounts/{id}
  name: string;
  legalName?: string;
  email?: string;
  phone?: string;

  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  county?: string;
  country?: string;

  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartAt?: Timestamp | null;
  subscriptionEndAt?: Timestamp | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

