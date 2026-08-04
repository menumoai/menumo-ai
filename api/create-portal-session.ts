// api/create-portal-session.ts
//
// Hands an owner a Stripe-hosted Customer Portal session: plan changes,
// cancellation, invoices and payment-method updates, none of which this app has
// to build or hold card data for.
//
// This endpoint is the reason `requireAccountAccess` exists. A portal session is
// a bearer URL onto a business's billing history and cancel button, so issuing
// one for an account the caller does not administer would be a real breach -
// and `accountId` is only ever a string in a request body.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getStripe } from "./_stripe.js";
import { HttpError, adminDb, requireAccountAccess } from "./_firebaseAdmin.js";
import { asBody, resolveBaseUrl } from "./_http.js";

export interface PortalSessionParams {
    authorization: string | undefined;
    accountId: string;
    baseUrl: string;
}

export async function createPortalSession(
    params: PortalSessionParams,
): Promise<string> {
    const { authorization, accountId, baseUrl } = params;

    await requireAccountAccess(authorization, accountId);

    const snapshot = await adminDb().doc(`accounts/${accountId}`).get();
    const customerId = snapshot.data()?.stripeCustomerId;

    if (typeof customerId !== "string" || customerId === "") {
        // Not an error state so much as a sequencing one: there is nothing to
        // manage until the account has been through checkout at least once.
        throw new HttpError(409, "This account has no billing set up yet.");
    }

    const session = await getStripe().billingPortal.sessions.create({
        customer: customerId,
        return_url: `${baseUrl}/billing`,
    });

    return session.url;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const body = asBody(req.body);
    const accountId = typeof body.accountId === "string" ? body.accountId : "";

    try {
        const url = await createPortalSession({
            authorization: req.headers.authorization,
            accountId,
            baseUrl: resolveBaseUrl(req.headers.origin),
        });
        res.status(200).json({ url });
    } catch (error) {
        if (error instanceof HttpError) {
            res.status(error.status).json({ error: error.message });
            return;
        }
        console.error("Portal session failed", error);
        res.status(500).json({ error: "Could not open billing settings." });
    }
}
