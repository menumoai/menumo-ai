// src/analysis/inventory.ts
//
// Pure, deterministic inventory computations. No I/O, no React. Given the raw
// products (and their denormalized `currentStock` / `reorderPoint`), derive the
// per-product stock rows and account-level rollups the inventory page renders.

import type { Product } from "../models/product";

export type StockStatus = "out" | "low" | "in" | "untracked";

export interface ProductStockRow {
    product: Product;
    currentStock: number;
    reorderPoint: number | null;
    status: StockStatus;
    /** On-hand value in dollars: currentStock * per-unit cost. */
    value: number;
}

export interface InventorySummary {
    rows: ProductStockRow[];
    /** Products that carry a tracked on-hand stock number. */
    trackedCount: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    /** Total on-hand value across all tracked products, in dollars. */
    totalValue: number;
    /** Rows needing attention (out or low), most urgent first. */
    attentionRows: ProductStockRow[];
}

/**
 * Classify a product's stock level. A product is only "low" when a reorder
 * point is set and stock is at or below it (but still above zero).
 */
export function stockStatus(
    currentStock: number | null | undefined,
    reorderPoint: number | null | undefined
): StockStatus {
    if (currentStock == null) return "untracked";
    if (currentStock <= 0) return "out";
    if (reorderPoint != null && currentStock <= reorderPoint) return "low";
    return "in";
}

const STATUS_URGENCY: Record<StockStatus, number> = {
    out: 0,
    low: 1,
    in: 2,
    untracked: 3,
};

/**
 * Only products that actually participate in inventory tracking should appear
 * on the inventory page: those with a stock number, a reorder point, or a
 * non-"each" stock unit. Purely digital services with no stock are excluded.
 */
export function isInventoryTracked(product: Product): boolean {
    return (
        typeof product.currentStock === "number" ||
        typeof product.reorderPoint === "number" ||
        (product.stockUnit != null && product.stockUnit !== "each")
    );
}

export function computeInventorySummary(products: Product[]): InventorySummary {
    const rows: ProductStockRow[] = products
        .filter((p) => p.isActive !== false)
        .filter(isInventoryTracked)
        .map((product) => {
            const currentStock = product.currentStock ?? 0;
            const reorderPoint =
                typeof product.reorderPoint === "number"
                    ? product.reorderPoint
                    : null;
            const status = stockStatus(product.currentStock, reorderPoint);
            const value = currentStock * (product.cost ?? 0);
            return { product, currentStock, reorderPoint, status, value };
        });

    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalValue = 0;

    for (const row of rows) {
        totalValue += row.value;
        if (row.status === "out") outOfStock += 1;
        else if (row.status === "low") lowStock += 1;
        else if (row.status === "in") inStock += 1;
    }

    const attentionRows = rows
        .filter((r) => r.status === "out" || r.status === "low")
        .sort((a, b) => {
            const byStatus =
                STATUS_URGENCY[a.status] - STATUS_URGENCY[b.status];
            if (byStatus !== 0) return byStatus;
            return a.currentStock - b.currentStock;
        });

    // Present rows most-urgent first so the table leads with what needs action.
    const sortedRows = [...rows].sort((a, b) => {
        const byStatus = STATUS_URGENCY[a.status] - STATUS_URGENCY[b.status];
        if (byStatus !== 0) return byStatus;
        return a.product.name.localeCompare(b.product.name);
    });

    return {
        rows: sortedRows,
        trackedCount: rows.length,
        inStock,
        lowStock,
        outOfStock,
        totalValue,
        attentionRows,
    };
}
