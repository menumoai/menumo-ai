// src/config/features.ts
//
// The complete Menumo feature catalog, and the honest build status of each one.
// This drives the "what you can do today" grid and the beta status board on
// /get-started. It is deliberately data-only (no React, no icon components) so
// updating what we claim is a one-line edit that needs no UI knowledge.
//
// Rules for editing:
//   live     - a user can reach it in the app right now and it works
//   building - real code exists but it is not reachable or not finished
//   planned  - nothing is built; do not imply otherwise, and never add a date

import type { PlanId } from "./plans";

export type FeatureStatus = "live" | "building" | "planned";

export type FeatureArea =
    | "money"
    | "menu"
    | "operations"
    | "growth"
    | "platform";

export interface Feature {
    id: string;
    /** Named by what the operator gets, not by what the module is called. */
    name: string;
    blurb: string;
    /** In-app route, when there is one. */
    route?: string;
    status: FeatureStatus;
    /** Lowest plan that includes it. `null` means every plan. */
    minPlan: PlanId | null;
    area: FeatureArea;
    /** Key into the icon map in components/onboarding/featureIcons.ts */
    icon: string;
}

export const FEATURES: readonly Feature[] = [
    // ---------------------------------------------------------------- money
    {
        id: "dashboard",
        name: "Daily dashboard",
        blurb: "Today's sales, order count and average ticket, measured against your recent average.",
        route: "/dashboard",
        status: "live",
        minPlan: null,
        area: "money",
        icon: "dashboard",
    },
    {
        id: "revenue-analytics",
        name: "Revenue analytics",
        blurb: "Revenue trends by day and hour, best and worst sellers, and which channel actually pays.",
        route: "/analytics/revenue",
        status: "live",
        minPlan: null,
        area: "money",
        icon: "chart",
    },
    {
        id: "expenses",
        name: "Expense tracking",
        blurb: "Log fuel, permits, commissary and one-off costs, with live totals as they change.",
        route: "/expenses",
        status: "live",
        minPlan: null,
        area: "money",
        icon: "dollar",
    },
    {
        id: "finance",
        name: "Profit and tax summary",
        blurb: "Revenue against real costs, so month end is a number you already know.",
        route: "/finance",
        status: "live",
        minPlan: null,
        area: "money",
        icon: "receipt",
    },

    // ----------------------------------------------------------------- menu
    {
        id: "food-cost",
        name: "Food cost per item",
        blurb: "Price every dish against what it actually costs to make and see the true margin.",
        route: "/menu",
        status: "live",
        minPlan: null,
        area: "menu",
        icon: "chef",
    },
    {
        id: "menu-matrix",
        name: "Menu matrix",
        blurb: "Sorts the menu into stars, plowhorses, puzzles and dogs so you know what to cut.",
        route: "/menu",
        status: "live",
        minPlan: null,
        area: "menu",
        icon: "grid",
    },

    // ----------------------------------------------------------- operations
    {
        id: "orders",
        name: "Order log",
        blurb: "Every order with its channel and status, searchable and open to the line items.",
        route: "/orders",
        status: "live",
        minPlan: null,
        area: "operations",
        icon: "utensils",
    },
    {
        id: "order-entry",
        name: "Manual order entry",
        blurb: "Ring up a sale by hand when you are not running a connected POS.",
        route: "/orders/new",
        status: "live",
        minPlan: null,
        area: "operations",
        icon: "plus",
    },
    {
        id: "inventory",
        name: "Inventory with batches",
        blurb: "Stock tracked by batch, so you know what came in when and what it cost.",
        route: "/inventory",
        status: "live",
        minPlan: null,
        area: "operations",
        icon: "boxes",
    },
    {
        id: "ocr-intake",
        name: "Invoice photo intake",
        blurb: "Photograph a supplier invoice. We read the supplier, date, total and every line item, normalize pack sizes to a base unit, and stock it with an expiry date.",
        route: "/inventory",
        status: "live",
        minPlan: "pro",
        area: "operations",
        icon: "camera",
    },
    {
        id: "expiry",
        name: "Expiry and spoilage risk",
        blurb: "Shelf-life defaults per category flag what is about to turn before it costs you.",
        route: "/inventory",
        status: "live",
        minPlan: null,
        area: "operations",
        icon: "clock",
    },
    {
        id: "low-stock",
        name: "Low stock and reorder points",
        blurb: "Set a floor per ingredient and get told before you run out mid-service.",
        route: "/inventory",
        status: "live",
        minPlan: null,
        area: "operations",
        icon: "alert",
    },
    {
        id: "suppliers",
        name: "Supplier purchase history",
        blurb: "Every intake kept against the supplier, with the original invoice photo attached.",
        route: "/inventory",
        status: "live",
        minPlan: "pro",
        area: "operations",
        icon: "truck",
    },
    {
        id: "locations",
        name: "Service locations",
        blurb: "Track where you park and which spots are actually worth the drive.",
        route: "/locations",
        status: "live",
        minPlan: null,
        area: "operations",
        icon: "pin",
    },

    // ------------------------------------------------------------- platform
    {
        id: "ai-companion",
        name: "AI companion",
        blurb: "Suggestions grounded in your own sales and costs, on every screen. It reads your real numbers, never generic tips.",
        status: "live",
        minPlan: null,
        area: "platform",
        icon: "sparkles",
    },
    {
        id: "staff-accounts",
        name: "Staff accounts and roles",
        blurb: "Invite staff with their own logins and an owner or staff role.",
        status: "live",
        minPlan: null,
        area: "platform",
        icon: "users",
    },

    // ------------------------------------------------------- building next
    {
        id: "customer-ordering",
        name: "Customer ordering page",
        blurb: "A public order form your customers fill in. Built, not switched on yet.",
        status: "building",
        minPlan: null,
        area: "growth",
        icon: "cart",
    },
    {
        id: "marketing-loyalty",
        name: "Marketing and loyalty",
        blurb: "Campaigns and repeat-customer rewards. Groundwork is in, the screens are not.",
        status: "building",
        minPlan: "pro",
        area: "growth",
        icon: "heart",
    },
    {
        id: "settings",
        name: "Account settings",
        blurb: "Business details, staff management and billing in one place.",
        status: "building",
        minPlan: null,
        area: "platform",
        icon: "settings",
    },

    // -------------------------------------------------------------- planned
    {
        id: "prep-planning",
        name: "Prep planning",
        blurb: "Tells you how much to prep tomorrow from what actually sold.",
        status: "planned",
        minPlan: null,
        area: "operations",
        icon: "list",
    },
    {
        id: "scheduling",
        name: "Staff scheduling",
        blurb: "Shifts and labour cost against forecast demand.",
        status: "planned",
        minPlan: null,
        area: "operations",
        icon: "calendar",
    },
    {
        id: "customer-profiles",
        name: "Customer profiles",
        blurb: "Who buys what, how often, and what they are worth.",
        status: "planned",
        minPlan: null,
        area: "growth",
        icon: "user",
    },
    {
        id: "notifications",
        name: "Alerts and notifications",
        blurb: "Low stock, expiring batches and daily summaries pushed to you.",
        status: "planned",
        minPlan: null,
        area: "platform",
        icon: "bell",
    },
    {
        id: "pos",
        name: "POS integration",
        blurb: "Sales flow in automatically instead of being entered by hand.",
        status: "planned",
        minPlan: "pro",
        area: "platform",
        icon: "plug",
    },
    {
        id: "menumo-pay",
        name: "Menumo Pay",
        blurb: "Take card payments through Menumo and skip the reconciliation.",
        status: "planned",
        minPlan: "business",
        area: "money",
        icon: "card",
    },
    {
        id: "api",
        name: "Public API",
        blurb: "Pull your own data out, or push it into your accountant's tools.",
        status: "planned",
        minPlan: "business",
        area: "platform",
        icon: "code",
    },
    {
        id: "multi-location",
        name: "Multi-location rollup",
        blurb: "Several trucks compared side by side under one account.",
        status: "planned",
        minPlan: "business",
        area: "platform",
        icon: "layers",
    },
];

export const LIVE_FEATURES = FEATURES.filter((f) => f.status === "live");
export const BUILDING_FEATURES = FEATURES.filter((f) => f.status === "building");
export const PLANNED_FEATURES = FEATURES.filter((f) => f.status === "planned");

export function featuresByStatus(status: FeatureStatus): readonly Feature[] {
    return FEATURES.filter((f) => f.status === status);
}
