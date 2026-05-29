import type { ChannelPerformanceRow } from "../../analysis/types";

function formatMoney(cents: number) {
    return (cents / 100).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    });
}

function formatChannelLabel(channel: string) {
    return channel.replace(/_/g, " ");
}

export function ChannelPerformanceCard({
    rows,
}: {
    rows: ChannelPerformanceRow[];
}) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5">
                <h2
                    className="text-xl font-semibold text-gray-900"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                >
                    Channel Performance
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Revenue and average ticket by order source.
                </p>
            </div>

            {rows.length === 0 ? (
                <p className="text-sm text-gray-500">No order channel data yet.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Channel
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Orders
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Revenue
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Avg Ticket
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((row) => (
                                <tr key={row.channel}>
                                    <td className="px-4 py-3 font-medium capitalize text-gray-900">
                                        {formatChannelLabel(row.channel)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-700">
                                        {row.orders}
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                        {formatMoney(row.revenueCents)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-700">
                                        {formatMoney(row.averageOrderValueCents)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
