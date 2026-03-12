import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import type { RevenueTrendPoint } from "../../dashboard/dashboardSelectors";

type Props = {
    data: RevenueTrendPoint[];
    title?: string;
    subtitle?: string;
};

function formatMoney(value: number) {
    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    });
}

export default function WeeklyRevenueTrendCard({
    data,
    title = "Weekly Revenue Trend",
    subtitle = "Revenue and order volume over the last 7 days",
}: Props) {
    const totalRevenue = data.reduce((sum, point) => sum + point.revenue, 0);
    const totalOrders = data.reduce((sum, point) => sum + point.orders, 0);
    const avgDailyRevenue = data.length > 0 ? totalRevenue / data.length : 0;
    const peakDay =
        data.length > 0
            ? data.reduce((max, point) => (point.revenue > max.revenue ? point : max), data[0])
            : null;

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h3
                        className="text-lg font-semibold text-gray-900"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                        {title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                </div>

                <div className="rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-xs text-gray-500">
                    7 days
                </div>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                        Total Revenue
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                        {formatMoney(totalRevenue)}
                    </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                        Orders
                    </p>
                    <p className="text-lg font-semibold text-gray-900">{totalOrders}</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                        Peak Day
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                        {peakDay ? peakDay.day : "—"}
                    </p>
                </div>
            </div>

            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis
                            stroke="#9ca3af"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            formatter={(value, name) => {
                                if (name === "revenue" && typeof value === "number") {
                                    return [formatMoney(value), "Revenue"];
                                }

                                if (name === "orders" && typeof value === "number") {
                                    return [value, "Orders"];
                                }

                                return [value ?? "—", String(name)];
                            }}
                            contentStyle={{
                                background: "white",
                                border: "1px solid #e5e7eb",
                                borderRadius: 12,
                                boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                            }}
                            labelStyle={{ color: "#111827", fontWeight: 600 }}
                        />                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#14b8a6"
                            strokeWidth={3}
                            dot={{ fill: "#14b8a6", r: 4 }}
                            activeDot={{ r: 6 }}
                            name="revenue"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                    <span className="h-3 w-3 rounded-full bg-teal-500" />
                    Revenue by day
                </div>

                <div className="text-gray-500">
                    Avg daily revenue:{" "}
                    <span className="font-medium text-gray-900">
                        {formatMoney(avgDailyRevenue)}
                    </span>
                </div>
            </div>
        </div>
    );
}
