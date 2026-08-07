// src/config/plans.ts
//
// Plan identity and entitlements. NOT the source of truth for what things cost.
//
// THE SPLIT, AND WHY
//   Stripe owns what is on sale: the amounts, the plan names and blurbs, the
//   feature bullets, and which plans appear at all. `api/plans.ts` reads that
//   catalog live, so changing a price or withdrawing a plan is a Dashboard
//   action rather than a deploy. That is the whole point - the amounts below
//   used to be authoritative, which made every price change a code change.
//
//   This file owns what a plan MEANS: the `PlanId` union, the order of the
//   ladder, the enforced limits, and the capability matrix. Those decide what a
//   paying customer can actually do, and they are checked at compile time by
//   `hasCapability`. Moving them into Dashboard metadata would turn a type error
//   into a text field anyone can mistype, with no review and no rollback.
//
//   Rule of thumb: the Dashboard owns how money is collected, code owns what the
//   customer gets.
//
//   The prices below survive as FALLBACK_CATALOG, rendered only when the live
//   catalog cannot be reached. They can therefore go stale without breaking
//   anything, but a stale fallback still shows a wrong price during an outage,
//   so keep them roughly current.

export type PlanId = "essentials" | "pro" | "business";

/** How often a subscription bills. Both are sold for every plan. */
export type BillingInterval = "monthly" | "annual";

export const BILLING_INTERVALS: readonly BillingInterval[] = ["monthly", "annual"];

/** Length of the no-card trial every new account starts on. */
export const TRIAL_DAYS = 14;

/** The plan a trial runs at. Everyone gets the full toolkit for the trial. */
export const TRIAL_PLAN: PlanId = "pro";

/** The interval an owner sees first. Monthly is the lower commitment. */
export const DEFAULT_BILLING_INTERVAL: BillingInterval = "monthly";

/**
 * The annual discount, expressed the way it is sold: pay for ten months, get
 * twelve. Every `priceAnnual` below is exactly `priceMonthly * 10`, and
 * `annualSavings` re-derives the headline number rather than restating it, so
 * the "2 months free" promise cannot drift away from the amounts charged.
 */
export const ANNUAL_MONTHS_FREE = 2;

/**
 * A plan's static definition.
 *
 * Mixed ownership, deliberately. `name`, `tagline`, `highlights` and the two
 * prices are the *fallback* copy: Stripe holds the live versions and the seed
 * script pushes these there, so these values are what renders when the catalog
 * endpoint is unreachable. The limits below are code-owned and always
 * authoritative, because app code enforces them.
 */
export interface Plan {
    id: PlanId;
    name: string;
    /** Fallback amount. Stripe's active price is authoritative. */
    priceMonthly: number;
    /** Fallback amount. Two months cheaper than twelve monthly charges. */
    priceAnnual: number;
    /** Who the plan is for, in one line. */
    tagline: string;
    /** Analytics history window in days. `null` means unlimited. Code-owned. */
    historyDays: number | null;
    /** Code-owned. */
    locations: number;
    /** Code-owned. */
    aiCreditsPerWeek: number;
    /** Short bullets for the plan card, in display order. */
    highlights: string[];
}

/**
 * A plan as it is on sale right now, which is what every price-rendering
 * component takes.
 *
 * The prices are nullable because an interval can be withdrawn on its own:
 * archiving just the annual price in Stripe leaves a monthly-only plan, and the
 * UI has to render that rather than print `$undefined`. A plan with both prices
 * archived does not appear in the catalog at all, which is how a plan is
 * retired without a deploy.
 *
 * `Plan` is structurally assignable to this, so the fallback constants and the
 * live catalog flow through the same helpers and the same components.
 */
export interface CatalogPlan {
    id: PlanId;
    name: string;
    tagline: string;
    highlights: readonly string[];
    /** Dollars, or null when that interval is not on sale. */
    priceMonthly: number | null;
    priceAnnual: number | null;
}

