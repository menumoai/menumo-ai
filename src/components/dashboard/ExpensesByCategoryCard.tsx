// src/components/dashboard/ExpensesByCategoryCard.tsx

function formatMoney(cents: number) {
    const dollars = (cents || 0) / 100;
    return dollars.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    });
}

type Row = { category: string; totalCents: number };

type Props = {
    rows: Row[];
    maxRows?: number;
};

export default function ExpensesByCategoryCard({ rows, maxRows = 6 }: Props) {
    const top = rows.slice(0, maxRows);
    const total = rows.reduce((s, r) => s + (r.totalCents || 0), 0);

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Expenses by Category
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Top spending categories in the selected range.
                    </p>
                </div>

                <div className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    Total:{" "}
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                        {formatMoney(total)}
                    </span>
                </div>
            </div>

            {top.length === 0 ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                    No expenses yet.
                </div>
            ) : (
                <div className="space-y-3">
                    {top.map((r) => {
                        const pct =
                            total > 0
                                ? Math.min(100, (r.totalCents / total) * 100)
                                : 0;

                        return (
                            <div key={r.category} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="text-slate-700 dark:text-slate-300">
                                        {r.category}
                                    </div>
                                    <div className="font-medium text-slate-900 dark:text-slate-50">
                                        {formatMoney(r.totalCents)}
                                    </div>
                                </div>

                                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                                    <div
                                        className="h-2 rounded-full bg-emerald-500 dark:bg-emerald-400"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
