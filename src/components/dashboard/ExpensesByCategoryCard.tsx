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

export default function ExpensesByCategoryCard({
    rows,
    maxRows = 6,
}: Props) {
    const top = rows.slice(0, maxRows);
    const total = rows.reduce((s, r) => s + (r.totalCents || 0), 0);

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                    <h3
                        className="text-lg font-semibold text-gray-900"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                        Expenses by Category
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Top spending categories in the selected range.
                    </p>
                </div>

                <div className="rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-xs text-gray-500">
                    Total:{" "}
                    <span className="font-semibold text-gray-900">
                        {formatMoney(total)}
                    </span>
                </div>
            </div>

            {top.length === 0 ? (
                <div className="text-sm text-gray-500">No expenses yet.</div>
            ) : (
                <div className="space-y-4">
                    {top.map((r) => {
                        const pct =
                            total > 0 ? Math.min(100, (r.totalCents / total) * 100) : 0;

                        return (
                            <div key={r.category} className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-sm font-medium text-gray-700">
                                        {r.category}
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900">
                                        {formatMoney(r.totalCents)}
                                    </div>
                                </div>

                                <div className="h-2.5 w-full rounded-full bg-gray-100">
                                    <div
                                        className="h-2.5 rounded-full bg-teal-500"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>

                                <div className="text-right text-xs text-gray-500">
                                    {pct.toFixed(1)}%
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
