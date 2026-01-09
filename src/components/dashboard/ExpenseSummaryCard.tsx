function formatMoney(cents: number) {
    const dollars = (cents || 0) / 100;
    return dollars.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    });
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

type Props = {
    totalExpenseCents: number;
    revenueCents?: number;
    rangeLabel?: string;
};

export default function ExpensesSummaryCard({
    totalExpenseCents,
    revenueCents,
    rangeLabel,
}: Props) {
    const hasRevenue = revenueCents != null;
    const revenue = revenueCents ?? 0;

    const ratio =
        hasRevenue && revenue > 0
            ? (totalExpenseCents / revenue) * 100
            : null;

    const net = hasRevenue ? revenue - totalExpenseCents : null;
    const ratioFill = ratio == null ? 0 : clamp(ratio, 0, 100);

    const ratioColor =
        ratio == null
            ? "bg-slate-200 dark:bg-slate-700"
            : ratio <= 30
                ? "bg-emerald-500"
                : ratio <= 60
                    ? "bg-amber-500"
                    : "bg-rose-500";

    const netColor =
        net == null
            ? "text-slate-500 dark:text-slate-400"
            : net >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400";

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Expenses
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {rangeLabel ??
                            (hasRevenue
                                ? "Spend compared to revenue"
                                : "Tracked spend")}
                    </p>
                </div>

                {/* Ratio pill */}
                <div className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300">
                    {ratio == null ? "Ratio —" : `${ratio.toFixed(1)}%`}
                </div>
            </div>

            {/* Main value */}
            <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Total Expenses
                </p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    {formatMoney(totalExpenseCents)}
                </p>
            </div>

            {/* Ratio bar */}
            {hasRevenue && (
                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Expense Ratio</span>
                        <span>{ratio == null ? "—" : `${ratio.toFixed(1)}%`}</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                            className={`h-2 rounded-full ${ratioColor}`}
                            style={{ width: `${ratioFill}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Bottom stats */}
            <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Revenue
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {hasRevenue ? formatMoney(revenue) : "—"}
                    </p>
                </div>

                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Net
                    </p>
                    <p className={`text-sm font-semibold ${netColor}`}>
                        {net == null ? "—" : formatMoney(net)}
                    </p>
                </div>
            </div>
        </div>
    );
}
