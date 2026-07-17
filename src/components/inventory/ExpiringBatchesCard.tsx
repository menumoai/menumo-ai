// src/components/inventory/ExpiringBatchesCard.tsx
import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import type { Product } from "../../models/product";
import type { BatchRisk, BatchRiskSummary } from "../../analysis/shelfLife";
import { RISK_META } from "./meta";
import { formatMoney, formatQtyValue } from "./format";

function riskTiming(daysUntilExpiry: number): string {
    if (daysUntilExpiry < 0) {
        const days = Math.abs(daysUntilExpiry);
        return `expired ${days} day${days === 1 ? "" : "s"} ago`;
    }
    if (daysUntilExpiry === 0) return "expires today";
    return `spoils in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"}`;
}

function RiskRow({
    risk,
    productName,
}: {
    risk: BatchRisk;
    productName: string;
}) {
    const meta = RISK_META[risk.level];
    return (
        <li className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.pill}`}
                    >
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                    </span>
                    <span className="truncate font-medium text-gray-900">
                        {productName}
                    </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                    {formatQtyValue(risk.batch.quantityRemaining)} {risk.batch.unit} left
                    {" · "}
                    {riskTiming(risk.daysUntilExpiry)}
                </div>
            </div>
            {risk.value > 0 ? (
                <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold text-gray-900">
                        {formatMoney(risk.value)}
                    </div>
                    <div className="text-xs text-gray-500">at risk</div>
                </div>
            ) : null}
        </li>
    );
}

/**
 * Surfaces batches that are expired, critical, or expiring soon, most urgent
 * first. Renders nothing when there is nothing at risk, so the page stays clean.
 */
export function ExpiringBatchesCard({
    summary,
    products,
}: {
    summary: BatchRiskSummary;
    products: Product[];
}) {
    const productNames = useMemo(() => {
        const map = new Map<string, string>();
        for (const p of products) map.set(p.id, p.name);
        return map;
    }, [products]);

    const rows = useMemo(
        () => [...summary.expired, ...summary.critical, ...summary.expiringSoon],
        [summary]
    );

    if (rows.length === 0) return null;

    const urgentCount = summary.expired.length + summary.critical.length;

    return (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <h2
                        className="text-lg font-semibold text-gray-900"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                        Use it or lose it
                    </h2>
                </div>
                {summary.atRiskValue > 0 ? (
                    <div className="text-right">
                        <div className="text-sm font-bold text-amber-700">
                            {formatMoney(summary.atRiskValue)}
                        </div>
                        <div className="text-xs text-gray-500">at risk</div>
                    </div>
                ) : null}
            </div>

            <p className="mb-1 text-sm text-gray-600">
                {urgentCount > 0
                    ? `${urgentCount} batch${urgentCount === 1 ? "" : "es"} need${urgentCount === 1 ? "s" : ""} attention now.`
                    : "Some batches are approaching their expiry."}
            </p>

            <ul className="divide-y divide-amber-100">
                {rows.map((risk) => (
                    <RiskRow
                        key={risk.batch.id}
                        risk={risk}
                        productName={
                            productNames.get(risk.batch.productId) ?? "Unknown item"
                        }
                    />
                ))}
            </ul>
        </section>
    );
}
