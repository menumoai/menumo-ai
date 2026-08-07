// api/plans.ts
//
// The plan catalog as Stripe currently has it: what each plan costs, what it is
// called, and which plans are on sale at all.
//
// This endpoint is what ends the deploy-per-price-change treadmill. Changing an
// amount, renaming a plan, rewriting its bullets, or withdrawing a plan
// entirely are all Dashboard actions now, and the pricing page follows within
// the cache window. What stays in code is what a plan MEANS - the `PlanId`
// union, the ladder order, the enforced limits and the capability matrix - all
// of which decide what a paying customer can actually do. See the header of
// src/config/plans.ts for where that line sits and why.
//
// Public and unauthenticated on purpose: /get-started renders prices to signed
// out visitors, and a price list is public information by definition. It is
// still a Stripe API call behind a URL anyone can hit, so it is cached hard at
// the edge and reads through a restricted key when one is configured.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import type Stripe from "stripe";
import {
    PLAN_ORDER,
    allLookupKeys,
    parseLookupKey,
    type CatalogPlan,
    type PlanId,
} from "../src/config/plans.js";
import { getCatalogStripe, intervalFromPrice } from "./_stripe.js";

export interface PlanCatalog {
    plans: CatalogPlan[];
    /** ISO currency of every price in the catalog, lowercase as Stripe reports it. */
    currency: string;
}

/**
 * How long a browser and the CDN may serve this without asking again.
 *
 * A price change is not urgent - it has to be right, not instant - so the edge
 * cache is worth far more than a few minutes of freshness. `stale-while-
 * revalidate` is the load-bearing part: for a whole day after the cache expires
 * the edge keeps serving the last good catalog while it refreshes behind the
 * scenes, which means a Stripe outage does not reach the pricing page at all.
 */
const CACHE_CONTROL =
    "public, max-age=60, s-maxage=300, stale-while-revalidate=86400";

/**
 * Products are named "Menumo Pro" so invoices and Checkout read as the customer
 * expects, but a card in a grid of Menumo plans saying "Menumo Pro" is stutter.
 * Stripped rather than held as a second metadata field, so there is one name to
 * edit in the Dashboard instead of two that can disagree.
 */
function displayName(name: string): string {
    const stripped = name.replace(/^Menumo\s+/i, "").trim();
    return stripped === "" ? name : stripped;
}

/**
 * The product behind a price, when it is one we should still be selling.
 *
 * Archiving the *product* is the other way to withdraw a plan, and a Dashboard
 * user may reasonably do that instead of archiving each price, so both have to
 * take the plan off the page.
 */
function sellableProduct(price: Stripe.Price): Stripe.Product | null {
    const product: unknown = price.product;
    if (typeof product !== "object" || product === null) return null;
    if ("deleted" in product) return null;

    const resolved = product as Stripe.Product;
    return resolved.active ? resolved : null;
}

interface Accumulated {
    name: string;
    tagline: string;
    highlights: string[];
    priceMonthly: number | null;
    priceAnnual: number | null;
}

/**
 * Reads the live catalog.
 *
 * Every rejection below is logged rather than thrown. One malformed price
 * should cost us that price, not the entire pricing page - and the log is what
 * makes a Dashboard mistake findable, since the symptom on screen is only ever
 * an absence.
 */
export async function loadPlanCatalog(): Promise<PlanCatalog> {
    const prices = await getCatalogStripe().prices.list({
        lookup_keys: allLookupKeys(),
        active: true,
        expand: ["data.product"],
        limit: 100,
    });

    const byPlan = new Map<PlanId, Accumulated>();
    const currencies = new Set<string>();

    for (const price of prices.data) {
        const parsed = parseLookupKey(price.lookup_key);
        if (!parsed) continue;

        const product = sellableProduct(price);
        if (!product) continue;

        if (price.unit_amount === null) {
            // Tiered or metered pricing has no single amount to print. Menumo
            // sells neither, so this means someone built a price we cannot
            // render rather than a case worth supporting.
            console.warn(
                `Price ${price.id} (${price.lookup_key}) has no unit_amount; skipping.`,
            );
            continue;
        }

        // The lookup key claims an interval and Stripe knows the real one. A
        // yearly price filed under a monthly key would otherwise be shown as a
        // month's cost, understating the real commitment twelvefold.
        const actual = intervalFromPrice(price);
        if (actual !== parsed.interval) {
            console.error(
                `Price ${price.id} has lookup key "${price.lookup_key}" but bills ` +
                    `${actual ?? "on an unsupported cadence"}; skipping.`,
            );
            continue;
        }

        currencies.add(price.currency);

        const entry = byPlan.get(parsed.planId) ?? {
            name: displayName(product.name),
            tagline: product.description ?? "",
            highlights: (product.marketing_features ?? [])
                .map((feature) => feature.name)
                .filter((name): name is string => Boolean(name)),
            priceMonthly: null,
            priceAnnual: null,
        };

        // Stripe reports minor units. Menumo prices are USD, which is checked
        // below - a zero-decimal currency such as JPY would make this hundred
        // wrong, so it must not be quietly generalised without handling that.
        const dollars = price.unit_amount / 100;
        if (parsed.interval === "annual") {
            entry.priceAnnual = dollars;
        } else {
            entry.priceMonthly = dollars;
        }

        byPlan.set(parsed.planId, entry);
    }

    if (currencies.size > 1) {
        console.error(
            `Catalog mixes currencies (${[...currencies].join(", ")}); ` +
                "prices will render as if they were all USD.",
        );
    }

    const currency = currencies.values().next().value ?? "usd";
    if (currency !== "usd") {
        console.error(
            `Catalog currency is "${currency}" but formatPrice renders USD.`,
        );
    }

    // PLAN_ORDER rather than Stripe's ordering, so the ladder always reads
    // cheapest-first regardless of what order the API returned prices in.
    const plans = PLAN_ORDER.flatMap((id) => {
        const entry = byPlan.get(id);
        return entry ? [{ id, ...entry }] : [];
    });

    return { plans, currency };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    try {
        const catalog = await loadPlanCatalog();
        res.setHeader("Cache-Control", CACHE_CONTROL);
        res.status(200).json(catalog);
    } catch (error) {
        console.error("Plan catalog lookup failed", error);
        // No Cache-Control: a failure must not be cached for a day. The client
        // falls back to its built-in copy, so this is a degraded page rather
        // than a broken one.
        res.status(502).json({ error: "Could not load plans." });
    }
}
