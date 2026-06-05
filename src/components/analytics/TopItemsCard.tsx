import type { RankedMenuItem } from "../../analysis/types";

function formatMoney(cents: number) {
    return (cents / 100).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    });
}

export function TopItemsCard({ items }: { items: RankedMenuItem[] }) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5">
                <h2
                    className="text-xl font-semibold text-gray-900"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                >
                    Top Selling Items
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Ranked by realized revenue in the selected window.
                </p>
            </div>

            {items.length === 0 ? (
                <p className="text-sm text-gray-500">No menu item sales yet in this range.</p>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <div
                            key={item.productId}
                            className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="font-semibold text-gray-900">{item.name}</div>
                                    <div className="mt-1 text-xs text-gray-500">
                                        {item.category} · {item.quantity} sold · Avg{" "}
                                        {formatMoney(item.avgUnitPriceCents)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-gray-900">
                                        {formatMoney(item.revenueCents)}
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500">
                                        {item.orders} order rows
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
