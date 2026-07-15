// src/components/inventory/InventoryStats.tsx
import {
    AlertTriangle,
    Boxes,
    CheckCircle2,
    DollarSign,
    PackageX,
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
            <div className={`text-2xl font-bold ${accent ?? "text-gray-900"}`}>
                {value}
            </div>
            <div className="mt-1 text-xs text-gray-500">{hint}</div>
        </div>
    );
}

export function InventoryHero({
    summary,
    accountName,
}: {
    summary: InventorySummary;
    accountName: string;
}) {
    const needsAttention = summary.outOfStock + summary.lowStock;

    const headline =
        needsAttention === 0
            ? summary.trackedCount === 0
                ? "No tracked stock yet"
                : "Stock levels look healthy"
            : `${needsAttention} item${needsAttention === 1 ? "" : "s"} need attention`;

    const body =
        summary.trackedCount === 0
            ? "Set a reorder point or record a purchase below to start tracking on-hand stock for your products."
            : needsAttention === 0
              ? `All ${summary.trackedCount} tracked items are above their reorder points. On-hand inventory is worth ${formatMoney(summary.totalValue)}.`
              : `${summary.outOfStock} out of stock and ${summary.lowStock} running low across ${accountName}. On-hand inventory is worth ${formatMoney(summary.totalValue)}.`;

    return (
        <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 p-6 text-white shadow-lg">
            <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                    <Boxes className="h-6 w-6" />
                </div>

                <div className="flex-1">
                    <h3 className="mb-2 text-lg font-semibold">{headline}</h3>
                    <p className="mb-4 text-teal-50">{body}</p>

                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                            <Boxes className="mr-1 inline h-4 w-4" />
                            {summary.trackedCount} tracked
                        </span>
                        <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                            <AlertTriangle className="mr-1 inline h-4 w-4" />
                            {summary.lowStock} low
                        </span>
                        <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                            <DollarSign className="mr-1 inline h-4 w-4" />
                            {formatMoney(summary.totalValue)} on hand
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function InventoryStats({ summary }: { summary: InventorySummary }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
