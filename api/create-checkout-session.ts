// api/create-checkout-session.ts
//
// Starts a subscription. Returns a Stripe-hosted Checkout URL for the client to
// navigate to; no card details ever touch this app.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { Timestamp } from "firebase-admin/firestore";
import {
    DEFAULT_BILLING_INTERVAL,
    TRIAL_DAYS,
    isBillingInterval,
    isPlanId,
    type BillingInterval,
    type PlanId,
} from "../src/config/plans.js";
import { getStripe, integrationIdentifier, priceForPlan } from "./_stripe.js";
import { HttpError, adminDb, requireAccountAccess } from "./_firebaseAdmin.js";
import { asBody, resolveBaseUrl } from "./_http.js";

/**
 * Whether Stripe Tax calculates and collects on checkout.
 *
 * OFF, and deliberately so. Stripe only charges tax where Menumo holds an
 * *active registration*, and the live account currently holds none. Critically,
 * that state produces no error: Stripe calculates zero and returns a clean
 * session, so `automatic_tax: { enabled: true }` looks like working tax
 * collection while collecting nothing. An enabled flag that does nothing is
 * worse than an honest `false`, because it is the version someone glances at
 * and concludes tax is handled.
 *
 * WHAT HAS TO BE TRUE BEFORE FLIPPING THIS BACK
 *   1. Head office set, so Tax settings report `active` rather than `pending`.
 *   2. A default tax behavior on the account. Exclusive is the intent: the
 *      listed price is the price and tax is added on top. Set it at the account
 *      level rather than per price - a price's own `tax_behavior` can be set
 *      only once and never changed, so leaving all four prices `unspecified`
 *      keeps that move in reserve.
 *   3. A preset product tax code. `txcd_10103001` (SaaS, business use) is the
 *      expected fit. Not `txcd_10000000`, which is too broad for US state-level
 *      taxability.
 *   4. At least one registration recorded, for a jurisdiction Menumo is
 *      *already* registered with. Recording one in Stripe does not register the
 *      business with the authority; that happens first, and which jurisdictions
 *      apply is a question for an accountant rather than for this file.
 *
 * Steps 1 to 3 are all Dashboard settings. Step 4 is the one that actually
 * makes tax collect, and until it is done this flag would be decorative.
 */
const ENABLE_AUTOMATIC_TAX: boolean = false;

export interface CheckoutSessionParams {
    /** Raw Authorization header. The caller is not trusted until this verifies. */
    authorization: string | undefined;
    accountId: string;
    planId: PlanId;
    interval: BillingInterval;
    /** Absolute base URL Stripe returns the customer to. */
    baseUrl: string;
}

/**
 * Days left of the free trial the account got at signup.
 *
 * Checkout is where an owner converts, and the app already promised them 14
 * no-card days from `createdAt`. Passing the *remaining* days rather than a flat
 * TRIAL_DAYS is what stops the two trials compounding: subscribing on day 3
 * should mean a first charge on day 14, not day 28. Returns 0 once the trial is
 * spent, and Stripe rejects anything under a day, so the caller omits it then.
 */
function remainingTrialDays(createdAt: Timestamp | undefined): number {
    if (!createdAt) return 0;
    const elapsedDays = Math.floor(
        (Date.now() - createdAt.toDate().getTime()) / 86_400_000,
    );
    return Math.max(0, TRIAL_DAYS - elapsedDays);
}

/**
 * The Stripe customer for an account, created on first use.
 *
 * The ID is written back to the account doc immediately rather than waiting for
 * the webhook, because checkout is abandonable: without this, every abandoned
 * attempt would mint another customer for the same business.
 */
async function ensureCustomer(
    accountId: string,
    account: FirebaseFirestore.DocumentData | undefined,
): Promise<string> {
    const existing = account?.stripeCustomerId;
    if (typeof existing === "string" && existing !== "") {
        return existing;
    }

    const customer = await getStripe().customers.create({
        email: typeof account?.email === "string" ? account.email : undefined,
        name: typeof account?.name === "string" ? account.name : undefined,
        metadata: { account_id: accountId },
    });

    await adminDb()
        .doc(`accounts/${accountId}`)
        .set({ stripeCustomerId: customer.id }, { merge: true });

    return customer.id;
}

