// src/config/plans.ts
//
// Single source of truth for the priced plans. The public /get-started page and
// the in-app plan blocks both read from here, so marketing copy and entitlement
// checks can never drift apart. When the entitlement layer lands it should gate
// on `PlanId` and the capability rows below rather than on new constants.

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

export interface Plan {
    id: PlanId;
    name: string;
    priceMonthly: number;
    /** Billed once a year. Two months cheaper than twelve monthly charges. */
    priceAnnual: number;
    /** Who the plan is for, in one line. */
    tagline: string;
    /** Analytics history window in days. `null` means unlimited. */
    historyDays: number | null;
    locations: number;
    aiCreditsPerWeek: number;
    /** Short bullets for the plan card, in display order. */
    highlights: string[];
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

export function isPlanId(value: unknown): value is PlanId {
    return typeof value === "string" && PLAN_ORDER.includes(value as PlanId);
}

export function isBillingInterval(value: unknown): value is BillingInterval {
    return (
        typeof value === "string" &&
        BILLING_INTERVALS.includes(value as BillingInterval)
    );
}

/** What the plan costs per charge, in dollars, at the chosen interval. */
export function priceFor(plan: Plan, interval: BillingInterval): number {
    return interval === "annual" ? plan.priceAnnual : plan.priceMonthly;
}

/**
 * What an annual plan works out to per month, for like-for-like comparison
 * against the monthly column. Two decimals because these do not divide evenly -
 * $790 a year is $65.83 a month, and rounding it to $66 would overstate the
 * price of the thing we are trying to sell.
 */
export function monthlyEquivalent(plan: Plan): number {
    return Math.round((plan.priceAnnual / 12) * 100) / 100;
}

/** Dollars saved in a year by paying annually rather than twelve times. */
export function annualSavings(plan: Plan): number {
    return plan.priceMonthly * 12 - plan.priceAnnual;
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
