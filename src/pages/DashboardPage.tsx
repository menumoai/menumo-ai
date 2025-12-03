// src/pages/DashboardPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "../account/AccountContext";
import { listOrders } from "../services/order";
import type { Order } from "../models/order";

type Summary = {
    count: number;
    revenue: number;
};

function startOfDay(d: Date) {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

function isSameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

export function DashboardPage() {
    const { accountId, loading: accountLoading, account } = useAccount();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    useEffect(() => {
        if (!accountId) return;

        const load = async () => {
            setLoading(true);
            setStatus("Loading orders...");
            try {
                const ords = await listOrders(accountId);
                setOrders(ords);
                setStatus(`Loaded ${ords.length} orders ✅`);
            } catch (err) {
                console.error("Error loading orders for dashboard", err);
                setStatus("Error loading orders");
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [accountId]);

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

    const { today, last7Days, allTime } = useMemo<{
        today: Summary;
        last7Days: Summary;
        allTime: Summary;
    }>(() => {
        const base: Summary = { count: 0, revenue: 0 };

        const acc = {
            today: { ...base },
            last7Days: { ...base },
            allTime: { ...base },
        };

        const now = new Date();
        const todayStart = startOfDay(now);
        const weekAgo = new Date(
            todayStart.getTime() - 7 * 24 * 60 * 60 * 1000
        );

        for (const o of orders) {
            const placed =
                o.placedAt instanceof Date
                    ? o.placedAt
                    : new Date(o.placedAt as unknown as string);

            const total = o.totalAmount ?? 0;

            acc.allTime.count += 1;
            acc.allTime.revenue += total;

            if (placed >= weekAgo && placed <= now) {
                acc.last7Days.count += 1;
                acc.last7Days.revenue += total;
            }

            if (isSameDay(placed, now)) {
                acc.today.count += 1;
                acc.today.revenue += total;
            }
        }

        return acc;
    }, [orders]);

    const recentOrders = useMemo(
        () =>
            [...orders]
                .sort((a, b) => {
                    const da =
                        a.placedAt instanceof Date
                            ? a.placedAt.getTime()
                            : new Date(
                                a.placedAt as unknown as string
                            ).getTime();
                    const db =
                        b.placedAt instanceof Date
                            ? b.placedAt.getTime()
                            : new Date(
                                b.placedAt as unknown as string
                            ).getTime();
                    return db - da;
                })
                .slice(0, 10),
        [orders]
    );

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

            {/* Summary cards */}
            <section className="mb-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Today
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Orders placed since midnight.
                    </p>
                    <div className="mt-4 space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Orders
                        </p>
                        <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                            {today.count}
                        </p>
                        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Revenue
                        </p>
                        <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                            ${today.revenue.toFixed(2)}
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Last 7 Days
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Rolling week, including today.
                    </p>
                    <div className="mt-4 space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Orders
                        </p>
                        <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                            {last7Days.count}
                        </p>
                        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Revenue
                        </p>
                        <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                            ${last7Days.revenue.toFixed(2)}
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        All Time
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Since this account started using Menumo.
                    </p>
                    <div className="mt-4 space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Orders
                        </p>
                        <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                            {allTime.count}
                        </p>
                        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Revenue
                        </p>
                        <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                            ${allTime.revenue.toFixed(2)}
                        </p>
                    </div>
                </div>
            </section>

            {/* Recent orders */}
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

                {loading && orders.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Loading...
                    </p>
                ) : recentOrders.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        No orders yet. Your first ticket will show up here.
                    </p>
                ) : (
                    <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-950/60">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Order ID
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Status
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Channel
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Total
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        Placed At
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {recentOrders.map((o) => {
                                    const placed =
                                        o.placedAt instanceof Date
                                            ? o.placedAt
                                            : new Date(
                                                o.placedAt as unknown as string
                                            );
                                    const totalAmount = o.totalAmount ?? 0;

                                    return (
                                        <tr
                                            key={o.id}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-900/70"
                                        >
                                            <td className="px-4 py-2 align-top">
                                                <span className="font-mono text-xs text-slate-800 dark:text-slate-100">
                                                    {o.id}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 align-top capitalize text-slate-700 dark:text-slate-200">
                                                {o.status}
                                            </td>
                                            <td className="px-4 py-2 align-top text-slate-700 dark:text-slate-200">
                                                {o.channel}
                                            </td>
                                            <td className="px-4 py-2 text-right align-top font-semibold text-slate-900 dark:text-slate-50">
                                                ${totalAmount.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 align-top text-slate-600 dark:text-slate-300">
                                                {placed.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Status:</span>{" "}
                {status || "—"}
            </p>
        </div>
    );
}
