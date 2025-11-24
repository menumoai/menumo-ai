// src/pages/DashboardPage.tsx
import { useEffect, useState } from "react";
import { collectionGroup, getDocs, query, where } from "firebase/firestore";

import { useAccount } from "../account/AccountContext";
import { db } from "../firebaseClient";
import { listOrders } from "../services/order";
import { listProducts } from "../services/product";

import type { Order } from "../models/order";
import type { Product } from "../models/product";
import type { OrderLineItem } from "../models/order";

interface TopProduct {
    productId: string;
    name: string;
    totalQuantity: number;
}

export function DashboardPage() {
    const { accountId, loading: accountLoading } = useAccount();
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [todayOrderCount, setTodayOrderCount] = useState(0);
    const [todayRevenue, setTodayRevenue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    useEffect(() => {
        if (!accountId || accountLoading) return;

        const load = async () => {
            setLoading(true);
            try {
                const [ords, prods] = await Promise.all([
                    listOrders(accountId),
                    listProducts(accountId),
                ]);

                setOrders(ords);
                setProducts(prods);

                // compute "today"
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                let todayCount = 0;
                let todayTotal = 0;

                for (const o of ords) {
                    if (!o.placedAt) continue;
                    const placed = (o.placedAt as any).toDate
                        ? (o.placedAt as any).toDate()
                        : new Date(o.placedAt as any);

                    if (placed >= today && placed < tomorrow) {
                        todayCount += 1;
                        todayTotal += o.totalAmount ?? 0;
                    }
                }

                setTodayOrderCount(todayCount);
                setTodayRevenue(todayTotal);

                // compute top products from lineItems via collectionGroup
                const lineItemsQuery = query(
                    collectionGroup(db, "lineItems"),
                    where("accountId", "==", accountId)
                );

                const snap = await getDocs(lineItemsQuery);
                const quantityByProduct: Record<string, number> = {};

                snap.forEach((docSnap) => {
                    const li = docSnap.data() as OrderLineItem;
                    if (!li.productId || !li.quantity) return;
                    quantityByProduct[li.productId] =
                        (quantityByProduct[li.productId] ?? 0) + li.quantity;
                });

                const productNameById: Record<string, string> = {};
                for (const p of prods) {
                    productNameById[p.id] = p.name;
                }

                const top = Object.entries(quantityByProduct)
                    .map(([productId, totalQuantity]) => ({
                        productId,
                        totalQuantity,
                        name: productNameById[productId] ?? productId,
                    }))
                    .sort((a, b) => b.totalQuantity - a.totalQuantity)
                    .slice(0, 5);

                setTopProducts(top);
                setStatus("Dashboard loaded ✅");
            } catch (err) {
                console.error(err);
                setStatus("Error loading dashboard");
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [accountId, accountLoading]);

    if (accountLoading) {
        return <p style={{ padding: "1.5rem" }}>Loading account...</p>;
    }

    if (!accountId) {
        return <p style={{ padding: "1.5rem" }}>No account.</p>;
    }

    return (
        <div style={{ padding: "1.5rem", maxWidth: 960, margin: "0 auto" }}>
            <h1>Dashboard</h1>
            <p style={{ color: "#555" }}>
                Account: <code>{accountId}</code>
            </p>

            {loading && <p>Loading...</p>}

            <section
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "1rem",
                    marginTop: "1rem",
                    marginBottom: "1.5rem",
                }}
            >
                <div
                    style={{
                        border: "1px solid #eee",
                        borderRadius: 8,
                        padding: "0.75rem 1rem",
                    }}
                >
                    <h3 style={{ margin: 0, marginBottom: "0.5rem" }}>Today’s Orders</h3>
                    <p style={{ fontSize: "1.8rem", margin: 0 }}>{todayOrderCount}</p>
                </div>
                <div
                    style={{
                        border: "1px solid #eee",
                        borderRadius: 8,
                        padding: "0.75rem 1rem",
                    }}
                >
                    <h3 style={{ margin: 0, marginBottom: "0.5rem" }}>Today’s Revenue</h3>
                    <p style={{ fontSize: "1.8rem", margin: 0 }}>
                        ${todayRevenue.toFixed(2)}
                    </p>
                </div>
                <div
                    style={{
                        border: "1px solid #eee",
                        borderRadius: 8,
                        padding: "0.75rem 1rem",
                    }}
                >
                    <h3 style={{ margin: 0, marginBottom: "0.5rem" }}>All Orders</h3>
                    <p style={{ fontSize: "1.8rem", margin: 0 }}>{orders.length}</p>
                </div>
                <div
                    style={{
                        border: "1px solid #eee",
                        borderRadius: 8,
                        padding: "0.75rem 1rem",
                    }}
                >
                    <h3 style={{ margin: 0, marginBottom: "0.5rem" }}>Menu Items</h3>
                    <p style={{ fontSize: "1.8rem", margin: 0 }}>{products.length}</p>
                </div>
            </section>

            <section>
                <h2>Top Products (by quantity sold)</h2>
                {topProducts.length === 0 ? (
                    <p style={{ color: "#777" }}>No sales yet.</p>
                ) : (
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            marginTop: "0.5rem",
                        }}
                    >
                        <thead>
                            <tr>
                                <th
                                    style={{
                                        textAlign: "left",
                                        borderBottom: "1px solid #eee",
                                        padding: "0.5rem",
                                    }}
                                >
                                    Product
                                </th>
                                <th
                                    style={{
                                        textAlign: "right",
                                        borderBottom: "1px solid #eee",
                                        padding: "0.5rem",
                                    }}
                                >
                                    Quantity
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProducts.map((tp) => (
                                <tr key={tp.productId}>
                                    <td
                                        style={{
                                            padding: "0.5rem",
                                            borderBottom: "1px solid #f5f5f5",
                                        }}
                                    >
                                        {tp.name}
                                    </td>
                                    <td
                                        style={{
                                            padding: "0.5rem",
                                            textAlign: "right",
                                            borderBottom: "1px solid #f5f5f5",
                                        }}
                                    >
                                        {tp.totalQuantity}
                                    </td>
                                </tr>
                            ))}
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
