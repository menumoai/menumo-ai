// api/_firebaseAdmin.ts
//
// Admin-SDK access for the subscription endpoints, with two jobs.
//
// Writing: the webhook has to write the `subscription` block, which Firestore
// rules deny to every client. The Admin SDK bypasses rules, which is the whole
// point - it is what lets the rules be strict.
//
// Reading the caller: `accountId` arrives in a request body, so it is an
// assertion, not a fact. `requireAccountAccess` turns it into one.

import {
    applicationDefault,
    cert,
    getApp,
    getApps,
    initializeApp,
    type App,
    type Credential,
    type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Named so this app cannot collide with a default app initialised elsewhere in
 * the same serverless container.
 */
const APP_NAME = "menumo-subscriptions";

/** Carries the status the endpoint should return, so handlers stay thin. */
export class HttpError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.name = "HttpError";
    }
}

/**
 * Accepts the service account as either raw JSON or base64.
 *
 * Base64 exists because the private key is multi-line, and multi-line values
 * survive a round trip through deploy tooling far less reliably than a single
 * opaque string does.
 */
function serviceAccount(raw: string): ServiceAccount {
    const json = raw.trimStart().startsWith("{")
        ? raw
        : Buffer.from(raw, "base64").toString("utf8");

    try {
        return JSON.parse(json) as ServiceAccount;
    } catch {
        // Deliberately says nothing about the value itself - this lands in
        // server logs, and the value is a private key.
        throw new Error(
            "FIREBASE_SERVICE_ACCOUNT is not valid JSON or base64-encoded JSON.",
        );
    }
}

/**
 * FIREBASE_SERVICE_ACCOUNT when set, otherwise Application Default Credentials.
 *
 * Vercel has nowhere to source ADC from, so deploys use the env var. Locally
 * ADC is the better of the two: `gcloud auth application-default login` leaves
 * no long-lived private key sitting in a file or a shell history, which is one
 * fewer thing that can end up committed.
 */
function credential(): Credential {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    return raw ? cert(serviceAccount(raw)) : applicationDefault();
}

/**
 * A service account JSON names its own project; Application Default Credentials
 * do not, and the SDK's failure when it cannot infer one is the memorably
 * unhelpful "Unable to detect a Project Id in the current environment". The
 * project is already in the env for the client SDK, so read it from there.
 */
function projectId(): string | undefined {
    return (
        process.env.FIREBASE_PROJECT_ID ??
        process.env.VITE_FIREBASE_PROJECT_ID ??
        undefined
    );
}

export function adminApp(): App {
    return getApps().some((existing) => existing.name === APP_NAME)
        ? getApp(APP_NAME)
        : initializeApp(
              { credential: credential(), projectId: projectId() },
              APP_NAME,
          );
}

export function adminDb(): Firestore {
    return getFirestore(adminApp());
}

function bearerToken(header: string | undefined): string {
    const value = header ?? "";
    const match = /^Bearer (.+)$/.exec(value.trim());
    if (!match) {
        throw new HttpError(401, "Missing or malformed Authorization header.");
    }
    return match[1];
}

/**
 * Verifies the caller's Firebase ID token and confirms they administer
 * `accountId`.
 *
 * Mirrors the ownership rule in firestore.rules: an account is reachable by the
 * uid equal to it, or by a user whose profile names it as `primaryAccountId`.
 *
 * This matters most for the customer portal. A portal session exposes billing
 * history, invoices and the cancel button, so issuing one for an account the
 * caller does not own would be a real leak - and `accountId` is just a string in
 * a request body until it is checked here.
 */
export async function requireAccountAccess(
    authorizationHeader: string | undefined,
    accountId: string,
): Promise<string> {
    if (!accountId) {
        throw new HttpError(400, "Missing accountId.");
    }

    const token = bearerToken(authorizationHeader);

    let uid: string;
    try {
        const decoded = await getAuth(adminApp()).verifyIdToken(token);
        uid = decoded.uid;
    } catch {
        throw new HttpError(401, "Invalid or expired sign-in.");
    }

    if (uid === accountId) {
        return uid;
    }

    const profile = await adminDb().doc(`userProfiles/${uid}`).get();
    if (profile.exists && profile.get("primaryAccountId") === accountId) {
        return uid;
    }

    // Same message either way: whether a given accountId exists is not
    // something an unauthorised caller should be able to probe for.
    throw new HttpError(403, "You do not have access to this account.");
}
