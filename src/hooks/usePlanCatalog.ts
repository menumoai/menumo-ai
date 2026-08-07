// src/hooks/usePlanCatalog.ts
//
// The live plan catalog from `api/plans.ts`, with the code constants as a
// fallback.
//
// The loading behaviour is the interesting part. Names, taglines and bullets
// render from the fallback immediately so the page has its full shape from the
// first frame; only the prices wait. Showing a fallback price and correcting it
// a moment later would be worse than a brief skeleton: a number that changes
// under someone's eyes on a pricing page undermines every other number on it.

import { useEffect, useState } from "react";
import {
    FALLBACK_CATALOG,
    isPlanId,
    type CatalogPlan,
} from "../config/plans";

export type CatalogSource = "stripe" | "fallback";

export interface PlanCatalogState {
    plans: readonly CatalogPlan[];
    /**
     * True until the live catalog resolves. While true the entries carry
     * fallback prices, so callers must not render a price yet.
     */
    loading: boolean;
    source: CatalogSource;
}

/**
 * Shared across every component that asks, so a page rendering both the cards
 * and the capability matrix makes one request rather than one each.
 *
 * Only successes are cached. A failed load should be retried by the next
 * component that mounts rather than pinning the whole session to the fallback
 * because of one blip. The cache lives for the life of the tab, which is a
 * deliberate limit: prices change rarely, and a reload picks up the change.
 */
let inFlight: Promise<CatalogPlan[]> | null = null;

function isCatalogPlan(value: unknown): value is CatalogPlan {
    if (typeof value !== "object" || value === null) return false;
    const plan = value as Record<string, unknown>;
    return (
        isPlanId(plan.id) &&
        typeof plan.name === "string" &&
        Array.isArray(plan.highlights)
    );
}

async function fetchCatalog(): Promise<CatalogPlan[]> {
    const response = await fetch("/api/plans");
    if (!response.ok) {
        throw new Error(`Plan catalog responded ${response.status}`);
    }

    const payload: unknown = await response.json();
    const plans =
        typeof payload === "object" && payload !== null
            ? (payload as { plans?: unknown }).plans
            : null;

    if (!Array.isArray(plans)) {
        throw new Error("Plan catalog response had no plans array.");
    }

    // Anything unrecognised is dropped rather than rendered. A plan id this
    // build does not know is a plan it cannot gate, so selling it would hand
    // someone a subscription that entitles them to nothing.
    return plans.filter(isCatalogPlan);
}

function loadCatalog(): Promise<CatalogPlan[]> {
    if (!inFlight) {
        inFlight = fetchCatalog().catch((error: unknown) => {
            inFlight = null;
            throw error;
        });
    }
    return inFlight;
}

export function usePlanCatalog(): PlanCatalogState {
    const [state, setState] = useState<PlanCatalogState>({
        plans: FALLBACK_CATALOG,
        loading: true,
        source: "fallback",
    });

    useEffect(() => {
        let active = true;

        loadCatalog()
            .then((plans) => {
                if (!active) return;
                // An empty catalog means every plan is archived, which is a
                // Stripe misconfiguration rather than an intended state. The
                // fallback is the better answer: a pricing page with no plans
                // on it cannot be recovered from by the visitor.
                if (plans.length === 0) {
                    console.error("Live plan catalog was empty; using fallback.");
                    setState({
                        plans: FALLBACK_CATALOG,
                        loading: false,
                        source: "fallback",
                    });
                    return;
                }
                setState({ plans, loading: false, source: "stripe" });
            })
            .catch((error: unknown) => {
                if (!active) return;
                console.error("Could not load the live plan catalog", error);
                setState({
                    plans: FALLBACK_CATALOG,
                    loading: false,
                    source: "fallback",
                });
            });

        return () => {
            active = false;
        };
    }, []);

    return state;
}
