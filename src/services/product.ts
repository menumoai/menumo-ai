// src/services/product.ts
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
import type { Product } from "../models/product";

const productsCol = (accountId: string) =>
  collection(db, "accounts", accountId, "products");

export async function createProduct(params: {
  accountId: string;
  id?: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  cost?: number;
  isActive?: boolean;
  menuType?: Product["menuType"];
  stockUnit?: Product["stockUnit"];
  currentStock?: number;
  prepTimeSeconds?: number;
}) {
  const {
    accountId,
    id,
    name,
    description,
    category,
    price,
    cost,
    isActive = true,
    menuType = "food",
    stockUnit = "each",
    currentStock,
    prepTimeSeconds,
  } = params;

  const col = productsCol(accountId);
  const ref = id ? doc(col, id) : doc(col);

  await setDoc(
    ref,
    {
      id: ref.id,
      accountId,
      name,
      description: description ?? null,
      category: category ?? null,
      price,
      cost: cost ?? null,
      isActive,
      menuType,
      stockUnit,
      currentStock: currentStock ?? null,
      prepTimeSeconds: prepTimeSeconds ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return ref.id;
}

export async function getProduct(
  accountId: string,
  productId: string
): Promise<Product | null> {
  const ref = doc(productsCol(accountId), productId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as Product;
}

export async function listProducts(accountId: string): Promise<Product[]> {
  const q = query(productsCol(accountId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Product);
}

