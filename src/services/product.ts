// src/services/product.ts
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
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
  reorderPoint?: number | null;
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
    reorderPoint,
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
      reorderPoint: reorderPoint ?? null,
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

export async function updateProduct(params: {
  accountId: string;
  productId: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  cost?: number;
  isActive?: boolean;
  menuType?: Product["menuType"];
  stockUnit?: Product["stockUnit"];
  currentStock?: number;
  reorderPoint?: number | null;
  prepTimeSeconds?: number;
}) {
  const {
    accountId,
    productId,
    name,
    description,
    category,
    price,
    cost,
    isActive,
    menuType,
    stockUnit,
    currentStock,
    reorderPoint,
    prepTimeSeconds,
  } = params;

  const ref = doc(productsCol(accountId), productId);

  await updateDoc(ref, {
    name,
    description: description ?? null,
    category: category ?? null,
    price,
    cost: cost ?? null,
    ...(typeof isActive === "boolean" ? { isActive } : {}),
    ...(menuType ? { menuType } : {}),
    ...(stockUnit ? { stockUnit } : {}),
    ...(typeof currentStock === "number" ? { currentStock } : {}),
    ...(reorderPoint !== undefined ? { reorderPoint } : {}),
    ...(typeof prepTimeSeconds === "number" ? { prepTimeSeconds } : {}),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Focused setter for a product's low-stock threshold, used by the inventory
 * page's inline editor. Pass null to stop tracking a reorder point.
 */
export async function setProductReorderPoint(
  accountId: string,
  productId: string,
  reorderPoint: number | null
): Promise<void> {
  const ref = doc(productsCol(accountId), productId);
  await updateDoc(ref, {
    reorderPoint,
    updatedAt: serverTimestamp(),
  });
}
