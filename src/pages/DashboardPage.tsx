import { useMemo } from "react";
import { useAccount } from "../account/AccountContext";

import { useDashboardOrders } from "../dashboard/useDashboardOrders";
import {
    computeDashboardSummary,
    selectRecentOrders,
} from "../dashboard/dashboardSelectors";

import { SummaryCards } from "../components/dashboard/SummaryCard";
import { RecentOrdersTable } from "../components/dashboard/RecentOrdersTable";

//  expenses hook + components
import { useExpenses } from "../hooks/useExpense";
import ExpensesSummaryCard from "../components/dashboard/ExpenseSummaryCard";
import ExpensesByCategoryCard from "../components/dashboard/ExpensesByCategoryCard";
import RecentExpensesTable from "../components/dashboard/RecentExpensesTable";
import RevenueVsExpensesPie from "../components/dashboard/RevenueVsExpensesPie";

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

    // only show a few recent expenses in the table (expenses already sorted)
    const recentExpenses = useMemo(() => expenses.slice(0, 8), [expenses]);

    if (accountLoading) {
        return (
            <p className="px-6 py-6 text-sm text-slate-600 dark:text-slate-300">
                Loading account...
            </p>
        );
    }

    if (!accountId) {
        return (
            <p className="px-6 py-6 text-sm text-slate-600 dark:text-slate-300">
                No account selected.
            </p>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-6">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    Dashboard
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Sales overview for{" "}
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                        {account?.name ?? accountId}
                    </span>
                </p>
            </header>

            <SummaryCards summary={summary} />

            {/*  Expenses section */}
            <section className="mt-8">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                        Expenses
                    </h2>

                    <div className="flex items-center gap-3">
                        {expensesLoading && expenses.length === 0 && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                Loading...
                            </span>
                        )}
                        {expensesError && (
                            <span className="text-xs text-rose-600 dark:text-rose-400">
                                {expensesError}
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3 md:items-stretch">
                    {/* Row 1 */}
                    <div className="md:col-span-1">
                        <ExpensesSummaryCard
                            totalExpenseCents={totalExpenseCents}
                            revenueCents={Math.round((summary.allTime.revenue ?? 0) * 100)}
                            rangeLabel="All time"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <RevenueVsExpensesPie
                            revenueCents={Math.round((summary.allTime.revenue ?? 0) * 100)}
                            expenseCents={totalExpenseCents}
                        />
                    </div>

                    {/* Row 2 */}
                    <div className="md:col-span-3">
                        <ExpensesByCategoryCard
                            rows={byCategory.map((r) => ({
                                category: r.category,
                                totalCents: r.totalCents,
                            }))}
                            maxRows={6}
                        />
                    </div>
                </div>
                <div className="mt-4">
                    <RecentExpensesTable expenses={recentExpenses} maxRows={8} />
                </div>
            </section>

            {/* Orders section */}
            <section className="mt-8">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                        Recent Orders
                    </h2>
                    {loading && orders.length === 0 && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            Loading...
                        </span>
                    )}
                </div>

                <RecentOrdersTable orders={recentOrders} loading={loading} />
            </section>

            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Status:</span> {status || "—"}
            </p>
        </div>
    );
}
