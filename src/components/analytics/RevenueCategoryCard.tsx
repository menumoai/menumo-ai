import type { RevenueCategoryRow } from "../../analysis/types";

function formatMoney(cents: number) {
    return (cents / 100).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    });
}

export function RevenueCategoryCard({ rows }: { rows: RevenueCategoryRow[] }) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5">
                <h2
                    className="text-xl font-semibold text-gray-900"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                >
                    Revenue by Category
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Product revenue mix from order line items.
                </p>
            </div>

            {rows.length === 0 ? (
                <p className="text-sm text-gray-500">No category revenue yet in this range.</p>
            ) : (
                <div className="space-y-4">
                    {rows.slice(0, 6).map((row) => (
                        <div key={row.category} className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="font-medium text-gray-900">{row.category}</div>
                                    <div className="text-xs text-gray-500">{row.quantity} items sold</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-gray-900">
                                        {formatMoney(row.revenueCents)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {row.shareOfRevenuePct.toFixed(1)}%
                                    </div>
                                </div>
                            </div>

                            <div className="h-2.5 w-full rounded-full bg-gray-100">
                                <div
                                    className="h-2.5 rounded-full bg-teal-500"
                                    style={{ width: `${Math.min(100, row.shareOfRevenuePct)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
