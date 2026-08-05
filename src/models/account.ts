// src/models/account.ts
import type { Timestamp } from "firebase/firestore";
import type { BillingInterval, PlanId } from "../config/plans";

export type SubscriptionTier = "mvp" | "growth" | "pro" | "custom";
export type SubscriptionStatus = "trial" | "active" | "past_due" | "canceled";

/**
 * Subscription state as reported by Stripe.
 *
 * Written only by `api/stripe-webhook.ts` through the Admin SDK, which bypasses
 * Firestore rules; the rules forbid clients from writing this block at all.
 * That is precisely what makes it safe to gate paid features on, and it is why
 * this is a separate field rather than a reuse of `subscriptionTier` above -
 * that one has always been client-writable and stays that way for signup.
 *
 * Absent until an account completes checkout for the first time.
 */
export interface AccountSubscription {
    /** The plan Stripe is billing for, from the price's `plan_id` metadata. */
    planId: PlanId;
    status: SubscriptionStatus;

    /**
     * How often the subscription bills, read from the Stripe price's own
     * `recurring.interval`.
     *
     * Null for a subscription on a price that is neither plain monthly nor plain
     * yearly - only reachable by hand-creating one in the Dashboard. The UI
     * treats null as "do not claim a cadence" rather than assuming monthly,
     * because telling someone on a yearly plan that they renew next month is a
     * worse failure than saying nothing.
     *
     * The interval never affects entitlements: an annual Pro and a monthly Pro
     * are the same plan, so only `planId` is gated on.
     */
    interval?: BillingInterval | null;

    stripeCustomerId: string;
    stripeSubscriptionId: string;
    stripePriceId: string;

    /** End of the paid period. Also when a pending cancellation takes effect. */
    currentPeriodEnd?: Timestamp | null;
    /** Set while a trial is running, null once it converts or lapses. */
    trialEndsAt?: Timestamp | null;
    /** The owner has cancelled, but the period they paid for is still running. */
    cancelAtPeriodEnd: boolean;

    /**
     * `created` of the Stripe event that last wrote this block, in epoch
     * seconds. Stripe redelivers events and does not guarantee ordering, so the
     * receiver ignores anything older than this. Without it a delayed
     * `trialing` event can land after `active` and silently downgrade a paying
     * account.
     */
    lastEventAt: number;
    updatedAt: Timestamp;
}

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

  /**
   * The pre-pricing tier names, still written by `createBusinessAccount` at
   * signup. `subscription` below supersedes these for anything that gates a
   * feature - see `resolvePlan` in src/account/entitlements.ts.
   */
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartAt?: Timestamp | null;
  subscriptionEndAt?: Timestamp | null;

  /**
   * The Stripe customer for this business, written server-side the first time
   * checkout is started. Kept outside `subscription` because a customer exists
   * from the moment checkout begins, whereas a subscription only exists once it
   * completes - storing it here is what stops an abandoned checkout minting a
   * second customer for the same business on the next attempt.
   */
  stripeCustomerId?: string | null;

  /** Server-written Stripe state. Absent until the first checkout. */
  subscription?: AccountSubscription | null;

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
