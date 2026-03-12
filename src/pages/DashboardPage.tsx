import { useMemo } from "react";
import { DollarSign, Package, Receipt, TrendingUp } from "lucide-react";
import { useAccount } from "../account/AccountContext";

import { useDashboardOrders } from "../dashboard/useDashboardOrders";
import {
    computeDashboardSummary,
    selectRecentOrders,
} from "../dashboard/dashboardSelectors";

import { SummaryCards } from "../components/dashboard/SummaryCard";
import { RecentOrdersTable } from "../components/dashboard/RecentOrdersTable";

import { useExpenses } from "../hooks/useExpense";
import ExpensesSummaryCard from "../components/dashboard/ExpenseSummaryCard";
import ExpensesByCategoryCard from "../components/dashboard/ExpensesByCategoryCard";
import RecentExpensesTable from "../components/dashboard/RecentExpensesTable";
import RevenueVsExpensesPie from "../components/dashboard/RevenueVsExpensesPie";
import { selectWeeklyRevenueTrend } from "../dashboard/dashboardSelectors";
import WeeklyRevenueTrendCard from "../components/dashboard/WeeklyRevenueTrendCard";

export function DashboardPage() {
    const { accountId, loading: accountLoading, account } = useAccount();
    const { orders, loading, status } = useDashboardOrders(accountId ?? null);

    const {
        expenses,
        totalExpenseCents,
        byCategory,
        loading: expensesLoading,
        error: expensesError,
    } = useExpenses({ limit: 50 });

    const summary = useMemo(() => computeDashboardSummary(orders), [orders]);
    const recentOrders = useMemo(() => selectRecentOrders(orders, 10), [orders]);
    const recentExpenses = useMemo(() => expenses.slice(0, 8), [expenses]);
    const weeklyRevenueTrend = useMemo(
        () => selectWeeklyRevenueTrend(orders),
        [orders]
    );

    const revenueCents = Math.round((summary.allTime.revenue ?? 0) * 100);
    const orderCount = orders.length;
    const expenseCount = expenses.length;

    const avgOrderValue =
        orderCount > 0 ? Math.round(revenueCents / orderCount) : 0;

    if (accountLoading) {
        return (
            <p className="px-6 py-6 text-sm text-slate-600">
                Loading account...
            </p>
        );
    }

    if (!accountId) {
        return (
            <p className="px-6 py-6 text-sm text-slate-600">
                No account selected.
            </p>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div>
                    <h1
                        className="mb-1 text-2xl font-bold text-gray-900 sm:text-3xl"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                        Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Sales overview for{" "}
                        <span className="font-medium text-gray-900">
                            {account?.name ?? accountId}
                        </span>
                    </p>
                </div>

                {/* Business Snapshot */}
                <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 p-6 text-white shadow-lg">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                            <TrendingUp className="h-6 w-6" />
                        </div>

                        <div className="flex-1">
                            <h3 className="mb-2 text-lg font-semibold">
                                Business Snapshot
                            </h3>

                            <p className="mb-4 text-teal-50">
                                You have {orderCount} total orders tracked,{" "}
                                {(revenueCents / 100).toLocaleString("en-US", {
                                    style: "currency",
                                    currency: "USD",
                                })}{" "}
                                in revenue, and{" "}
                                {(totalExpenseCents / 100).toLocaleString("en-US", {
                                    style: "currency",
                                    currency: "USD",
                                })}{" "}
                                in recorded expenses.
                            </p>

                            <div className="flex flex-wrap gap-2">
                                <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                                    <Package className="mr-1 inline h-4 w-4" />
                                    {orderCount} Orders
                                </span>

                                <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                                    <DollarSign className="mr-1 inline h-4 w-4" />
                                    Avg Order{" "}
                                    {(avgOrderValue / 100).toLocaleString("en-US", {
                                        style: "currency",
                                        currency: "USD",
                                    })}
                                </span>

                                <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                                    <Receipt className="mr-1 inline h-4 w-4" />
                                    {expenseCount} Expenses
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <SummaryCards summary={summary} />
                <WeeklyRevenueTrendCard data={weeklyRevenueTrend} />
                {/* Expenses Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <h2
                            className="text-xl font-semibold text-gray-900"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            Expenses
                        </h2>

                        <div className="flex items-center gap-3">
                            {expensesLoading && expenses.length === 0 && (
                                <span className="text-xs text-gray-500">Loading...</span>
                            )}

                            {expensesError && (
                                <span className="text-xs text-rose-600">
                                    {expensesError}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        <ExpensesSummaryCard
                            totalExpenseCents={totalExpenseCents}
                            revenueCents={revenueCents}
                            rangeLabel="All time"
                        />

                        <div className="lg:col-span-2">
                            <RevenueVsExpensesPie
                                revenueCents={revenueCents}
                                expenseCents={totalExpenseCents}
                            />
                        </div>

                        <div className="lg:col-span-3">
                            <ExpensesByCategoryCard
                                rows={byCategory.map((r) => ({
                                    category: r.category,
                                    totalCents: r.totalCents,
                                }))}
                                maxRows={6}
                            />
                        </div>
                    </div>

                    <RecentExpensesTable expenses={recentExpenses} maxRows={8} />
                </section>

                {/* Orders Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <h2
                            className="text-xl font-semibold text-gray-900"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            Recent Orders
                        </h2>

                        {loading && orders.length === 0 && (
                            <span className="text-xs text-gray-500">
                                Loading...
                            </span>
                        )}
                    </div>

                    <RecentOrdersTable
                        orders={recentOrders}
                        loading={loading}
                    />
                </section>

                <p className="text-xs text-gray-500">
                    <span className="font-semibold">Status:</span>{" "}
                    {status || "—"}
                </p>
            </div>
        </div>
    );
}
