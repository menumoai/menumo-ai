// src/components/inventory/meta.ts
//
// Shared, JSX-free metadata for the inventory feature: how each stock status
// and movement type should read and look. Kept in one place so the badge, the
// form, and the history table stay in sync.

import {
    PackagePlus,
    ShoppingCart,
    SlidersHorizontal,
    Trash2,
    type LucideIcon,
} from "lucide-react";
import type { StockStatus } from "../../analysis/inventory";
import type { StockUnit } from "../../models/product";
import type { InventoryEventType } from "../../models/inventoryEventType";

export const STOCK_UNIT_LABELS: Record<StockUnit, string> = {
    each: "each",
    lb: "lb",
    oz: "oz",
    liter: "L",
    pack: "pack",
};

export interface StatusMeta {
    label: string;
    /** Pill background + text classes. */
    pill: string;
    /** Leading dot color. */
    dot: string;
}

export const STATUS_META: Record<StockStatus, StatusMeta> = {
    out: {
        label: "Out of stock",
        pill: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
        dot: "bg-red-500",
    },
    low: {
        label: "Low stock",
        pill: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
        dot: "bg-amber-500",
    },
    in: {
        label: "In stock",
        pill: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
        dot: "bg-green-500",
    },
    untracked: {
        label: "Untracked",
        pill: "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200",
        dot: "bg-gray-400",
    },
};

export interface MovementTypeMeta {
    value: InventoryEventType;
    label: string;
    /** Sign applied to the entered quantity to form the stock delta. */
    direction: 1 | -1 | 0; // 0 = user picks direction (adjustment)
    icon: LucideIcon;
    /** Tailwind text color for the icon/amount. */
    accent: string;
    description: string;
}

export const MOVEMENT_TYPES: MovementTypeMeta[] = [
    {
        value: "purchase",
        label: "Purchase / Restock",
        direction: 1,
        icon: PackagePlus,
        accent: "text-green-600",
        description: "Received new stock from a supplier",
    },
    {
        value: "sale",
        label: "Sale",
        direction: -1,
        icon: ShoppingCart,
        accent: "text-blue-600",
        description: "Sold or used to fulfill orders",
    },
    {
        value: "waste",
        label: "Waste / Spoilage",
        direction: -1,
        icon: Trash2,
        accent: "text-red-600",
        description: "Spoiled, damaged, or discarded",
    },
    {
        value: "adjustment",
        label: "Manual adjustment",
        direction: 0,
        icon: SlidersHorizontal,
        accent: "text-purple-600",
        description: "Correct the count after a physical recount",
    },
];

export function movementMeta(type: InventoryEventType): MovementTypeMeta {
    return MOVEMENT_TYPES.find((m) => m.value === type) ?? MOVEMENT_TYPES[0];
}
