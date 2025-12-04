import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

import { listOrders, createOrderWithLineItems } from "../services/order";
import { listProducts } from "../services/product";

import type { Order } from "../models/order";
import type { Product } from "../models/product";
import { useAccount } from "../account/AccountContext";

type OrderStatus = Order["status"];

interface QuantityMap {
    [productId: string]: string;
}

export function OrdersPage() {
    const { accountId, loading: accountLoading } = useAccount();

    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [quantities, setQuantities] = useState<QuantityMap>({});

    const [loadingOrders, setLoadingOrders] = useState(false);
    const [creatingOrder, setCreatingOrder] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
    const [todayOnly, setTodayOnly] = useState(false);

    const [showStaffForm, setShowStaffForm] = useState(false);

    const loadData = async (acctId: string) => {
        setLoadingOrders(true);
        try {
            const [ords, prods] = await Promise.all([
                listOrders(acctId),
                listProducts(acctId),
            ]);

            setOrders(ords);
            setProducts(prods);

            const init: QuantityMap = {};
            for (const p of prods) {
                init[p.id] = "";
            }
            setQuantities(init);

            setStatusMessage("Orders + products loaded ✅");
        } catch (err) {
            console.error(err);
            setStatusMessage("Error loading orders or products");
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        if (!accountId) return;
        void loadData(accountId);
    }, [accountId]);

    const handleQuantityChange = (productId: string, value: string) => {
        setQuantities((prev) => ({
            ...prev,
            [productId]: value,
        }));
    };

    const handleCreateOrder = async (e: FormEvent) => {
        e.preventDefault();
        if (!accountId) return;

        setStatusMessage("");
        setCreatingOrder(true);

        try {
            const items = products
                .map((p) => {
                    const raw = quantities[p.id];
                    const qty = raw ? parseInt(raw, 10) : 0;
                    if (!qty || Number.isNaN(qty) || qty <= 0) return null;

                    return {
                        productId: p.id,
                        quantity: qty,
                        unitPrice: p.price,
                    };
                })
                .filter((x) => x !== null) as {
                    productId: string;
                    quantity: number;
                    unitPrice: number;
                }[];

            if (items.length === 0) {
                setStatusMessage("Select at least one product with quantity > 0");
                setCreatingOrder(false);
                return;
            }

            const orderId = await createOrderWithLineItems({
                accountId,
                items,
                channel: "in_person", // staff-created
            });

            setStatusMessage(`Order created ✅ (id: ${orderId})`);

            const reset: QuantityMap = {};
            for (const p of products) {
                reset[p.id] = "";
            }
            setQuantities(reset);

            await loadData(accountId);
        } catch (err) {
            console.error("Error creating order", err);
            setStatusMessage("Error creating order");
        } finally {
            setCreatingOrder(false);
        }
    };

    const visibleOrders = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return orders.filter((o) => {
            if (statusFilter !== "all" && o.status !== statusFilter) return false;

            if (todayOnly) {
                if (!o.placedAt) return false;
                const placed = (o.placedAt as any).toDate
                    ? (o.placedAt as any).toDate()
                    : new Date(o.placedAt as any);
                if (!(placed >= today && placed < tomorrow)) return false;
            }

            return true;
        });
    }, [orders, statusFilter, todayOnly]);

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
                No account.
            </p>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-6">
            <header className="mb-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    Orders
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    For account{" "}
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                        {accountId}
                    </span>
                </p>
            </header>

            {/* Staff create order dropdown */}
            <section className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <button
                    type="button"
                    onClick={() => setShowStaffForm((prev) => !prev)}
                    className="flex w-full items-center justify-between border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-50 dark:hover:bg-slate-800"
                >
                    <span>Create Order (Staff)</span>
                    <span
                        className={`text-xs transition-transform ${showStaffForm ? "rotate-90" : ""
                            }`}
                    >
                        ▸
                    </span>
                </button>

                {showStaffForm && (
                    <div className="px-4 py-4">
                        {products.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                No products yet. Go to{" "}
                                <Link
                                    to="/menu"
                                    className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                    Menu
                                </Link>{" "}
                                to add items first.
                            </p>
                        ) : (
                            <form onSubmit={handleCreateOrder} className="space-y-3">
                                <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
                                    <table className="min-w-full border-collapse text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                <th className="px-3 py-2 text-left">Product</th>
                                                <th className="px-3 py-2 text-right">Price</th>
                                                <th className="px-3 py-2 text-right">Qty</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.map((p) => (
                                                <tr
                                                    key={p.id}
                                                    className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                                                >
                                                    <td className="px-3 py-2 align-top">
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
                                                                    {p.name}
                                                                </span>
                                                                {p.category && (
                                                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                                                        {p.category}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {p.description && (
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                    {p.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-right text-sm text-slate-900 dark:text-slate-50">
                                                        ${p.price.toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            step={1}
                                                            value={quantities[p.id] ?? ""}
                                                            onChange={(e) =>
                                                                handleQuantityChange(p.id, e.target.value)
                                                            }
                                                            className="w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-sm text-slate-900 outline-none ring-indigo-500/0 focus:border-indigo-500 focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <button
                                    type="submit"
                                    disabled={creatingOrder}
                                    className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                                >
                                    {creatingOrder ? "Creating..." : "Create Order"}
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </section>

            {/* Filters + tracking list */}
            <section>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                        Tracking Orders
                    </h2>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                        <label className="flex items-center gap-1">
                            <span className="text-xs font-medium">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value as OrderStatus | "all")
                                }
                                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 outline-none ring-indigo-500/0 focus:border-indigo-500 focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                            >
                                <option value="all">All</option>
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="preparing">Preparing</option>
                                <option value="ready">Ready</option>
                                <option value="completed">Completed</option>
                                <option value="canceled">Canceled</option>
                                <option value="refunded">Refunded</option>
                            </select>
                        </label>

                        <label className="flex items-center gap-1">
                            <input
                                type="checkbox"
                                checked={todayOnly}
                                onChange={(e) => setTodayOnly(e.target.checked)}
                                className="h-3 w-3 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600"
                            />
                            <span>Today only</span>
                        </label>
                    </div>
                </div>

                {loadingOrders && orders.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Loading orders...
                    </p>
                ) : visibleOrders.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        No orders match this filter.
                    </p>
                ) : (
                    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white text-sm shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                        {visibleOrders.map((o) => (
                            <li
                                key={o.id}
                                className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                            >
                                <div className="flex flex-col gap-0.5">
                                    <Link
                                        to={`/orders/${o.id}`}
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                                    >
                                        {o.id}
                                    </Link>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {o.channel} • {o.status}
                                    </span>
                                </div>
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                    ${o.totalAmount.toFixed(2)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Status:</span> {statusMessage || "—"}
            </p>
        </div>
    );
}
