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
   * The statutory figures the tax estimate runs on, as confirmed or corrected by
   * the owner or their accountant.
   *
   * Menumo ships defaults so the page works immediately, but they were
   * transcribed by hand rather than taken from an IRS feed. Until someone
   * records that they have checked them, the estimate is labelled unverified.
   * `verifiedAt` is the whole point of this field: it is the difference between
   * a number a human stands behind and a number we recalled.
   */
  taxFigures?: {
    taxYear: number;
    standardDeduction: number;
    brackets: { upTo: number; rate: number }[];
    ssWageBase: number;
    qbiThreshold: number;
    addlMedicareThreshold: number;
    /** Set when a person confirms these against the IRS source. */
    verifiedAt?: Timestamp | null;
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
