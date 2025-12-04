// src/services/profile.ts
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseClient";
import type { AppUserProfile, AppUserKind } from "../models/profile";

const profileDoc = (uid: string) => doc(db, "userProfiles", uid);

export async function getUserProfile(uid: string): Promise<AppUserProfile | null> {
    const snap = await getDoc(profileDoc(uid));
    if (!snap.exists()) return null;

    const data = snap.data() as AppUserProfile;

    const { id: _ignored, ...rest } = data;

    return {
        id: snap.id,
        ...rest,
    };
}

export async function upsertUserProfile(params: {
    uid: string;
    kind: AppUserKind;
    primaryAccountId?: string | null;
}): Promise<void> {
    const { uid, kind, primaryAccountId = null } = params;

    await setDoc(
        profileDoc(uid),
        {
            id: uid,
            kind,
            primaryAccountId,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(), // Firestore will keep first write
        },
        { merge: true }
    );
}
