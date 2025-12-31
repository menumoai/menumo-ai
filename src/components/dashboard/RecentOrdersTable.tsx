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
        return <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading...</p>;
    }

    if (orders.length === 0) {
        return (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                No orders yet. Your first ticket will show up here.
            </p>
        );
    }

    return (
        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="min-w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950/60">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Order ID
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Status
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Channel
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Total
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Placed At
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {orders.map((o) => {
                        const placed = toDate(o.placedAt);
                        const totalAmount = o.totalAmount ?? 0;

                        return (
                            <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/70">
                                <td className="px-4 py-2 align-top">
                                    <span className="font-mono text-xs text-slate-800 dark:text-slate-100">{o.id}</span>
                                </td>
                                <td className="px-4 py-2 align-top capitalize text-slate-700 dark:text-slate-200">{o.status}</td>
                                <td className="px-4 py-2 align-top text-slate-700 dark:text-slate-200">{o.channel}</td>
                                <td className="px-4 py-2 text-right align-top font-semibold text-slate-900 dark:text-slate-50">
                                    ${totalAmount.toFixed(2)}
                                </td>
                                <td className="px-4 py-2 align-top text-slate-600 dark:text-slate-300">
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
