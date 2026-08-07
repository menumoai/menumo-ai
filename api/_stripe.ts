// api/_stripe.ts
//
// Shared Stripe wiring for the subscription endpoints. Vercel does not route
// files under `api/` whose names begin with an underscore, so this is a library
// rather than an endpoint.
//
// NOTE on the `.js` in the relative imports below, and in every other file under
// `api/`: Vercel compiles these to ESM one file at a time without bundling, and
// the package is `"type": "module"`, so at runtime Node's ESM resolver demands an
// explicit extension. Extension-less specifiers typecheck and work fine under
// Vite, then fail only once deployed, with ERR_MODULE_NOT_FOUND. TypeScript maps
// a `.js` specifier back to the `.ts` source, so writing it this way costs
// nothing and is the only form that works in both places.
//
// This applies to `import type` too. Those erase at runtime, so it looks like
// they should be exempt, but Vercel typechecks `api/` with node16 resolution and
// rejects them (TS2835) - and our own tsconfig uses `bundler`, which does not,
// so the error appears only in the deploy log.

import Stripe from "stripe";
import {
    isPlanId,
    parseLookupKey,
    stripeLookupKey,
    type BillingInterval,
    type PlanId,
} from "../src/config/plans.js";
import type { SubscriptionStatus } from "../src/models/account.js";

/**
 * Pinned rather than left to the account default.
 *
 * An account's default API version is changeable from the Stripe Dashboard, and
 * a change there would silently alter the shape of the objects this code reads.
 * Pinning makes an upgrade a code change that goes through review. Keep in step
 * with the installed SDK - `stripe@22.x` ships this version.
 */
export const STRIPE_API_VERSION = "2026-07-29.dahlia" as const;

let cached: Stripe | null = null;

/** Throws rather than returning null - every caller needs a working client. */
export function getStripe(): Stripe {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        throw new Error("STRIPE_SECRET_KEY is not set.");
    }
    if (!cached) {
        cached = new Stripe(key, { apiVersion: STRIPE_API_VERSION });
    }
    return cached;
}

let cachedCatalog: Stripe | null = null;

/**
 * Client for the public catalog endpoint.
 *
 * `api/plans.ts` is the one endpoint anyone on the internet can call without
 * signing in, and all it ever needs is to read products and prices. Backing it
 * with the same full-access secret key as checkout and the webhook gives a
 * public surface far more authority than it uses.
 *
 * Set STRIPE_CATALOG_KEY to a restricted key (`rk_`) with read-only access to
 * Products and Prices and this uses it. Left unset it falls back to the usual
 * key, so this is an available improvement rather than another required env var
 * to get wrong on first deploy.
 */
export function getCatalogStripe(): Stripe {
    const key = process.env.STRIPE_CATALOG_KEY;
    if (!key) return getStripe();

    if (!cachedCatalog) {
        cachedCatalog = new Stripe(key, { apiVersion: STRIPE_API_VERSION });
    }
    return cachedCatalog;
}

/**
 * Looks up the active price for a plan at one billing interval.
 *
 * Throws when the price is missing, because the alternative - quietly falling
 * back to some other price - would bill someone the wrong amount. In particular
 * it does not fall back to the monthly price when an annual one is missing:
 * charging a year's customer one month's money is worse than an error.
 */
export async function priceForPlan(
    planId: PlanId,
    interval: BillingInterval,
): Promise<Stripe.Price> {
    const key = stripeLookupKey(planId, interval);
    const prices = await getStripe().prices.list({
        lookup_keys: [key],
        active: true,
        limit: 1,
    });

    const price = prices.data[0];
    if (!price) {
        throw new Error(
            `No active price with lookup key "${key}". Run scripts/stripe-seed-products.mjs --apply.`,
        );
    }
    return price;
}

/**
 * The plan a Stripe price belongs to.
 *
 * Deliberately not a price-ID lookup table: test and live mode have different
 * price IDs, and a table would have to track both.
 *
 * Two sources, in order. `metadata.plan_id` is what the seed script stamps and
 * is checked first. The lookup key is the fallback, and it is the one that makes
 * Dashboard-created prices safe: a price is only reachable by a customer if
 * checkout resolved it, and `priceForPlan` resolves purely by lookup key, so on
 * any price that can actually be bought the key is present and correct. The
 * metadata is not - nothing in the Dashboard's price form requires it.
 *
 * Before the fallback existed, that omission was a silent billing failure of the
 * worst kind: checkout succeeded, the card was charged, and `applySubscription`
 * dropped the event on the floor, so the customer paid and was never upgraded.
 * The only signal was a server log.
 *
 * Still returns null for a price belonging to something else entirely, which is
 * the case the caller must keep handling.
 */
export function planIdFromPrice(price: Stripe.Price | null | undefined): PlanId | null {
    const fromMetadata = price?.metadata?.plan_id;
    if (isPlanId(fromMetadata)) return fromMetadata;

    return parseLookupKey(price?.lookup_key)?.planId ?? null;
}

/**
 * How often a Stripe price bills, in the app's own terms.
 *
 * Read from `recurring.interval` rather than from our `billing_interval`
 * metadata: Stripe's field is what the customer is actually charged on, whereas
 * metadata is a label we wrote and could have written wrongly. A yearly price
 * with a mislabelled tag should still show the owner "renews annually".
 *
 * Anything that is neither monthly nor yearly - a weekly price, or a one-off
 * hand-created in the Dashboard - returns null rather than being forced into one
 * of the two, so the UI can stay quiet instead of stating a cadence we guessed.
 */
export function intervalFromPrice(
    price: Stripe.Price | null | undefined,
): BillingInterval | null {
    switch (price?.recurring?.interval) {
        case "month":
            return price.recurring.interval_count === 1 ? "monthly" : null;
        case "year":
            return price.recurring.interval_count === 1 ? "annual" : null;
        default:
            return null;
    }
}

/**
 * Stripe's subscription statuses collapsed onto the four the app models.
 *
 * `incomplete` means the first payment has not succeeded, so it maps to
 * past_due rather than active - such an account has not paid for anything yet.
 *
 * An unrecognised status maps to `canceled` on purpose. Stripe can add statuses,
 * and of the two ways to be wrong about a new one, degrading to the entry plan
 * is the recoverable direction; `resolvePlan` treats canceled as the floor plan
 * rather than as a lockout, so the owner keeps their books either way.
 */
export function toAccountStatus(
    status: Stripe.Subscription.Status,
): SubscriptionStatus {
    switch (status) {
        case "trialing":
            return "trial";
        case "active":
            return "active";
        case "past_due":
        case "unpaid":
        case "incomplete":
            return "past_due";
        case "canceled":
        case "incomplete_expired":
            return "canceled";
        default:
            console.warn(`Unrecognised Stripe subscription status: ${status}`);
            return "canceled";
    }
}

/**
 * A label for the Dashboard's checkout-flow comparison, required to end in eight
 * random letters. Regenerated per session so Stripe can group them.
 */
export function integrationIdentifier(): string {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    let suffix = "";
    for (let i = 0; i < 8; i += 1) {
        suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return `menumo-subscription-${suffix}`;
}
