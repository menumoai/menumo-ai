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
//   "custom" - the pre-pricing names. PlanId is "pro" | "business". Rather than
//   block gating on a rename plus a data migration, LEGACY_TIER_TO_PLAN bridges
//   the two. When the rename happens, delete the map and read the field
//   directly; nothing else here changes.
//
//   Stripe sidestepped the mismatch rather than resolving it. Paid accounts
//   carry `subscription.planId`, which is already a PlanId, so resolvePlan reads
//   that first and only falls through to the legacy map for accounts that have
//   never been to checkout. The migration that finally deletes the map is
//   therefore about back-filling those, not about changing this logic.
//
// THE WITHDRAWN TIER
//   "essentials" used to be the entry plan and the floor everything fell back
//   to. It was withdrawn from sale, so FLOOR_PLAN is now Pro.
//
//   That has a consequence worth being clear-eyed about: Pro is simultaneously
//   the cheapest thing anyone can buy, the plan trials run at, and the plan a
//   lapsed account drops to. Below Business there is now nothing to pay for, so
//   when ENFORCE_PLAN_GATES is switched on it will gate Business features and
//   nothing else.

import {
    PLANS,
    TRIAL_PLAN,
    isPlanId,
    planCovers,
    type PlanId,
} from "../config/plans";
import type { BusinessAccount, SubscriptionTier } from "../models/account";
import { ENFORCE_PLAN_GATES } from "../config/access";

/**
 * What an account gets when it is not paying for anything: no subscription, a
 * lapsed one, or a legacy tier with no better answer.
 *
 * Named rather than inlined because it appears in five places, and the whole
 * point of it is that they agree. It moved from "essentials" to "pro" when
 * Essentials was withdrawn - see the note at the top of this file.
 */
export const FLOOR_PLAN: PlanId = "pro";

/**
 * Bridge from the legacy tier names to priced plans.
 *
 * "mvp" is what createBusinessAccount still defaults every new account to, so
 * it must map to something sane rather than throwing.
 */
const LEGACY_TIER_TO_PLAN: Record<SubscriptionTier, PlanId> = {
    mvp: FLOOR_PLAN,
    growth: "pro",
    pro: "pro",
    custom: "business",
};

/**
 * The plan an account is effectively on right now.
 *
 * Stripe wins when it has an opinion. `account.subscription` is written only by
 * the webhook through the Admin SDK and is denied to clients by Firestore rules,
 * whereas the legacy fields below have always been client-writable - so the two
 * are not merely different sources, they are different trust levels. Reading the
 * legacy fields first would mean a plan anyone could grant themselves from
 * devtools outranked the one they actually paid for.
 *
 * A live trial resolves to TRIAL_PLAN only in the pre-checkout case, where no
 * plan has been chosen yet and /get-started has promised the full toolkit. Once
 * a subscription exists the owner has picked a tier, and their trial runs at
 * that tier rather than being silently upgraded.
 *
 * A lapsed or cancelled subscription falls back to the entry plan rather than
 * locking the account out - losing paid extras is proportionate, losing your own
 * books is not.
 */
export function resolvePlan(account: BusinessAccount | null | undefined): PlanId {
    if (!account) return FLOOR_PLAN;

    const stripe = account.subscription;
    if (stripe) {
        if (stripe.status === "canceled" || stripe.status === "past_due") {
            return FLOOR_PLAN;
        }

        // Validated rather than returned as-is, because the stored value is
        // only as current as the day it was written. An account that
        // subscribed to Essentials still has `planId: "essentials"` in
        // Firestore, and TypeScript cannot catch that - the field is typed
        // PlanId, but the document was written before the union shrank.
        // Returning it unchecked would send an unknown id into `planCovers`,
        // where `PLAN_ORDER.indexOf` yields -1 and quietly denies the account
        // every gated capability it holds.
        return isPlanId(stripe.planId) ? stripe.planId : FLOOR_PLAN;
    }

    if (account.subscriptionStatus === "trial") {
        return TRIAL_PLAN;
    }

    if (
        account.subscriptionStatus === "canceled" ||
        account.subscriptionStatus === "past_due"
    ) {
        return FLOOR_PLAN;
    }

    return LEGACY_TIER_TO_PLAN[account.subscriptionTier] ?? FLOOR_PLAN;
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