export async function createCheckoutSession(
    params: CheckoutSessionParams,
): Promise<string> {
    const { authorization, accountId, planId, interval, baseUrl } = params;

    await requireAccountAccess(authorization, accountId);

    const snapshot = await adminDb().doc(`accounts/${accountId}`).get();
    if (!snapshot.exists) {
        throw new HttpError(404, "Account not found.");
    }
    const account = snapshot.data();

    const price = await priceForPlan(planId, interval);
    const customerId = await ensureCustomer(accountId, account);
    const trialDays = remainingTrialDays(account?.createdAt);

    const session = await getStripe().checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        client_reference_id: accountId,
        line_items: [{ price: price.id, quantity: 1 }],

        // NOTE: no `payment_method_types`. Omitting it is what enables dynamic
        // payment methods, so which methods appear is controlled from the
        // Stripe Dashboard rather than hardcoded here. Pinning it to ['card']
        // would silently exclude everything else.

        // Discounting moves to the Dashboard entirely. Marketing can create a
        // promotion code and run a campaign without a deploy, which is the
        // whole reason to accept the extra field on the checkout page.
        allow_promotion_codes: true,

        // Sales tax, VAT and GST. See ENABLE_AUTOMATIC_TAX above for why this is
        // currently off and what has to be true before it goes back on.
        ...(ENABLE_AUTOMATIC_TAX ? { automatic_tax: { enabled: true } } : {}),

        // Kept on even with tax off. We always pass an existing `customer`, and
        // without this Checkout leaves whatever address that customer already
        // had rather than saving the one just entered. That matters most on the
        // day tax is switched on: the addresses collected in the meantime are
        // what it will calculate against, and back-filling them afterwards means
        // asking every existing customer where they are.
        customer_update: { address: "auto" },

        // Deliberately no `billing_address_collection: 'required'`. Checkout
        // already asks for what it needs, and forcing the field adds friction
        // for no gain.

        // A business buying software can enter its VAT or GST number here, which
        // is what allows reverse charge to apply on cross-border B2B sales.
        // Without it Stripe has to treat every sale as B2C and charge tax.
        tax_id_collection: { enabled: true },

        subscription_data: {
            // Stamped on the subscription itself, not just this session, so
            // every later customer.subscription.* event names its account
            // without the receiver having to look one up.
            metadata: { account_id: accountId },
            ...(trialDays >= 1 ? { trial_period_days: trialDays } : {}),
        },
        metadata: {
            account_id: accountId,
            plan_id: planId,
            billing_interval: interval,
        },
        integration_identifier: integrationIdentifier(),

        // Both return to /billing, which reads these flags and reports what
        // happened. Landing back on the plan page also means a webhook that has
        // not arrived yet is one refresh away from showing, rather than looking
        // like the purchase failed.
        success_url: `${baseUrl}/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/billing?checkout=cancelled`,
    });

    if (!session.url) {
        throw new HttpError(502, "Stripe did not return a checkout URL.");
    }
    return session.url;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const body = asBody(req.body);
    const accountId = typeof body.accountId === "string" ? body.accountId : "";
    const planId: unknown = body.planId;
    const rawInterval: unknown = body.interval;

    if (!isPlanId(planId)) {
        res.status(400).json({ error: "Unknown plan." });
        return;
    }

    // Absent means monthly, so a client that predates annual billing still
    // works. Present but unrecognised is rejected rather than defaulted: an
    // owner who asked for a year and got charged for a month would have no way
    // to tell from this response that anything went wrong.
    if (rawInterval !== undefined && !isBillingInterval(rawInterval)) {
        res.status(400).json({ error: "Unknown billing interval." });
        return;
    }
    const interval = rawInterval ?? DEFAULT_BILLING_INTERVAL;

    try {
        const url = await createCheckoutSession({
            authorization: req.headers.authorization,
            accountId,
            planId,
            interval,
            baseUrl: resolveBaseUrl(req.headers.origin),
        });
        res.status(200).json({ url });
    } catch (error) {
        if (error instanceof HttpError) {
            res.status(error.status).json({ error: error.message });
            return;
        }
        console.error("Checkout session failed", error);
        res.status(500).json({ error: "Could not start checkout." });
    }
}
