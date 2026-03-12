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
        hasRevenue && revenue > 0 ? (totalExpenseCents / revenue) * 100 : null;

    const net = hasRevenue ? revenue - totalExpenseCents : null;
    const ratioFill = ratio == null ? 0 : clamp(ratio, 0, 100);

    const ratioColor =
        ratio == null
            ? "bg-gray-200"
            : ratio <= 30
                ? "bg-emerald-500"
                : ratio <= 60
                    ? "bg-amber-500"
                    : "bg-rose-500";

    const netColor =
        net == null
            ? "text-gray-500"
            : net >= 0
                ? "text-emerald-600"
                : "text-rose-600";

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h2
                        className="text-lg font-semibold text-gray-900"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                        Expenses
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        {rangeLabel ??
                            (hasRevenue ? "Spend compared to revenue" : "Tracked spend")}
                    </p>
                </div>

                <div className="rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 border border-gray-100">
                    {ratio == null ? "Ratio —" : `${ratio.toFixed(1)}%`}
                </div>
            </div>

            <div className="mb-5">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                    Total Expenses
                </p>
                <p className="text-3xl font-bold text-gray-900">
                    {formatMoney(totalExpenseCents)}
                </p>
            </div>

            {hasRevenue && (
                <div className="mb-5">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Expense Ratio</span>
                        <span>{ratio == null ? "—" : `${ratio.toFixed(1)}%`}</span>
                    </div>

                    <div className="mt-2 h-2.5 w-full rounded-full bg-gray-100">
                        <div
                            className={`h-2.5 rounded-full ${ratioColor}`}
                            style={{ width: `${ratioFill}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-gray-50 p-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                        Revenue
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                        {hasRevenue ? formatMoney(revenue) : "—"}
                    </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
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
