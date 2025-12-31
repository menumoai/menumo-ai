import { useMemo } from "react";
import { useAccount } from "../account/AccountContext";

import { useDashboardOrders } from "../dashboard/useDashboardOrders";
import {
    computeDashboardSummary,
    selectRecentOrders,
} from "../dashboard/dashboardSelectors";

import { SummaryCards } from "../components/dashboard/SummaryCard";
import { RecentOrdersTable } from "../components/dashboard/RecentOrdersTable";

export function DashboardPage() {
    const { accountId, loading: accountLoading, account } = useAccount();

    const { orders, loading, status } = useDashboardOrders(accountId ?? null);

    const summary = useMemo(() => computeDashboardSummary(orders), [orders]);
    const recentOrders = useMemo(() => selectRecentOrders(orders, 10), [orders]);

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

            <section>
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
