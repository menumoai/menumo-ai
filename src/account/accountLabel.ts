// src/account/accountLabel.ts
import type { BusinessAccount } from "../models/account";

const FALLBACK = "your business";

/**
 * The human name for the active account, for use in page copy.
 *
 * Never returns the raw `accountId`. That value is the Firestore tenant key and,
 * for accounts created through signup, it is also the Firebase Auth UID - so it
 * belongs in queries and never in something a user can screenshot, share in a
 * support thread, or read over a shoulder. When there is no usable name we say
 * "your business", which reads better than an opaque string anyway.
 *
 * The Dev Console is the deliberate exception: showing the real id is the point
 * of a developer tool.
 */
export function accountLabel(
    account: Pick<BusinessAccount, "name"> | null | undefined,
): string {
    const name = account?.name?.trim();
    return name && name.length > 0 ? name : FALLBACK;
}
