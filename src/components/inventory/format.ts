// src/components/inventory/format.ts
import type { StockUnit } from "../../models/product";
import { STOCK_UNIT_LABELS } from "./meta";

/** Money stored as plain dollars in Firestore -> USD string. */
export function formatMoney(dollars: number): string {
    return (dollars || 0).toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    });
}

/** Trim trailing zeros so "3.00" reads as "3" but "3.5" stays "3.5". */
export function formatQtyValue(qty: number): string {
    return Number(qty.toFixed(2)).toLocaleString();
}

/** Quantity with its unit, e.g. "12 lb" or "3 each". */
export function formatQty(qty: number, unit?: StockUnit | null): string {
    const unitLabel = unit ? STOCK_UNIT_LABELS[unit] : "";
    return unitLabel ? `${formatQtyValue(qty)} ${unitLabel}` : formatQtyValue(qty);
}
