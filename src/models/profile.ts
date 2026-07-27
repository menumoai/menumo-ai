// src/models/profile.ts
import type { Timestamp } from "firebase/firestore";

export type AppUserKind = "customer" | "business_owner" | "staff";

export interface AppUserProfile {
    id: string;                // auth uid
    kind: AppUserKind;         // customer vs business owner vs staff

    // For business owners / staff: which account they primarily work in
    primaryAccountId?: string | null;

    /**
     * Menumo staff only. Unlocks internal tooling such as the Dev Console.
     *
     * Deliberately NOT settable through `upsertUserProfile` - the app must have
     * no code path that grants it, so the only way to become internal is an
     * out-of-band write (Firebase console or an admin script). Note that the UI
     * guard this drives is a convenience, not a security boundary: the real
     * boundary is a Firestore rule that forbids clients writing this field.
     */
    isInternal?: boolean;

    createdAt: Timestamp;
    updatedAt: Timestamp;
}
