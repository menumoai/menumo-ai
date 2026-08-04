// api/_stripe.ts
//
// Shared Stripe wiring for the subscription endpoints. Vercel does not route
// files under `api/` whose names begin with an underscore, so this is a library
// rather than an endpoint.

import Stripe from "stripe";
import { isPlanId, type PlanId } from "../src/config/plans";
import type { SubscriptionStatus } from "../src/models/account";

/**
 * Pinned rather than left to the account default.
 *
 * An account's default API version is changeable from the Stripe Dashboard, and
 * a change there would silently alter the shape of the objects this code reads.
 * Pinning makes an upgrade a code change that goes through review. Keep in step
 * with the installed SDK - `stripe@22.x` ships this version.
 */
export const STRIPE_API_VERSION = "2026-07-29.dahlia" as const;

/**
 * The lookup key for a plan's monthly price, as created by
 * `scripts/stripe-seed-products.sh`.
 *
 * Resolving prices by lookup key rather than holding price IDs in env vars
 * means there is one less thing to keep in step across test mode, live mode and
 * the deploy config. The IDs differ per mode; the keys do not.
 */
export function monthlyLookupKey(planId: PlanId): string {
    return `menumo_${planId}_monthly`;
}

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

/**
 * Looks up the active monthly price for a plan.
 *
 * Throws when the price is missing, because the alternative - quietly falling
 * back to some other price - would bill someone the wrong amount.
 */
export async function priceForPlan(planId: PlanId): Promise<Stripe.Price> {
    const key = monthlyLookupKey(planId);
    const prices = await getStripe().prices.list({
        lookup_keys: [key],
        active: true,
        limit: 1,
    });

    const price = prices.data[0];
    if (!price) {
        throw new Error(
            `No active price with lookup key "${key}". Run scripts/stripe-seed-products.sh.`,
        );
    }
    return price;
}

/**
 * The plan a Stripe price belongs to, read from the `plan_id` metadata that the
 * seed script stamps on every product and price.
 *
 * Deliberately not a price-ID lookup table: test and live mode have different
 * price IDs, and a table would have to track both. Returns null when the
 * metadata is absent or unrecognised, which is a real possibility for a price
 * hand-created in the Dashboard.
 */
export function planIdFromPrice(price: Stripe.Price | null | undefined): PlanId | null {
    const value = price?.metadata?.plan_id;
    return isPlanId(value) ? value : null;
}

/**
 * Stripe's subscription statuses collapsed onto the four the app models.
 *
 * `incomplete` means the first payment has not succeeded, so it maps to
 * past_due rather than active - such an account has not paid for anything yet.
 *
 * An unrecognised status maps to `canceled` on purpose. Stripe can add statuses,
 * and of the two ways to be wrong about a new one, degrading to the entry plan
 * is the recoverable direction; `resolvePlan` treats canceled as Essentials
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
