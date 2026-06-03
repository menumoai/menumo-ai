import { useMemo } from "react";
import { DollarSign, Package, Receipt, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { computeRevenueAnalytics } from "../analysis/revenue";
import { useAccount } from "../account/AccountContext";
import ExpensesByCategoryCard from "../components/dashboard/ExpensesByCategoryCard";
import ExpensesSummaryCard from "../components/dashboard/ExpenseSummaryCard";
import RecentExpensesTable from "../components/dashboard/RecentExpensesTable";
import { RecentOrdersTable } from "../components/dashboard/RecentOrdersTable";
import RevenueVsExpensesPie from "../components/dashboard/RevenueVsExpensesPie";
import { SummaryCards } from "../components/dashboard/SummaryCard";
import { TopPerformersCard } from "../components/dashboard/TopPerformersCard";
import WeeklyRevenueTrendCard from "../components/dashboard/WeeklyRevenueTrendCard";
import { useAnalyticsSnapshot } from "../hooks/useAnalyticsSnapshot";

const PERFORMANCE_COLORS = ["#14b8a6", "#f59e0b", "#8b5cf6", "#3b82f6", "#ef4444"];

function formatMoney(cents: number) {
    return (cents / 100).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    });
}

export function DashboardPage() {
    const { accountId, loading: accountLoading, account } = useAccount();
    const { snapshot, loading, error, status } = useAnalyticsSnapshot(accountId ?? null);

    const analytics = useMemo(
        () => computeRevenueAnalytics(snapshot, { days: 30 }),
        [snapshot],
    );

    const allExpenseCents = useMemo(
        () => snapshot.expenses.reduce((sum, expense) => sum + (expense.amountCents ?? 0), 0),
        [snapshot.expenses],
    );

    const expenseByCategory = useMemo(() => {
        const totals = new Map<string, number>();

        for (const expense of snapshot.expenses) {
            totals.set(
                expense.category,
                (totals.get(expense.category) ?? 0) + (expense.amountCents ?? 0),
            );
        }

        return Array.from(totals.entries())
            .map(([category, totalCents]) => ({ category, totalCents }))
            .sort((left, right) => right.totalCents - left.totalCents);
    }, [snapshot.expenses]);

    const averageFoodCostPct = useMemo(() => {
        const pricedProducts = snapshot.products.filter(
            (product) =>
                product.price > 0 &&
                typeof product.cost === "number" &&
                Number.isFinite(product.cost),
        );

        if (pricedProducts.length === 0) {
            return null;
        }

        const totalPct = pricedProducts.reduce((sum, product) => {
            return sum + ((product.cost ?? 0) / product.price) * 100;
        }, 0);

        return totalPct / pricedProducts.length;
    }, [snapshot.products]);

    const wasteRisk = useMemo(() => {
        const soldProductIds = new Set(analytics.topItems.map((item) => item.productId));
        const stockedProducts = snapshot.products.filter(
            (product) =>
                typeof product.currentStock === "number" && Number.isFinite(product.currentStock) && product.currentStock > 0,
        );

        if (stockedProducts.length === 0) {
            return { atRiskCount: 0, pct: null as number | null };
        }

        const atRiskCount = stockedProducts.filter(
            (product) => !soldProductIds.has(product.id),
        ).length;

        return {
            atRiskCount,
            pct: (atRiskCount / stockedProducts.length) * 100,
        };
    }, [analytics.topItems, snapshot.products]);

    const topPerformerShare = useMemo(() => {
        const topItems = analytics.topItems.slice(0, 5);
        const totalRevenue = topItems.reduce((sum, item) => sum + item.revenueCents, 0);

        if (topItems.length === 0 || totalRevenue === 0) {
            return [];
        }

        return topItems.map((item, index) => ({
            name: item.name,
            value: (item.revenueCents / totalRevenue) * 100,
            color: PERFORMANCE_COLORS[index % PERFORMANCE_COLORS.length],
        }));
    }, [analytics.topItems]);

    const hasAnyData =
        snapshot.orders.length > 0 ||
        snapshot.expenses.length > 0 ||
        snapshot.products.length > 0;

    if (accountLoading) {
        return <p className="px-6 py-6 text-sm text-slate-600">Loading account...</p>;
    }

    if (!accountId) {
        return <p className="px-6 py-6 text-sm text-slate-600">No account selected.</p>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <div>
                    <h1
                        className="mb-1 text-2xl font-bold text-gray-900 sm:text-3xl"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                        Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Live business snapshot for{" "}
                        <span className="font-medium text-gray-900">
                            {account?.name ?? accountId}
                        </span>
                    </p>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 p-6 text-white shadow-lg">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                                <TrendingUp className="h-6 w-6" />
                            </div>

                            <div className="flex-1">
                                <h2 className="mb-2 text-lg font-semibold">Business Snapshot</h2>

                                <p className="mb-4 text-teal-50">
                                    You have {analytics.summary.allTime.count} tracked orders,{" "}
                                    {formatMoney(analytics.summary.allTime.revenueCents)} in all-time
                                    revenue, and {formatMoney(allExpenseCents)} in recorded expenses.
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                                        <Package className="mr-1 inline h-4 w-4" />
                                        {analytics.summary.allTime.count} Orders
                                    </span>
                                    <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                                        <DollarSign className="mr-1 inline h-4 w-4" />
                                        Avg Order{" "}
                                        {formatMoney(analytics.averageOrderValueCents)}
                                    </span>
                                    <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                                        <Receipt className="mr-1 inline h-4 w-4" />
                                        {snapshot.expenses.length} Expenses
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Link
                            to="/analytics/revenue"
                            className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-teal-700 shadow-sm transition hover:bg-teal-50"
                        >
                            Open revenue analytics
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                {account?.posConnected && (
                    <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800 shadow-sm">
                        Connected to {account.posProvider ?? "your POS"} and syncing analytics for{" "}
                        <span className="font-semibold text-teal-900">{account.name}</span>.
                    </div>
                )}

                {!hasAnyData && (
                    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2
                            className="text-xl font-semibold text-gray-900"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            Add your first data source
                        </h2>
                        <p className="mt-2 text-sm text-gray-500">
                            Start with the quickest path to make this dashboard useful.
                        </p>

                        <div className="mt-5 grid gap-4 md:grid-cols-3">
                            {[
                                {
                                    to: "/menu",
                                    title: "Add menu items",
                                    body: "Capture prices and food cost so profitability widgets can populate.",
                                },
                                {
                                    to: "/orders/new",
                                    title: "Log an order",
                                    body: "Sales trends, peak windows, and item rankings need at least one order.",
                                },
                                {
                                    to: "/expenses",
                                    title: "Record an expense",
                                    body: "Expense summaries and finance reports start here.",
                                },
                            ].map((item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className="rounded-xl border border-gray-100 bg-gray-50 p-4 transition hover:border-teal-200 hover:bg-teal-50"
                                >
                                    <div className="font-semibold text-gray-900">{item.title}</div>
                                    <div className="mt-2 text-sm text-gray-500">{item.body}</div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                <SummaryCards summary={analytics.summary} />
                <WeeklyRevenueTrendCard data={analytics.weeklyTrend} />

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Avg Food Cost</span>
                            <DollarSign className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {averageFoodCostPct == null ? "—" : `${averageFoodCostPct.toFixed(1)}%`}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">Target: 28–32%</div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Waste Risk</span>
                            <Receipt className="h-4 w-4 text-rose-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {wasteRisk.pct == null ? "—" : `${wasteRisk.pct.toFixed(1)}%`}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            {wasteRisk.atRiskCount} stocked items had no recent sales
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Tracked Products</span>
                            <Package className="h-4 w-4 text-teal-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {snapshot.products.length}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            Menu items with analytics-ready pricing data
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Top Item</span>
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {analytics.topItems[0]?.name ?? "—"}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            {analytics.topItems[0]
                                ? `${formatMoney(analytics.topItems[0].revenueCents)} in the last 30 days`
                                : "Need more sales data"}
                        </div>
                    </div>
                </section>

                <TopPerformersCard data={topPerformerShare} />

                <section className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <h2
                            className="text-xl font-semibold text-gray-900"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            Expenses
                        </h2>

                        {loading && snapshot.expenses.length === 0 && (
                            <span className="text-xs text-gray-500">Loading...</span>
                        )}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        <ExpensesSummaryCard
                            totalExpenseCents={allExpenseCents}
                            revenueCents={analytics.summary.allTime.revenueCents}
                            rangeLabel="All recorded expenses"
                        />

                        <div className="lg:col-span-2">
                            <RevenueVsExpensesPie
                                revenueCents={analytics.totalRevenueCents}
                                expenseCents={analytics.totalExpenseCents}
                                subtitle="Last 30 days"
                            />
                        </div>

                        <div className="lg:col-span-3">
                            <ExpensesByCategoryCard rows={expenseByCategory} maxRows={6} />
                        </div>
                    </div>

                    <RecentExpensesTable expenses={snapshot.expenses.slice(0, 8)} maxRows={8} />
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <h2
                            className="text-xl font-semibold text-gray-900"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            Recent Orders
                        </h2>

                        {loading && snapshot.orders.length === 0 && (
                            <span className="text-xs text-gray-500">Loading...</span>
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