export const PLANS: readonly Plan[] = [
    {
        id: "essentials",
        name: "Essentials",
        priceMonthly: 50,
        priceAnnual: 500,
        tagline: "One truck, running the basics well.",
        historyDays: 90,
        locations: 1,
        aiCreditsPerWeek: 10,
        highlights: [
            "Dashboard and food costing",
            "Orders, expenses, inventory",
            "90 days of history",
            "10 AI questions a week",
        ],
    },
    {
        id: "pro",
        name: "Pro",
        priceMonthly: 79,
        priceAnnual: 790,
        tagline: "The full toolkit, including invoice photo intake.",
        historyDays: null,
        locations: 1,
        aiCreditsPerWeek: 30,
        highlights: [
            "Everything in Essentials",
            "Invoice photo intake",
            "Waste tracking and POS sync",
            "Unlimited history",
            "30 AI questions a week",
        ],
    },
    {
        id: "business",
        name: "Business",
        priceMonthly: 149,
        priceAnnual: 1490,
        tagline: "Several trucks, or a truck plus a kitchen.",
        historyDays: null,
        locations: 10,
        aiCreditsPerWeek: 75,
        highlights: [
            "Everything in Pro",
            "Up to 10 locations",
            "Advanced P&L",
            "Menumo Pay and API",
            "75 AI questions a week",
        ],
    },
];

/** Ordered cheapest first, so `>=` comparisons on the index mean "at least". */
export const PLAN_ORDER: readonly PlanId[] = PLANS.map((p) => p.id);

export function getPlan(id: PlanId): Plan {
    const plan = PLANS.find((p) => p.id === id);
    if (!plan) throw new Error(`Unknown plan: ${id}`);
    return plan;
}

/**
 * What the pricing pages render when the live catalog cannot be reached.
 *
 * Every plan is listed as on sale, which is the right way to be wrong here: an
 * owner briefly seeing a plan that was withdrawn last week is a smaller failure
 * than a Stripe blip emptying the pricing page. Checkout still resolves against
 * Stripe, so a genuinely withdrawn plan fails at the point of purchase rather
 * than being sold.
 */
export const FALLBACK_CATALOG: readonly CatalogPlan[] = PLANS.map((plan) => ({
    id: plan.id,
    name: plan.name,
    tagline: plan.tagline,
    highlights: plan.highlights,
    priceMonthly: plan.priceMonthly,
    priceAnnual: plan.priceAnnual,
}));

export function isPlanId(value: unknown): value is PlanId {
    return typeof value === "string" && PLAN_ORDER.includes(value as PlanId);
}

export function isBillingInterval(value: unknown): value is BillingInterval {
    return (
        typeof value === "string" &&
        BILLING_INTERVALS.includes(value as BillingInterval)
    );
}

/**
 * What the plan costs per charge, in dollars, at the chosen interval.
 *
 * Null means that interval is not on sale. Callers have to handle it rather
 * than being handed a `0` or a `NaN` to render, because a pricing page printing
 * "$0" for a withdrawn plan is worse than one that says nothing.
 */
export function priceFor(
    plan: CatalogPlan,
    interval: BillingInterval,
): number | null {
    return interval === "annual" ? plan.priceAnnual : plan.priceMonthly;
}

/** Whether a plan can be bought at all, at either interval. */
export function isOnSale(plan: CatalogPlan): boolean {
    return plan.priceMonthly !== null || plan.priceAnnual !== null;
}

/**
 * What an annual plan works out to per month, for like-for-like comparison
 * against the monthly column. Two decimals because these do not divide evenly -
 * $790 a year is $65.83 a month, and rounding it to $66 would overstate the
 * price of the thing we are trying to sell.
 */
export function monthlyEquivalent(plan: CatalogPlan): number | null {
    if (plan.priceAnnual === null) return null;
    return Math.round((plan.priceAnnual / 12) * 100) / 100;
}

/**
 * Dollars saved in a year by paying annually rather than twelve times.
 *
 * Null when either price is missing, and also when the annual price is not
 * actually cheaper. Stripe owns these amounts now, so "annual saves you money"
 * is no longer structurally guaranteed the way it was when both numbers lived
 * in this file - a saving of zero or less is a pricing mistake, and the honest
 * response is to print no saving rather than "Save $0" or "Save -$40".
 */
export function annualSavings(plan: CatalogPlan): number | null {
    if (plan.priceMonthly === null || plan.priceAnnual === null) return null;
    const saving = plan.priceMonthly * 12 - plan.priceAnnual;
    return saving > 0 ? saving : null;
}

/**
 * Money as an owner writes it: `$1,490`, and `$41.67` only where the number
 * genuinely has cents. Padding whole dollars to `$500.00` would add noise to
 * every headline price for the sake of the one derived figure that needs it.
 */
export function formatPrice(amount: number): string {
    const hasCents = Math.round(amount * 100) % 100 !== 0;
    return `$${amount.toLocaleString("en-US", {
        minimumFractionDigits: hasCents ? 2 : 0,
        maximumFractionDigits: 2,
    })}`;
}

