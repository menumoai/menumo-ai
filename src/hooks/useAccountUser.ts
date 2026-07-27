// src/hooks/useAccountUser.ts
//
// Loads the signed-in person's record inside the active account. The Firebase
// `User` object only carries auth identity (uid, email, sometimes displayName);
// the actual first name the owner typed at signup lives on the AccountUser doc
// at accounts/{accountId}/users/{uid}.

import { useEffect, useState } from "react";
import type { AccountUser } from "../models/user";
import { getAccountUser } from "../services/users";

export function useAccountUser(
    accountId: string | null,
    userId: string | null | undefined,
) {
    // Held with the ids it was fetched for, so a stale record from a previous
    // account is never handed back while a new one is in flight.
    const [state, setState] = useState<{
        key: string;
        user: AccountUser | null;
    }>({ key: "", user: null });

    const key = accountId && userId ? `${accountId}/${userId}` : "";

    useEffect(() => {
        if (!key || !accountId || !userId) return;

        let cancelled = false;

        getAccountUser(accountId, userId)
            .then((found) => {
                if (!cancelled) setState({ key, user: found });
            })
            .catch((err) => {
                console.error("Failed to load account user", err);
                if (!cancelled) setState({ key, user: null });
            });

        return () => {
            cancelled = true;
        };
    }, [key, accountId, userId]);

    // Loading is derived, not stored: we are loading exactly when there is
    // something to fetch and what we hold was fetched for different ids. That
    // avoids a synchronous setState in the effect entirely.
    const matches = state.key === key && key !== "";

    return {
        accountUser: matches ? state.user : null,
        loading: key !== "" && !matches,
    };
}

/**
 * A first name to greet someone by, or null when we do not actually know it.
 *
 * Never derived from the email address. The local part of an email is an
 * identifier, not a name: "markechols099@gmail.com" gives "Markechols099",
 * and "j.smith@", "info@" or "hello@" are no better. Greeting a customer by a
 * mangled handle reads worse than not using their name at all, so when there is
 * no real name the caller should drop the name from the sentence entirely.
 */
export function greetingFirstName(
    accountUser: Pick<AccountUser, "firstName"> | null | undefined,
    displayName?: string | null,
): string | null {
    // The signup form asks for this directly, so it is the best source.
    // Google sign-in stores a full name here, hence the first-token split.
    const candidate = accountUser?.firstName?.trim() || displayName?.trim() || "";
    const first = candidate.split(/\s+/)[0] ?? "";

    // "Owner" is the placeholder createAccountUser falls back to; it is not a name.
    if (!first || first.toLowerCase() === "owner") return null;

    return first;
}
