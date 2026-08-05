// api/stripe-webhook.ts
//
// The only writer of the `subscription` block on an account. Firestore rules
// deny that block to every client, so this endpoint plus the Admin SDK is the
// single path by which an account can become paid - which is what makes the
// tier trustworthy rather than a value anyone can set from devtools.

import type { IncomingMessage } from "node:http";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type Stripe from "stripe";
import {
    getStripe,
    intervalFromPrice,
    planIdFromPrice,
    toAccountStatus,
} from "./_stripe.js";
import { adminDb } from "./_firebaseAdmin.js";

/**
 * Vercel parses JSON request bodies by default, which would discard the exact
 * bytes Stripe signed. Signature verification runs over the raw payload, so the
 * parser has to be off for this route specifically.
 */
export const config = { api: { bodyParser: false } };

/** Collects the unparsed request body for signature verification. */
export function readRawBody(req: IncomingMessage): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer | string) => {
            chunks.push(Buffer.from(chunk));
        });
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
    });
}

/** Epoch seconds to a Firestore Timestamp, passing null straight through. */
function toTimestamp(seconds: number | null | undefined): Timestamp | null {
    return typeof seconds === "number" ? Timestamp.fromMillis(seconds * 1000) : null;
}

function customerIdOf(subscription: Stripe.Subscription): string | null {
    const { customer } = subscription;
    if (typeof customer === "string") return customer;
    return customer?.id ?? null;
}

/**
 * Which Menumo account a subscription belongs to.
 *
 * The metadata is stamped at checkout onto the subscription itself, so it rides
 * along on every later event. The customer lookup is a fallback for
 * subscriptions created outside this app - from the Stripe Dashboard, say -
 * which carry no metadata of ours.
 */
async function resolveAccountId(
    subscription: Stripe.Subscription,
): Promise<string | null> {
    const fromMetadata = subscription.metadata?.account_id;
    if (typeof fromMetadata === "string" && fromMetadata !== "") {
        return fromMetadata;
    }

    const customerId = customerIdOf(subscription);
    if (!customerId) return null;

    const matches = await adminDb()
        .collection("accounts")
        .where("stripeCustomerId", "==", customerId)
        .limit(1)
        .get();

    return matches.empty ? null : matches.docs[0].id;
}

/**
 * Writes Stripe's view of a subscription onto the account.
 *
 * Runs in a transaction against `lastEventAt` because Stripe redelivers events
 * and does not promise ordering. Without the guard, a delayed `trialing` event
 * arriving after `active` would quietly downgrade a paying customer, and the
 * only symptom would be a support ticket.
 */
async function applySubscription(
    subscription: Stripe.Subscription,
    eventCreated: number,
): Promise<void> {
    const accountId = await resolveAccountId(subscription);
    if (!accountId) {
        console.error(
            `No account for Stripe subscription ${subscription.id}; ignoring.`,
        );
        return;
    }

    // The first item is the plan. Menumo sells one plan per subscription, so a
    // second item would mean something created this outside the app.
    const item = subscription.items.data[0];
    const planId = planIdFromPrice(item?.price);
    if (!planId || !item) {
        console.error(
            `Subscription ${subscription.id} has no recognisable plan_id; ignoring.`,
        );
        return;
    }

    const status = toAccountStatus(subscription.status);
    const ref = adminDb().doc(`accounts/${accountId}`);

    await adminDb().runTransaction(async (tx) => {
        const snapshot = await tx.get(ref);
        const lastEventAt = snapshot.get("subscription.lastEventAt");

        if (typeof lastEventAt === "number" && lastEventAt > eventCreated) {
            console.warn(
                `Ignoring out-of-order event for ${accountId} ` +
                    `(${eventCreated} is older than ${lastEventAt}).`,
            );
            return;
        }

        tx.set(
            ref,
            {
                subscription: {
                    planId,
                    interval: intervalFromPrice(item.price),
                    status,
                    stripeCustomerId: customerIdOf(subscription),
                    stripeSubscriptionId: subscription.id,
                    stripePriceId: item.price.id,
                    // Lives on the item, not the subscription, as of the
                    // dahlia API versions.
                    currentPeriodEnd: toTimestamp(item.current_period_end),
                    trialEndsAt: toTimestamp(subscription.trial_end),
                    cancelAtPeriodEnd: subscription.cancel_at_period_end,
                    lastEventAt: eventCreated,
                    updatedAt: FieldValue.serverTimestamp(),
                },
                // Backfilled, not just recorded inside the block above.
                // `create-portal-session` reads this top-level field, and
                // `ensureCustomer` reuses it to avoid minting duplicates - so
                // if a subscription is ever created outside checkout (from the
                // Dashboard, a migration, a support fix) the two would
                // otherwise disagree, and the owner would open a billing portal
                // for a customer that has no subscription on it. Stripe is the
                // authority on which customer is really being billed.
                stripeCustomerId: customerIdOf(subscription),

                // Mirrored onto the legacy field so anything still reading it
                // agrees with the block above. `subscriptionTier` is left alone
                // on purpose: its enum cannot express essentials/business, and
                // resolvePlan prefers subscription.planId anyway.
                subscriptionStatus: status,
                updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
        );
    });
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object;
            const subscriptionId =
                typeof session.subscription === "string"
                    ? session.subscription
                    : session.subscription?.id;

            // A one-off payment session would have no subscription. Menumo has
            // none today, but the endpoint should not throw if one appears.
            if (!subscriptionId) return;

            const subscription =
                await getStripe().subscriptions.retrieve(subscriptionId);
            await applySubscription(subscription, event.created);
            return;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
            await applySubscription(event.data.object, event.created);
            return;

        default:
            // Everything else is acknowledged and ignored. Returning 200 for
            // unhandled types stops Stripe retrying events we will never act on.
            return;
    }
}

export interface WebhookResult {
    status: number;
    body: Record<string, unknown>;
}

/**
 * Verifies a webhook and dispatches it.
 *
 * Shared by the Vercel handler and the Vite dev middleware so the two cannot
 * drift. A difference between them would surface as "worked in dev, quietly
 * wrong in production", which is the last place anyone wants to find a billing
 * bug.
 */
export async function processWebhook(
    raw: Buffer,
    signature: string | undefined,
    secret: string | undefined,
): Promise<WebhookResult> {
    if (!secret) {
        console.error("STRIPE_WEBHOOK_SECRET is not set; rejecting webhook.");
        return { status: 503, body: { error: "Webhook is not configured." } };
    }
    if (!signature) {
        return { status: 400, body: { error: "Missing Stripe signature." } };
    }

    let event: Stripe.Event;
    try {
        event = getStripe().webhooks.constructEvent(raw, signature, secret);
    } catch (error) {
        // Deliberately does not log the payload. Until the signature verifies
        // it is attacker-controlled, and this is exactly the branch an
        // unverified request takes.
        console.error(
            "Stripe signature verification failed",
            error instanceof Error ? error.message : "unknown error",
        );
        return { status: 400, body: { error: "Signature verification failed." } };
    }

    try {
        await handleStripeEvent(event);
        return { status: 200, body: { received: true } };
    } catch (error) {
        // 500 rather than 200 so Stripe retries with backoff. Swallowing this
        // would leave the account permanently out of step with billing.
        console.error(`Failed to handle ${event.type} (${event.id})`, error);
        return { status: 500, body: { error: "Failed to process event." } };
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const signature = req.headers["stripe-signature"];
    const result = await processWebhook(
        await readRawBody(req),
        typeof signature === "string" ? signature : undefined,
        process.env.STRIPE_WEBHOOK_SECRET,
    );

    res.status(result.status).json(result.body);
}
