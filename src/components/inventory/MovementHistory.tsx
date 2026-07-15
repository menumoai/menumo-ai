// src/components/inventory/MovementHistory.tsx
import { useMemo } from "react";
import { History } from "lucide-react";
import type { InventoryEvent } from "../../models/inventoryEventType";
import type { Product } from "../../models/product";
import { movementMeta } from "./meta";
import { formatMoney, formatQtyValue } from "./format";

interface MovementHistoryProps {
    events: InventoryEvent[];
    products: Product[];
    loading: boolean;
}

export function MovementHistory({
    events,
    products,
    loading,
}: MovementHistoryProps) {
    const productMap = useMemo(() => {
        const map = new Map<string, Product>();
        for (const p of products) map.set(p.id, p);
        return map;
    }, [products]);

    return (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-teal-600" />
                    <h2
                        className="text-lg font-semibold text-gray-900"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                        Recent Movements
                    </h2>
                </div>
                <div className="text-sm text-gray-500">
                    {loading ? "Loading…" : `${events.length} entries`}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Date
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Product
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Type
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Change
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Unit Cost
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Note
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {events.map((event) => {
                            const product = productMap.get(event.productId);
                            const meta = movementMeta(event.type);
                            const Icon = meta.icon;
                            const positive = event.quantityDelta >= 0;
                            const unit = product?.stockUnit ?? "each";

                            return (
                                <tr
                                    key={event.id}
                                    className="transition-colors hover:bg-gray-50"
                                >
                                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                                        {event.occurredAt
                                            ?.toDate?.()
                                            .toLocaleDateString?.() ?? ""}
                                    </td>

                                    <td className="px-4 py-3 text-gray-900">
                                        {product?.name ?? "Unknown product"}
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1.5 text-gray-700">
                                            <Icon
                                                className={`h-4 w-4 ${meta.accent}`}
                                            />
                                            {meta.label}
                                        </span>
                                    </td>

                                    <td
                                        className={`px-4 py-3 text-right whitespace-nowrap font-semibold ${
                                            positive
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }`}
                                    >
                                        {positive ? "+" : "−"}
                                        {formatQtyValue(
                                            Math.abs(event.quantityDelta)
                                        )}
                                        <span className="ml-1 text-xs font-normal text-gray-500">
                                            {unit}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3 text-right whitespace-nowrap text-gray-700">
                                        {event.unitCost != null
                                            ? formatMoney(event.unitCost)
                                            : "—"}
                                    </td>

                                    <td className="px-4 py-3 text-gray-600">
                                        {event.reason || "—"}
                                    </td>
                                </tr>
                            );
                        })}

                        {!loading && events.length === 0 ? (
                            <tr>
                                <td
                                    className="px-4 py-10 text-center text-sm text-gray-500"
                                    colSpan={6}
                                >
                                    No movements recorded yet. Use the form above
                                    to log your first purchase or adjustment.
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
