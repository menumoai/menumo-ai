// src/services/accounts.ts
import {
    collection,
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseClient";
import type { BusinessAccount, SubscriptionTier, SubscriptionStatus } from "../models/account";

// Path helper
const accountsCol = () => collection(db, "accounts");

// Create or overwrite an account with a known ID
export async function createBusinessAccount(params: {
    id: string;
    name: string;
    legalName?: string;
    email?: string;
    phone?: string;
    subscriptionTier?: SubscriptionTier;
    subscriptionStatus?: SubscriptionStatus;
}): Promise<void> {
    const {
        id,
        name,
        legalName,
        email,
        phone,
        subscriptionTier = "mvp",
        subscriptionStatus = "trial",
    } = params;

    const ref = doc(accountsCol(), id);

    await setDoc(ref, {
        id,
        name,
        legalName: legalName ?? null,
        email: email ?? null,
        phone: phone ?? null,
        subscriptionTier,
        subscriptionStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

/**
 * Records that the setup checklist reached 5 of 5. This is the only piece of
 * onboarding state that is ever written: it stops the post-signup redirect and
 * lets the sidebar stop querying progress. The individual step ticks stay
 * derived from real collections so they can never go stale.
 */
export async function markOnboardingComplete(accountId: string): Promise<void> {
    const ref = doc(accountsCol(), accountId);

    await setDoc(
        ref,
        {
            onboardingCompletedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        },
        { merge: true },
    );
}

// Fetch a single account by ID
export async function getBusinessAccount(id: string): Promise<BusinessAccount | null> {
    const ref = doc(accountsCol(), id);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    return snap.data() as BusinessAccount;
}

