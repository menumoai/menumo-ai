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
    const { accountId, loading: accountLoading } = useAccount();
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
        return <p style={{ padding: "1.5rem" }}>Loading account…</p>;
    }
    if (!accountId) {
        return <p style={{ padding: "1.5rem" }}>No account selected.</p>;
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const {
        today,
        last7Days,
        allTime,
    } = useMemo(() => {
        const base: Summary = { count: 0, revenue: 0 };

        const acc = {
            today: { ...base },
            last7Days: { ...base },
            allTime: { ...base },
        };

        for (const o of orders) {
            // We assume placedAt is a Date. If it's a string, parse it here.
            const placed = o.placedAt instanceof Date
                ? o.placedAt
                : new Date(o.placedAt as unknown as string);

            const total = o.totalAmount ?? 0;

            // All-time
            acc.allTime.count += 1;
            acc.allTime.revenue += total;

            // Last 7 days (inclusive)
            if (placed >= weekAgo && placed <= now) {
                acc.last7Days.count += 1;
                acc.last7Days.revenue += total;
            }

            // Today
            if (isSameDay(placed, now)) {
                acc.today.count += 1;
                acc.today.revenue += total;
            }
        }

        return acc;
    }, [orders, now.getTime()]);

    const recentOrders = useMemo(
        () =>
            [...orders]
                .sort((a, b) => {
                    const da = a.placedAt instanceof Date
                        ? a.placedAt.getTime()
                        : new Date(a.placedAt as unknown as string).getTime();
                    const db = b.placedAt instanceof Date
                        ? b.placedAt.getTime()
                        : new Date(b.placedAt as unknown as string).getTime();
                    return db - da;
                })
                .slice(0, 10),
        [orders]
    );

    return (
        <div style={{ padding: "1.5rem", maxWidth: 1000, margin: "0 auto" }}>
            <h1>Dashboard</h1>
            <p style={{ color: "#555" }}>
                Overview for account <code>{accountId}</code>
            </p>
            {/* Summary cards */}
            <section
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "1rem",
                    margin: "1.5rem 0",
                }}
            >
                <div
                    style={{
                        border: "1px solid #eee",
                        borderRadius: 8,
                        padding: "1rem",
                        background: "#fafafa",
                        color: "#222",   // ← make text dark
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>Today</h3>
                    <p style={{ margin: "0.25rem 0" }}>Orders: <strong>{today.count}</strong></p>
                    <p style={{ margin: "0.25rem 0" }}>Revenue: <strong>${today.revenue.toFixed(2)}</strong></p>
                </div>

                <div
                    style={{
                        border: "1px solid #eee",
                        borderRadius: 8,
                        padding: "1rem",
                        background: "#fafafa",
                        color: "#222",
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>Last 7 Days</h3>
                    <p style={{ margin: "0.25rem 0" }}>Orders: <strong>{last7Days.count}</strong></p>
                    <p style={{ margin: "0.25rem 0" }}>Revenue: <strong>${last7Days.revenue.toFixed(2)}</strong></p>
                </div>

                <div
                    style={{
                        border: "1px solid #eee",
                        borderRadius: 8,
                        padding: "1rem",
                        background: "#fafafa",
                        color: "#222",
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>All Time</h3>
                    <p style={{ margin: "0.25rem 0" }}>Orders: <strong>{allTime.count}</strong></p>
                    <p style={{ margin: "0.25rem 0" }}>Revenue: <strong>${allTime.revenue.toFixed(2)}</strong></p>
                </div>
            </section>


            {/* Recent orders */}
            <section style={{ marginTop: "1.5rem" }}>
                <h2>Recent Orders</h2>
                {loading && orders.length === 0 ? (
                    <p>Loading…</p>
                ) : recentOrders.length === 0 ? (
                    <p style={{ color: "#777" }}>No orders yet.</p>
                ) : (
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            marginTop: "0.5rem",
                            fontSize: "0.9rem",
                            color: "#222"
                        }}
                    >
                        <thead>
                            <tr>
                                <th
                                    style={{
                                        textAlign: "left",
                                        padding: "0.5rem",
                                        borderBottom: "1px solid #eee",
                                    }}
                                >
                                    Order ID
                                </th>
                                <th
                                    style={{
                                        textAlign: "left",
                                        padding: "0.5rem",
                                        borderBottom: "1px solid #eee",
                                    }}
                                >
                                    Status
                                </th>
                                <th
                                    style={{
                                        textAlign: "left",
                                        padding: "0.5rem",
                                        borderBottom: "1px solid #eee",
                                    }}
                                >
                                    Channel
                                </th>
                                <th
                                    style={{
                                        textAlign: "right",
                                        padding: "0.5rem",
                                        borderBottom: "1px solid #eee",
                                    }}
                                >
                                    Total
                                </th>
                                <th
                                    style={{
                                        textAlign: "left",
                                        padding: "0.5rem",
                                        borderBottom: "1px solid #eee",
                                    }}
                                >
                                    Placed At
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map((o) => {
                                const placed =
                                    o.placedAt instanceof Date
                                        ? o.placedAt
                                        : new Date(o.placedAt as unknown as string);

                                return (
                                    <tr key={o.id}>
                                        <td
                                            style={{
                                                padding: "0.5rem",
                                                borderBottom: "1px solid #f5f5f5",
                                            }}
                                        >
                                            <code>{o.id}</code>
                                        </td>
                                        <td
                                            style={{
                                                padding: "0.5rem",
                                                borderBottom: "1px solid #f5f5f5",
                                                textTransform: "capitalize",
                                            }}
                                        >
                                            {o.status}
                                        </td>
                                        <td
                                            style={{
                                                padding: "0.5rem",
                                                borderBottom: "1px solid #f5f5f5",
                                            }}
                                        >
                                            {o.channel}
                                        </td>
                                        <td
                                            style={{
                                                padding: "0.5rem",
                                                borderBottom: "1px solid #f5f5f5",
                                                textAlign: "right",
                                            }}
                                        >
                                            ${o.totalAmount.toFixed(2)}
                                        </td>
                                        <td
                                            style={{
                                                padding: "0.5rem",
                                                borderBottom: "1px solid #f5f5f5",
                                            }}
                                        >
                                            {placed.toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </section>

            <p style={{ marginTop: "1rem", color: "#555" }}>
                <strong>Status:</strong> {status}
            </p>
        </div>
    );
}
