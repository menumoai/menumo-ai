// src/components/inventory/InventoryStats.tsx
//
// Layout rule for this page: visual weight tracks urgency, and a number is
// printed once.
//
// Previously the same figures appeared three times - a header tile, a large
// gradient hero with pills, and a four-card grid - so an account with no stock
// got roughly 600px of chrome all saying zero, and the only useful control
// (record a movement) started below the fold. Now:
//
//   nothing tracked  -> one empty state with the two real ways in, no stat grid
//   needs attention  -> amber banner, because that is genuinely worth shouting
//   healthy          -> one quiet line, not a hero

import type { ReactNode } from "react";
import {
    AlertTriangle,
    Boxes,
    CheckCircle2,
    DollarSign,
    PackageX,
    PencilLine,
} from "lucide-react";
import type { InventorySummary } from "../../analysis/inventory";
import { formatMoney } from "./format";

function StatCard({
    label,
    value,
    hint,
    icon: Icon,
    iconColor,
    accent,
}: {
    label: string;
    value: string | number;
    hint: string;
    icon: typeof Boxes;
    iconColor: string;
    accent?: string;
}) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">{label}</span>
                <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
            <div
                className={`text-2xl font-bold tabular-nums ${accent ?? "text-gray-900"}`}
            >
                {value}
            </div>
            <div className="mt-1 text-xs text-gray-500">{hint}</div>
        </div>
    );
}

/**
 * Shown instead of the hero and the stat grid when nothing is tracked yet.
 * A grid of zeros teaches nothing; the two ways to get stock in do.
 */
export function InventoryEmptyState({
    scanSlot,
    onRecordMovement,
}: {
    /** The page owns the file input, so the button is passed in. */
    scanSlot: ReactNode;
    onRecordMovement: () => void;
}) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white">
                    <Boxes className="h-6 w-6" />
                </div>

                <div className="min-w-0 flex-1">
                    <h2
                        className="text-xl font-semibold text-gray-900"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                        Start tracking your stock
                    </h2>
                    <p className="mt-1.5 max-w-xl text-gray-600">
                        Two ways in. Photograph a supplier invoice and we read the
                        line items off it, or record a movement by hand if you have
                        no receipt to scan.
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        {scanSlot}
                        <button
                            type="button"
                            onClick={onRecordMovement}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            <PencilLine className="h-4 w-4" />
                            Record by hand
                        </button>
                    </div>

                    <p className="mt-5 border-t border-gray-100 pt-4 text-sm text-gray-500">
                        Once stock is in, this page shows what is running low, what
                        is about to expire, and what your inventory is worth.
                    </p>
                </div>
            </div>
        </div>
    );
}

/**
 * One line of status for an account that already has stock. Loud only when
 * something actually needs doing.
 */
export function InventoryStatusBar({ summary }: { summary: InventorySummary }) {
    const needsAttention = summary.outOfStock + summary.lowStock;

    if (needsAttention === 0) {
        return (
            <div className="flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-900">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-teal-600" />
                <span>
                    All {summary.trackedCount} tracked items are above their reorder
                    points.
                </span>
            </div>
        );
    }

    const parts = [
        summary.outOfStock > 0 ? `${summary.outOfStock} out of stock` : null,
        summary.lowStock > 0 ? `${summary.lowStock} running low` : null,
    ].filter(Boolean);

    return (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <span>
                <span className="font-semibold">
                    {needsAttention} item{needsAttention === 1 ? "" : "s"} need
                    attention
                </span>{" "}
                &middot; {parts.join(" and ")}. Restock below or scan a receipt.
            </span>
        </div>
    );
}

export function InventoryStats({ summary }: { summary: InventorySummary }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
                label="In Stock"
                value={summary.inStock}
                hint="Above reorder point"
                icon={CheckCircle2}
                iconColor="text-green-600"
            />
            <StatCard
                label="Low Stock"
                value={summary.lowStock}
                hint="At or below reorder point"
                icon={AlertTriangle}
                iconColor="text-amber-600"
                accent={summary.lowStock > 0 ? "text-amber-600" : undefined}
            />
            <StatCard
                label="Out of Stock"
                value={summary.outOfStock}
                hint="Nothing on hand"
                icon={PackageX}
                iconColor="text-red-600"
                accent={summary.outOfStock > 0 ? "text-red-600" : undefined}
            />
            <StatCard
                label="On-hand Value"
                value={formatMoney(summary.totalValue)}
                hint="Stock × unit cost"
                icon={DollarSign}
                iconColor="text-teal-600"
            />
        </div>
    );
}
