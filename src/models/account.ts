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
  posConnected?: boolean;
  posProvider?: string | null;

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

  /**
   * Owner-supplied inputs for the tax set-aside estimate on /finance. Absent
   * until they fill the form in; the page prompts rather than guessing, because
   * filing status and state rate change the number substantially.
   */
  taxProfile?: {
    filingStatus: "single" | "married_joint" | "head_of_household";
    stateEffectiveRatePct: number;
    otherHouseholdIncome: number;
  } | null;

  /**
   * Set once the setup checklist on /get-started reaches 5 of 5. Only used to
   * stop the post-signup redirect and demote the sidebar item; the individual
   * step ticks are always derived from real data, never stored.
   */
  onboardingCompletedAt?: Timestamp | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
