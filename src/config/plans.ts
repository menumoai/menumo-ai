// src/config/plans.ts
//
// Single source of truth for the priced plans. The public /get-started page and
// the in-app plan blocks both read from here, so marketing copy and entitlement
// checks can never drift apart. When the entitlement layer lands it should gate
// on `PlanId` and the capability rows below rather than on new constants.

export type PlanId = "essentials" | "pro" | "business";

/** Length of the no-card trial every new account starts on. */
export const TRIAL_DAYS = 14;

/** The plan a trial runs at. Everyone gets the full toolkit for the trial. */
export const TRIAL_PLAN: PlanId = "pro";

export interface Plan {
    id: PlanId;
    name: string;
    priceMonthly: number;
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
        priceMonthly: 29,
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
