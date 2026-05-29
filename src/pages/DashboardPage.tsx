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
import WeeklyRevenueTrendCard from "../components/dashboard/WeeklyRevenueTrendCard";
import { useAnalyticsSnapshot } from "../hooks/useAnalyticsSnapshot";

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

                <SummaryCards summary={analytics.summary} />
                <WeeklyRevenueTrendCard data={analytics.weeklyTrend} />

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
