// src/models/profile.ts
import type { Timestamp } from "firebase/firestore";

export type AppUserKind = "customer" | "business_owner" | "staff";

export interface AppUserProfile {
    id: string;                // auth uid
    kind: AppUserKind;         // customer vs business owner vs staff

    // For business owners / staff: which account they primarily work in
    primaryAccountId?: string | null;

    createdAt: Timestamp;
    updatedAt: Timestamp;
}
