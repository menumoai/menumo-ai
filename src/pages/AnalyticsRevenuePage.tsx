import { useMemo, useState } from "react";
import { BarChart3, RefreshCw, TrendingUp } from "lucide-react";
import { computeRevenueAnalytics } from "../analysis/revenue";
import { BottomItemsCard } from "../components/analytics/BottomItemsCard";
import { HourlyHeatmap } from "../components/analytics/HourlyHeatmap";
import { RevenueCategoryCard } from "../components/analytics/RevenueCategoryCard";
import { ChannelPerformanceCard } from "../components/analytics/ChannelPerformanceCard";
import { RevenueMetricGrid } from "../components/analytics/RevenueMetricGrid";
import { TopItemsCard } from "../components/analytics/TopItemsCard";
import WeeklyRevenueTrendCard from "../components/dashboard/WeeklyRevenueTrendCard";
import RevenueVsExpensesPie from "../components/dashboard/RevenueVsExpensesPie";
import { RecentOrdersTable } from "../components/dashboard/RecentOrdersTable";
import { useAccount } from "../account/AccountContext";
import { useAnalyticsSnapshot } from "../hooks/useAnalyticsSnapshot";

const RANGE_OPTIONS = [7, 30, 90] as const;

function formatMoney(cents: number) {
    return (cents / 100).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    });
}

export function AnalyticsRevenuePage() {
    const [days, setDays] = useState<(typeof RANGE_OPTIONS)[number]>(30);
    const { accountId, account, loading: accountLoading } = useAccount();
    const { snapshot, loading, error, status, reload } = useAnalyticsSnapshot(accountId ?? null);

    const analytics = useMemo(
        () => computeRevenueAnalytics(snapshot, { days }),
        [days, snapshot],
    );

    const expenseRatioPct =
        analytics.totalRevenueCents > 0
            ? (analytics.totalExpenseCents / analytics.totalRevenueCents) * 100
            : null;
    const periodOrderCount = analytics.periodTrend.reduce(
        (sum, point) => sum + point.orders,
        0,
    );

    const metrics = [
        {
            label: "Revenue",
            value: formatMoney(analytics.totalRevenueCents),
            detail: `Last ${days} days`,
        },
        {
            label: "Avg Order Value",
            value: formatMoney(analytics.averageOrderValueCents),
            detail: `${periodOrderCount} orders in the selected range`,
        },
        {
            label: "Peak Revenue Day",
            value: analytics.peakRevenueDay ?? "—",
            detail: analytics.bestChannel
                ? `Best channel: ${analytics.bestChannel.replace(/_/g, " ")}`
                : "Waiting for order data",
        },
        {
            label: "Estimated Gross Margin",
            value:
                analytics.estimatedGrossMarginPct == null
                    ? "—"
                    : `${analytics.estimatedGrossMarginPct.toFixed(1)}%`,
            detail: `${analytics.marginCoveragePct.toFixed(1)}% of item revenue has product cost coverage`,
        },
    ];

    if (accountLoading) {
        return <p className="px-6 py-6 text-sm text-slate-600">Loading account...</p>;
    }

    if (!accountId) {
        return <p className="px-6 py-6 text-sm text-slate-600">No account selected.</p>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-700">
                                <BarChart3 className="h-5 w-5 text-white" />
                            </div>

                            <h1
                                className="text-3xl font-bold text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                Revenue Analytics
                            </h1>
                        </div>

                        <p className="text-gray-600">
                            Live order, product, and expense trends for{" "}
                            <span className="font-medium text-gray-900">
                                {account?.name ?? accountId}
                            </span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                            {RANGE_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => setDays(option)}
                                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${days === option
                                        ? "bg-teal-600 text-white"
                                        : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    {option}d
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => void reload()}
                            className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 p-6 text-white shadow-lg">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                            <TrendingUp className="h-6 w-6" />
                        </div>

                        <div className="flex-1">
                            <h2 className="mb-2 text-lg font-semibold">Revenue Snapshot</h2>
                            <p className="mb-4 text-teal-50">
                                {formatMoney(analytics.totalRevenueCents)} in revenue over the last{" "}
                                {days} days, against {formatMoney(analytics.totalExpenseCents)} in
                                tracked expenses.
                            </p>

                            <div className="flex flex-wrap gap-2">
                                <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                                    {analytics.periodTrend.length} daily data points
                                </span>
                                <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                                    Expense ratio{" "}
                                    {expenseRatioPct == null ? "—" : `${expenseRatioPct.toFixed(1)}%`}
                                </span>
                                <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                                    {analytics.topItems.length} items with sales in range
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                <RevenueMetricGrid metrics={metrics} />

                <WeeklyRevenueTrendCard
                    data={analytics.periodTrend}
                    title={`Revenue trend (${days} days)`}
                    subtitle="Daily revenue and order volume in the selected window"
                />

                <section className="grid gap-6 lg:grid-cols-2">
                    <RevenueVsExpensesPie
                        revenueCents={analytics.totalRevenueCents}
                        expenseCents={analytics.totalExpenseCents}
                        title="Revenue vs Expenses"
                        subtitle={`Tracked expenses against revenue for the last ${days} days`}
                    />
                    <RevenueCategoryCard rows={analytics.categoryRevenue} />
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                    <TopItemsCard items={analytics.topItems} />
                    <ChannelPerformanceCard rows={analytics.channelPerformance} />
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="mb-5">
                            <h2
                                className="text-xl font-semibold text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                Hourly Sales Heatmap
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Revenue concentration by weekday and hour in the selected window.
                            </p>
                        </div>

                        <HourlyHeatmap data={analytics.hourlyBuckets} />
                    </div>

                    <BottomItemsCard items={analytics.bottomItems} />
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <h2
                            className="text-xl font-semibold text-gray-900"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            Recent Revenue Orders
                        </h2>

                        {loading && (
                            <span className="text-xs text-gray-500">Refreshing analytics...</span>
                        )}
                    </div>

                    <RecentOrdersTable orders={analytics.recentOrders} loading={loading} />
                </section>

                <p className="text-xs text-gray-500">
                    <span className="font-semibold">Status:</span> {status || "—"}
                </p>
            </div>
        </div>
    );
}
