// src/hooks/useOnboardingProgress.ts
//
// Derives the setup checklist from real account data rather than from a stored
// list of "steps the user clicked". Someone who adds menu items straight from
// /menu without ever opening /get-started arrives with that step already ticked,
// so nobody is ever asked to redo work inside a wizard.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { listExpenses } from "../services/expense";
import { listOrders } from "../services/order";
import { listProducts } from "../services/product";
import { listSupplierTransactions } from "../services/supplierTransaction";

/** Menu items needed before food costing tells you anything useful. */
const MENU_ITEM_TARGET = 3;

export interface OnboardingStep {
    id: string;
    title: string;
    /** Shown when the step is still open: what to do and why. */
    blurb: string;
    /** Shown when the step is done: what we found. */
    doneBlurb: string;
    /**
     * The longer "what does this actually mean" explanation, shown behind an
     * info affordance next to the step. Only offered while the step is open -
     * once someone has done it, they know what it meant.
     */
    help: string;
    /** Rough time cost, used on the public preview. */
    estimate: string;
    route: string;
    done: boolean;
    /** Steps a truck can reasonably skip on day one. */
    optional?: boolean;
}

interface Counts {
    products: number;
    orders: number;
    expenses: number;
    supplierIntakes: number;
    askedAi: boolean;
}

const EMPTY_COUNTS: Counts = {
    products: 0,
    orders: 0,
    expenses: 0,
    supplierIntakes: 0,
    askedAi: false,
};

/**
 * The AI step is the one thing with no server-side record: the companion
 * endpoint is not metered yet, so there is nothing in Firestore to read. A local
 * flag is good enough for an onboarding nudge. When AI credits land this should
 * move to the usage record and stop being per-device.
 */
const AI_FLAG_PREFIX = "menumo:asked-ai:";

export function markAiCompanionUsed(accountId: string): void {
    try {
        window.localStorage.setItem(AI_FLAG_PREFIX + accountId, "1");
    } catch {
        // Private mode or storage disabled. The step just stays open.
    }
}

function readAiFlag(accountId: string): boolean {
    try {
        return window.localStorage.getItem(AI_FLAG_PREFIX + accountId) === "1";
    } catch {
        return false;
    }
}

/** The checklist copy, shared by the public preview and the live version. */
export function buildSteps(counts: Counts): OnboardingStep[] {
    return [
        {
            id: "menu",
            title: "Add your menu items",
            // Show movement toward the target. Without this a first item looks
            // like nothing happened, which reads as the checklist being broken.
            blurb:
                counts.products > 0
                    ? `${counts.products} of ${MENU_ITEM_TARGET} added. ${
                          MENU_ITEM_TARGET - counts.products
                      } more and food costing kicks in.`
                    : "Name, price, and what goes into each one. Food costing needs this first.",
            doneBlurb: `${counts.products} items with costs - food cost is calculating`,
            help: "A menu item is one thing you sell, with its price and the ingredients that go into it. Menumo uses those ingredient costs to work out the real margin on every dish - that is what the food cost figures and the menu matrix are built from. Three items is enough to start; you can add the rest later.",
            estimate: "~4 min",
            route: "/menu",
            done: counts.products >= MENU_ITEM_TARGET,
        },
        {
            id: "orders",
            title: "Log a day of sales",
            blurb: "One real service is enough to make the dashboard and trends work.",
            doneBlurb: `${counts.orders} orders logged`,
            help: "Enter the orders from one real service, or import them from a CSV. A single day is enough to switch on the dashboard, the revenue trend and your best and worst sellers. It does not need to be today, and it does not need to be complete.",
            estimate: "~2 min",
            route: "/orders",
            done: counts.orders > 0,
        },
        {
            id: "intake",
            title: "Snap a supplier invoice",
            blurb: "Photograph it and we read the line items into inventory with expiry dates.",
            doneBlurb: `${counts.supplierIntakes} supplier intakes recorded`,
            help: "Take a photo of a supplier invoice or a store receipt for stock you bought - the paper slip from your food supplier. Menumo reads the supplier, the date and every line item straight off the picture, converts case and pack sizes into a single tracking unit, and adds each item to your inventory with an expiry date based on what it is. Skip it if you have no receipt to hand.",
            estimate: "~1 min",
            route: "/inventory",
            done: counts.supplierIntakes > 0,
            optional: true,
        },
        {
            id: "expenses",
            title: "Enter your recurring costs",
            blurb: "Fuel, permits, commissary. Without these, profit is only a guess.",
            doneBlurb: "Recurring costs are being tracked",
            help: "The costs that are not ingredients: fuel, permits, pitch fees, commissary rent, insurance, repairs. Revenue minus food cost is not profit until these are counted, so the finance and profit screens stay optimistic until you add them.",
            estimate: "~2 min",
            route: "/expenses",
            done: counts.expenses > 0,
        },
        {
            id: "ai",
            title: "Ask the assistant a question",
            blurb: 'Try "which item makes me the least money?" and see it answer from your data.',
            doneBlurb: "You've used the assistant",
            help: "The assistant reads your own numbers rather than giving generic advice, so it can point at the specific dish or day losing you money. It sits in the bottom-right of every screen. It is last on this list because it needs the data from the steps above to say anything useful.",
            estimate: "~30 sec",
            route: "/dashboard",
            done: counts.askedAi,
        },
    ];
}

/** Steps with no account behind them, for the signed-out preview. */
export const PREVIEW_STEPS: readonly OnboardingStep[] = buildSteps(EMPTY_COUNTS);

export function useOnboardingProgress(accountId: string | null) {
    const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { pathname } = useLocation();

    const reload = useCallback(async () => {
        if (!accountId) {
            setCounts(EMPTY_COUNTS);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [products, orders, expenses, supplierIntakes] = await Promise.all([
                listProducts(accountId),
                listOrders(accountId),
                listExpenses(accountId, { limit: 1 }),
                listSupplierTransactions(accountId),
            ]);

            setCounts({
                products: products.length,
                orders: orders.length,
                expenses: expenses.length,
                supplierIntakes: supplierIntakes.length,
                askedAi: readAiFlag(accountId),
            });
        } catch (caught) {
            console.error("Failed to load onboarding progress", caught);
            setError("Could not check your setup progress.");
        } finally {
            setLoading(false);
        }
    }, [accountId]);

    // Refetch on every route change. The checklist is derived from collections
    // the user edits on other pages, and DashboardLayout's copy of this hook
    // never unmounts, so without this its counter goes stale the moment someone
    // adds a menu item. Reads are bounded: callers pass null once setup is done.
    useEffect(() => {
        void reload();
    }, [reload, pathname]);

    // Same problem across tabs and windows: come back to a page left open and
    // the counts should be current, not whatever they were on mount.
    useEffect(() => {
        if (!accountId) return;

        const onFocus = () => void reload();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [accountId, reload]);

    const steps = useMemo(() => buildSteps(counts), [counts]);
    const completed = steps.filter((s) => s.done).length;

    return {
        steps,
        completed,
        total: steps.length,
        /** First step still open, which is the one the page emphasizes. */
        nextStep: steps.find((s) => !s.done) ?? null,
        allDone: completed === steps.length,
        loading,
        error,
        reload,
    };
}