/**
 * The Stripe `lookup_key` for one plan at one interval, as created by
 * `scripts/stripe-seed-products.mjs`.
 *
 * Resolving prices by lookup key rather than holding price IDs in env vars means
 * there is one less thing to keep in step across test mode, live mode and the
 * deploy config: the IDs differ per mode, the keys do not.
 *
 * It lives here, next to the amounts, rather than in `api/_stripe.ts`, because
 * the seed script cannot import from `api/` - those files use `.js` specifiers
 * for Vercel's loader, which Node's type stripping will not resolve back to
 * `.ts`. This file is the one place both the runtime and the seeder can read, so
 * putting the key format anywhere else means writing it twice.
 */
export function stripeLookupKey(
    planId: PlanId,
    interval: BillingInterval,
): string {
    return `menumo_${planId}_${interval === "annual" ? "annual" : "monthly"}`;
}

/** Every lookup key Menumo sells under, for a single batched price lookup. */
export function allLookupKeys(): string[] {
    return PLAN_ORDER.flatMap((planId) =>
        BILLING_INTERVALS.map((interval) => stripeLookupKey(planId, interval)),
    );
}

/**
 * The inverse of `stripeLookupKey`, and the reason the webhook can trust a price
 * nobody stamped metadata onto.
 *
 * A price is only reachable by a customer if checkout resolved it, and checkout
 * resolves purely by lookup key - so on any price that can actually be bought,
 * the key is guaranteed correct in a way `metadata.plan_id` is not. Someone
 * creating a price in the Dashboard has to set the lookup key for it to sell at
 * all, but nothing forces them to fill in the metadata, and before this existed
 * that omission took the customer's money and never upgraded their account.
 *
 * Returns null for anything not matching the format, including a price
 * belonging to some other product entirely.
 */
export function parseLookupKey(
    key: string | null | undefined,
): { planId: PlanId; interval: BillingInterval } | null {
    if (!key) return null;

    const match = /^menumo_(.+)_(monthly|annual)$/.exec(key);
    if (!match) return null;

    const [, planId, interval] = match;
    if (!isPlanId(planId) || !isBillingInterval(interval)) return null;

    return { planId, interval };
}

/** True when `held` includes everything `required` does. */
export function planCovers(held: PlanId, required: PlanId): boolean {
    return PLAN_ORDER.indexOf(held) >= PLAN_ORDER.indexOf(required);
}

/**
 * The entitlement matrix, as rows. `value` is what each plan gets: `true` for a
 * plain yes, `false` for a no, or a string for a limit worth spelling out.
 */
export interface CapabilityRow {
    label: string;
    /** Plain-English clarification shown under the label. Never internals. */
    hint?: string;
    values: Record<PlanId, boolean | string>;
}

export const CAPABILITY_MATRIX: readonly CapabilityRow[] = [
    {
        label: "Dashboard",
        values: { essentials: true, pro: true, business: true },
    },
    {
        label: "Food cost calculator",
        values: { essentials: true, pro: true, business: true },
    },
    {
        label: "Orders and expenses",
        values: { essentials: true, pro: true, business: true },
    },
    {
        label: "Inventory with batches and expiry",
        values: { essentials: true, pro: true, business: true },
    },
    {
        label: "Analytics history",
        hint: "How far back your reports can look",
        values: { essentials: "90 days", pro: "Unlimited", business: "Unlimited" },
    },
    {
        label: "Invoice photo intake (OCR)",
        hint: "Reads a photo of a supplier invoice",
        values: { essentials: false, pro: true, business: true },
    },
    {
        label: "Waste and spoilage tracking",
        values: { essentials: false, pro: true, business: true },
    },
    {
        label: "POS integration",
        hint: "Not built yet",
        values: { essentials: false, pro: true, business: true },
    },
    {
        label: "Marketing and loyalty",
        hint: "Not built yet",
        values: { essentials: false, pro: true, business: true },
    },
    {
        label: "Locations",
        hint: "Separate trucks or regular pitches",
        values: { essentials: "1", pro: "1", business: "Up to 10" },
    },
    {
        label: "Advanced P&L",
        values: { essentials: false, pro: false, business: true },
    },
    {
        label: "Menumo Pay processing",
        hint: "Not built yet",
        values: { essentials: false, pro: false, business: true },
    },
    {
        label: "API access",
        hint: "Not built yet",
        values: { essentials: false, pro: false, business: true },
    },
    {
        label: "AI questions per week",
        values: { essentials: "10", pro: "30", business: "75" },
    },
];
