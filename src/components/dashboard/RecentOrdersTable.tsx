import type { Order } from "../../models/order";
import { toDate } from "../../dashboard/dashboardSelectors";

export function RecentOrdersTable({
    orders,
    loading,
}: {
    orders: Order[];
    loading: boolean;
}) {
    if (loading && orders.length === 0) {
        return <p className="text-sm text-gray-500">Loading...</p>;
    }

    if (orders.length === 0) {
        return (
            <p className="text-sm text-gray-500">
                No orders yet. Your first ticket will show up here.
            </p>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Order ID
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Status
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Channel
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Total
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Placed
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                    {orders.map((o) => {
                        const placed = toDate(o.placedAt);
                        const totalAmount = o.totalAmount ?? 0;

                        return (
                            <tr
                                key={o.id}
                                className="transition-colors hover:bg-gray-50"
                            >
                                <td className="px-5 py-3">
                                    <span className="font-mono text-xs text-gray-700">
                                        {o.id.slice(0, 8)}
                                    </span>
                                </td>

                                <td className="px-5 py-3">
                                    <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 capitalize">
                                        {o.status}
                                    </span>
                                </td>

                                <td className="px-5 py-3 text-gray-700">{o.channel}</td>

                                <td className="px-5 py-3 text-right font-semibold text-gray-900">
                                    ${totalAmount.toFixed(2)}
                                </td>

                                <td className="px-5 py-3 text-gray-500">
                                    {placed.toLocaleString()}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
