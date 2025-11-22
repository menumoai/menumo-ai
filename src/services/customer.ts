// src/services/customer.ts
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
import type { Customer } from "../models/customer";

const customersCol = (accountId: string) =>
  collection(db, "accounts", accountId, "customers");

export async function createCustomer(params: {
  accountId: string;
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  marketingOptIn?: boolean;
  notes?: string;
}) {
  const {
    accountId,
    id,
    name,
    phone,
    email,
    marketingOptIn = false,
    notes,
  } = params;

  const col = customersCol(accountId);
  const ref = id ? doc(col, id) : doc(col);

  await setDoc(
    ref,
    {
      id: ref.id,
      accountId,
      name: name ?? null,
      phone: phone ?? null,
      email: email ?? null,
      notes: notes ?? null,
      marketingOptIn,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return ref.id;
}

export async function getCustomer(
  accountId: string,
  customerId: string
): Promise<Customer | null> {
  const ref = doc(customersCol(accountId), customerId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as Customer;
}

export async function listCustomers(accountId: string): Promise<Customer[]> {
  const q = query(customersCol(accountId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Customer);
}

