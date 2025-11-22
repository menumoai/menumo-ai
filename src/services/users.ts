// src/services/users.ts
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseClient";
import type { AccountUser, UserRole, UserStatus, AuthProvider } from "../models/user";

// Path helper for users subcollection
const usersCol = (accountId: string) =>
  collection(db, "accounts", accountId, "users");

// Create or update a user under an account
export async function createAccountUser(params: {
  accountId: string;
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  isEmployee?: boolean;
  authProvider?: AuthProvider;
  authSubjectId?: string;
}): Promise<void> {
  const {
    accountId,
    id,
    email,
    firstName,
    lastName,
    phone,
    role = "owner",
    status = "active",
    isEmployee = true,
    authProvider,
    authSubjectId,
  } = params;

  const ref = doc(usersCol(accountId), id);

  await setDoc(
    ref,
    {
      id,
      accountId,
      email,
      firstName,
      lastName: lastName ?? null,
      phone: phone ?? null,
      role,
      status,
      isEmployee,
      authProvider: authProvider ?? null,
      authSubjectId: authSubjectId ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// Fetch one user
export async function getAccountUser(accountId: string, userId: string): Promise<AccountUser | null> {
  const ref = doc(usersCol(accountId), userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as AccountUser;
}

// List all users for an account (simple, no pagination yet)
export async function listAccountUsers(accountId: string): Promise<AccountUser[]> {
  const q = query(usersCol(accountId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as AccountUser);
}

