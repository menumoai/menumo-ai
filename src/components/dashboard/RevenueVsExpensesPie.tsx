import { useMemo } from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

type Props = {
    revenueCents: number;
    expenseCents: number;
    title?: string;
    subtitle?: string;
};

function formatMoney(cents: number) {
    const dollars = (cents || 0) / 100;
    return dollars.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    });
}

export default function RevenueVsExpensesPie({
    revenueCents,
    expenseCents,
    title = "Revenue vs Expenses",
    subtitle = "Share of revenue consumed by expenses",
}: Props) {
    const revenue = Math.max(0, revenueCents || 0);
    const expenses = Math.max(0, expenseCents || 0);

    const data = useMemo(() => {
        if (revenue <= 0 && expenses <= 0) {
            return [{ name: "No data", value: 1, key: "nodata" as const }];
        }

        const remaining = Math.max(0, revenue - expenses);

        if (revenue <= 0) {
            return [{ name: "Expenses", value: expenses, key: "expenses" as const }];
        }

        return [
            { name: "Expenses", value: expenses, key: "expenses" as const },
            { name: "Remaining", value: remaining, key: "remaining" as const },
        ];
    }, [revenue, expenses]);

    const ratio =
        revenue > 0 ? Math.min(999, (expenses / revenue) * 100) : null;

    const COLORS: Record<string, string> = {
        expenses: "#ef4444",
        remaining: "#14b8a6",
        nodata: "#9ca3af",
    };

    const legendRow = (
        label: string,
        value: string,
        swatchKey: keyof typeof COLORS,
    ) => (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
                <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[swatchKey] }}
                />
                <span className="text-gray-700">{label}</span>
            </div>
            <span className="font-semibold text-gray-900">{value}</span>
        </div>
    );

    return (
        <div className="h-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                    <h3
                        className="text-lg font-semibold text-gray-900"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                        {title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                </div>

                <div className="rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-right">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Expense Ratio
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                        {ratio == null ? "—" : `${ratio.toFixed(1)}%`}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 md:items-center">
                <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip
                                formatter={(value: any, name: any) => [
                                    formatMoney(Number(value) || 0),
                                    name,
                                ]}
                                contentStyle={{
                                    background: "white",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 12,
                                    color: "#111827",
                                    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                                }}
                                labelStyle={{ color: "#111827" }}
                            />
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={58}
                                outerRadius={82}
                                paddingAngle={2}
                                stroke="transparent"
                            >
                                {data.map((entry: any) => (
                                    <Cell
                                        key={entry.key}
                                        fill={COLORS[entry.key] ?? COLORS.nodata}
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                    {revenue <= 0 && expenses <= 0 ? (
                        <div className="text-sm text-gray-500">
                            No revenue or expense data available.
                        </div>
                    ) : revenue <= 0 ? (
                        <>
                            {legendRow("Expenses", formatMoney(expenses), "expenses")}
                            <div className="pt-1 text-xs text-gray-500">
                                Revenue is {formatMoney(0)} in this range.
                            </div>
                        </>
                    ) : (
                        <>
                            {legendRow("Expenses", formatMoney(expenses), "expenses")}
                            {legendRow(
                                "Remaining",
                                formatMoney(Math.max(0, revenue - expenses)),
                                "remaining",
                            )}

                            <div className="pt-1 text-xs text-gray-500">
                                Total revenue:{" "}
                                <span className="font-medium text-gray-900">
                                    {formatMoney(revenue)}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
