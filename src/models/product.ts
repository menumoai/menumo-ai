// src/models/product.ts
import type { Timestamp } from "firebase/firestore";

export type MenuType = "food" | "drink" | "merch" | "service";
export type StockUnit = "each" | "lb" | "oz" | "liter" | "pack";

export interface ProductOption {
    id: string;                     // stable within the product
    label: string;                  // e.g. "Large", "Extra cheese"
    priceDelta?: number;            // +1.50 => adds to base price per unit
    isDefault?: boolean;
}

export interface ProductOptionGroup {
    id: string;                     // e.g. "size", "addons"
    name: string;                   // e.g. "Choose a size"
    description?: string | null;    // e.g. "Required, pick one"
    required?: boolean;             // must choose at least one?
    multiSelect?: boolean;          // false = radio, true = multi-checkbox
    minSelect?: number | null;      // optional extra constraints
    maxSelect?: number | null;
    options: ProductOption[];
}

export interface Product {
    id: string;
    accountId: string;

    name: string;
    description?: string | null;

    category?: string | null;
    menuType?: MenuType;

    sku?: string | null;
    isActive: boolean;

    price: number;        // base price
    cost?: number;        // #Money

    currentStock?: number;
    stockUnit?: StockUnit;
    prepTimeSeconds?: number;

    optionGroups?: ProductOptionGroup[];

    createdAt: Timestamp;
    updatedAt: Timestamp;
}
