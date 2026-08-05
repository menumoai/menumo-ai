// src/services/subscription.ts
//
// The client half of the subscription flow.
//
// Note what is absent: any Firestore write. Plan state lives in the
// server-written `subscription` block, which Firestore rules deny to clients, so
// every function here is a call to an endpoint that checks who is asking. The
// browser's only job is to follow the URL it gets back.

import { auth } from "../firebaseClient";
import {
    DEFAULT_BILLING_INTERVAL,
    type BillingInterval,
    type PlanId,
} from "../config/plans";

interface RedirectResponse {
    url: string;
}

/**
 * POSTs with the caller's Firebase ID token attached.
 *
 * The token is what lets the server verify the `accountId` in the body actually
 * belongs to whoever is asking - without it, the account ID is just a string
 * anyone could type.
 */
async function authorizedPost(
    path: string,
    body: Record<string, unknown>,
): Promise<RedirectResponse> {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("You need to be signed in to manage your plan.");
    }

    const response = await fetch(path, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify(body),
    });

    const payload: unknown = await response.json().catch(() => null);
    const message =
        payload && typeof payload === "object" && "error" in payload
            ? String((payload as { error: unknown }).error)
            : null;

    if (!response.ok) {
        throw new Error(message ?? "Something went wrong. Please try again.");
    }

    const url =
        payload && typeof payload === "object" && "url" in payload
            ? String((payload as { url: unknown }).url)
            : "";

    if (!url) {
        throw new Error("Stripe did not return a link to continue to.");
    }

    return { url };
}

/**
 * Sends the owner to Stripe-hosted Checkout for a plan, billed monthly or
 * annually.
 *
 * A full page navigation rather than an embedded form, which is what keeps card
 * details entirely outside this app - there is no Stripe.js on the page and
 * nothing to get wrong about handling a PAN.
 *
 * Note that the interval is a request, not an instruction: the server resolves
 * it to a real Stripe price by lookup key and refuses if that price is missing,
 * so the amount charged can never be something the browser chose.
 */
export async function startCheckout(
    accountId: string,
    planId: PlanId,
    interval: BillingInterval = DEFAULT_BILLING_INTERVAL,
): Promise<void> {
    const { url } = await authorizedPost("/api/create-checkout-session", {
        accountId,
        planId,
        interval,
    });
    window.location.href = url;
}

/**
 * Sends the owner to the Stripe Customer Portal.
 *
 * Upgrades, downgrades, cancellation, invoices and payment-method changes all
 * live there, which is why this app has no billing screens of its own.
 */
export async function openBillingPortal(accountId: string): Promise<void> {
    const { url } = await authorizedPost("/api/create-portal-session", {
        accountId,
    });
    window.location.href = url;
}
