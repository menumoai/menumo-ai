// src/models/product.ts
import type { Timestamp } from "firebase/firestore";

export type MenuType = "food" | "drink" | "merch" | "service";
export type StockUnit = "each" | "lb" | "oz" | "liter" | "pack";

export interface Product {
  id: string;
  accountId: string;

  name: string;
  description?: string | null;

  category?: string | null;
  menuType?: MenuType;

  sku?: string | null;
  isActive: boolean;

  price: number;        // #Money
  cost?: number;        // #Money

  currentStock?: number;
  stockUnit?: StockUnit;
  prepTimeSeconds?: number;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

