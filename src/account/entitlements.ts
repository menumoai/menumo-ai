// src/account/entitlements.ts
//
// Resolves an account to a priced plan, and answers what that plan unlocks.
//
// This is the seam the pricing page has been promising since src/config/plans.ts
// landed: PLANS and CAPABILITY_MATRIX describe what each tier gets, but nothing
// read them, so "Advanced P&L on Business" was marketing copy with no behaviour.
//
// THE TIER MISMATCH
//   BusinessAccount.subscriptionTier is still "mvp" | "growth" | "pro" |
//   "custom" - the pre-pricing names. PlanId is "essentials" | "pro" |
//   "business". Rather than block gating on a rename plus a data migration,
//   LEGACY_TIER_TO_PLAN bridges the two. When the rename happens, delete the map
//   and read the field directly; nothing else here changes.

import {
    PLANS,
    TRIAL_PLAN,
    planCovers,
    type PlanId,
} from "../config/plans";
import type { BusinessAccount, SubscriptionTier } from "../models/account";
import { ENFORCE_PLAN_GATES } from "../config/access";

/**
 * Bridge from the legacy tier names to priced plans.
 *
 * "mvp" is what createBusinessAccount still defaults every new account to, so
 * it must map to something sane rather than throwing.
 */
const LEGACY_TIER_TO_PLAN: Record<SubscriptionTier, PlanId> = {
    mvp: "essentials",
    growth: "pro",
    pro: "pro",
    custom: "business",
};

/**
 * The plan an account is effectively on right now.
 *
 * A live trial resolves to TRIAL_PLAN regardless of the stored tier: every trial
 * runs at the full toolkit, which is the promise made on /get-started. A lapsed
 * or cancelled subscription falls back to the entry plan rather than locking the
 * account out entirely - losing paid extras is proportionate, losing your own
 * books is not.
 */
export function resolvePlan(account: BusinessAccount | null | undefined): PlanId {
    if (!account) return "essentials";

    if (account.subscriptionStatus === "trial") {
        return TRIAL_PLAN;
    }

    if (
        account.subscriptionStatus === "canceled" ||
        account.subscriptionStatus === "past_due"
    ) {
        return "essentials";
    }

    return LEGACY_TIER_TO_PLAN[account.subscriptionTier] ?? "essentials";
}

/**
 * Capabilities that are gated. Keys are stable identifiers used at call sites;
 * values are the lowest plan that includes them, matching CAPABILITY_MATRIX in
 * src/config/plans.ts.
 *
 * Only add a key here when the pricing page actually sells it. A gate with no
 * corresponding row in the matrix is a feature we are withholding without ever
 * having offered it.
 */
export const GATED_CAPABILITIES = {
    /**
     * "Advanced P&L" on the pricing table. Basic P&L - the current period, its
     * KPIs and the expense breakdown - stays on every plan, because an owner
     * being unable to see whether this month made money is not a plan we sell.
     * What is advanced is the comparative reporting: quarter and year periods,
     * the six-month trend, and CSV export.
     */
    advancedPnl: "business",
    posIntegration: "pro",
    invoicePhotoIntake: "pro",
    marketingAndLoyalty: "pro",
    menumoPay: "business",
    apiAccess: "business",
} as const satisfies Record<string, PlanId>;

export type GatedCapability = keyof typeof GATED_CAPABILITIES;

/** Whether an account's plan includes a capability. */
export function hasCapability(
    account: BusinessAccount | null | undefined,
    capability: GatedCapability,
): boolean {
    // Temporarily open while the beta runs. See the note in
    // src/config/access.ts - this is the only line that needs changing back.
    if (!ENFORCE_PLAN_GATES) return true;

    return planCovers(resolvePlan(account), GATED_CAPABILITIES[capability]);
}

/** The cheapest plan that unlocks a capability, for upgrade copy. */
export function requiredPlanFor(capability: GatedCapability) {
    const id = GATED_CAPABILITIES[capability];
    return PLANS.find((p) => p.id === id) ?? PLANS[PLANS.length - 1];
}
