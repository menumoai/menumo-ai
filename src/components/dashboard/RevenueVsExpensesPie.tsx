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

    // Pie needs positive slices. If revenue is 0, show all expenses.
    const data = useMemo(() => {
        if (revenue <= 0 && expenses <= 0) {
            return [{ name: "No data", value: 1, key: "nodata" as const }];
        }

        // show "Remaining" as revenue - expenses (floors at 0)
        const remaining = Math.max(0, revenue - expenses);

        // If revenue is 0 but expenses exist, show expenses only
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

    // Theme colors (match your slate + emerald vibe)
    // - Expenses: rose (negative)
    // - Remaining: emerald (positive)
    // - No data: slate
    const COLORS: Record<string, string> = {
        expenses: "#e11d48",   // rose-600
        remaining: "#10b981",  // emerald-500
        nodata: "#94a3b8",     // slate-400
    };

    const legendRow = (label: string, value: string, swatchKey: keyof typeof COLORS) => (
        <div className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
                <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[swatchKey] }}
                />
                <span className="text-slate-700 dark:text-slate-300">{label}</span>
            </div>
            <span className="font-medium text-slate-900 dark:text-slate-50">
                {value}
            </span>
        </div>
    );

    return (
        <div className="h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {subtitle}
                    </p>
                </div>

                <div className="text-right">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Expense Ratio
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {ratio == null ? "—" : `${ratio.toFixed(1)}%`}
                    </div>
                </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 md:items-center">
                <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip
                                formatter={(value: any, name: any) =>
                                    [formatMoney(Number(value) || 0), name]
                                }
                                contentStyle={{
                                    background: "rgba(15, 23, 42, 0.92)", // slate-900-ish
                                    border: "1px solid rgba(148, 163, 184, 0.25)",
                                    borderRadius: 10,
                                    color: "white",
                                }}
                                labelStyle={{ color: "white" }}
                            />
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={52}
                                outerRadius={72}
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

                <div className="space-y-2">
                    {revenue <= 0 && expenses <= 0 ? (
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            No revenue/expense data available.
                        </div>
                    ) : revenue <= 0 ? (
                        <>
                            {legendRow("Expenses", formatMoney(expenses), "expenses")}
                            <div className="pt-2 text-xs text-slate-500 dark:text-slate-400">
                                Revenue is $0 in this range.
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

                            <div className="pt-2 text-xs text-slate-500 dark:text-slate-400">
                                Total revenue:{" "}
                                <span className="font-medium text-slate-900 dark:text-slate-50">
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
