// src/services/accounts.ts
import {
  collection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  FirestoreError,
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

// Fetch a single account by ID
export async function getBusinessAccount(id: string): Promise<BusinessAccount | null> {
  const ref = doc(accountsCol(), id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return snap.data() as BusinessAccount;
}

