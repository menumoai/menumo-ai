// src/pages/OrderDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAccount } from "../account/AccountContext";
import {
    getOrder,
    listOrderLineItems,
    updateOrderStatus,
} from "../services/order";
import type { Order, OrderLineItem } from "../models/order";

export function OrderDetailPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const { accountId, loading: accountLoading } = useAccount();

    const [order, setOrder] = useState<Order | null>(null);
    const [items, setItems] = useState<OrderLineItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    const load = async (acct: string, id: string) => {
        setLoading(true);
        try {
            const o = await getOrder(acct, id);
            const li = await listOrderLineItems(acct, id);

            if (!o) {
                setOrder(null);
                setItems([]);
                setStatusMessage("Order not found");
                return;
            }

            setOrder(o);
            setItems(li);
            setStatusMessage("Order loaded ✅");
        } catch (err) {
            console.error(err);
            setStatusMessage("Failed to load order");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (accountLoading) return;
        if (!accountId) return;
        if (!orderId) {
            setStatusMessage("Invalid order ID");
            return;
        }
        void load(accountId, orderId);
    }, [accountId, accountLoading, orderId]);

    // Early states
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

    if (!orderId) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-6">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                    Invalid order ID
                </h1>
                <Link
                    to="/orders"
                    className="mt-3 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                    ⬅ Back to Orders
                </Link>
            </div>
        );
    }

    if (loading && !order) {
        return (
            <p className="px-6 py-6 text-sm text-slate-600 dark:text-slate-300">
                Loading...
            </p>
        );
    }

    if (!order) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-6">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                    Order not found
                </h1>
                <Link
                    to="/orders"
                    className="mt-3 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                    ⬅ Back to Orders
                </Link>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    {statusMessage}
                </p>
            </div>
        );
    }

    const statusFlow: Order["status"][] = [
        "pending",
        "accepted",
        "preparing",
        "ready",
        "completed",
    ];

    const currentIndex = statusFlow.indexOf(order.status);
    const nextStatus =
        currentIndex !== -1 && currentIndex < statusFlow.length - 1
            ? statusFlow[currentIndex + 1]
            : null;

    const handleStatusChange = async (newStatus: Order["status"]) => {
        if (!accountId || !orderId) return;
        setLoading(true);
        setStatusMessage(`Updating status to ${newStatus}...`);
        try {
            await updateOrderStatus(accountId, orderId, newStatus);
            setStatusMessage(`Status updated to ${newStatus} ✅`);
            await load(accountId, orderId);
        } catch (err) {
            console.error(err);
            setStatusMessage("Failed to update status");
        } finally {
            setLoading(false);
        }
    };

    const placedDate =
        order.placedAt &&
        new Date(
            (order.placedAt as any)?.toDate?.() ?? (order.placedAt as any)
        );

    const secondaryButton =
        "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium " +
        "text-slate-800 shadow-sm transition hover:border-indigo-400 hover:text-indigo-700 hover:shadow " +
        "disabled:cursor-not-allowed disabled:opacity-60 " +
        "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-indigo-400 dark:hover:text-indigo-300";

    const dangerButton =
        "inline-flex items-center justify-center rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-medium " +
        "text-white shadow-sm transition hover:bg-red-700 hover:border-red-700 " +
        "disabled:cursor-not-allowed disabled:opacity-60";

    const mutedButton =
        "inline-flex items-center justify-center rounded-lg border border-slate-600 bg-slate-600 px-3 py-1.5 text-xs font-medium " +
        "text-white shadow-sm transition hover:bg-slate-700 hover:border-slate-700 " +
        "disabled:cursor-not-allowed disabled:opacity-60";

    return (
        <div className="mx-auto max-w-4xl px-4 py-6">
            <Link
                to="/orders"
                className="mb-4 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
                ⬅ Back to Orders
            </Link>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {/* Header */}
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                            Order{" "}
                            <span className="font-mono text-xs">
                                {order.id}
                            </span>
                        </h1>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Channel:{" "}
                            <span className="font-medium">{order.channel}</span>{" "}
                            · Placed:{" "}
                            <span>
                                {placedDate ? placedDate.toLocaleString() : "—"}
                            </span>
                        </p>
                    </div>

                    {/* Status pill + actions */}
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            Status:{" "}
                            <span className="ml-1 font-semibold">{order.status}</span>
                        </span>

                        <div className="flex flex-wrap gap-2">
                            {nextStatus && (
                                <button
                                    onClick={() => handleStatusChange(nextStatus)}
                                    className={secondaryButton}
                                    disabled={loading}
                                >
                                    Mark as {nextStatus}
                                </button>
                            )}

                            {order.status !== "canceled" && (
                                <button
                                    onClick={() => handleStatusChange("canceled")}
                                    className={dangerButton}
                                    disabled={loading}
                                >
                                    Cancel Order
                                </button>
                            )}

                            {order.status !== "refunded" && (
                                <button
                                    onClick={() => handleStatusChange("refunded")}
                                    className={mutedButton}
                                    disabled={loading}
                                >
                                    Refund
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Line items */}
                <section className="mt-4">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Line Items
                    </h2>

                    {items.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            No items for this order.
                        </p>
                    ) : (
                        <div className="mt-2 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800">
                            <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-800">
                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Product
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Qty
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Price
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Subtotal
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                                    {items.map((li) => (
                                        <tr key={li.id}>
                                            <td className="px-3 py-2 text-sm text-slate-800 dark:text-slate-100">
                                                {li.productId}
                                            </td>
                                            <td className="px-3 py-2 text-right text-sm text-slate-700 dark:text-slate-200">
                                                {li.quantity}
                                            </td>
                                            <td className="px-3 py-2 text-right text-sm text-slate-700 dark:text-slate-200">
                                                ${li.unitPrice.toFixed(2)}
                                            </td>
                                            <td className="px-3 py-2 text-right text-sm font-medium text-slate-900 dark:text-slate-50">
                                                ${li.lineSubtotal.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* Totals */}
                <section className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Totals
                    </h2>
                    <dl className="mt-2 space-y-1 text-sm text-slate-800 dark:text-slate-100">
                        <div className="flex items-center justify-between">
                            <dt className="text-slate-600 dark:text-slate-300">Subtotal</dt>
                            <dd className="font-medium">
                                ${order.subtotalAmount.toFixed(2)}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt className="text-slate-600 dark:text-slate-300">Total</dt>
                            <dd className="font-semibold">
                                ${order.totalAmount.toFixed(2)}
                            </dd>
                        </div>
                    </dl>
                </section>

                {/* Status message */}
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">Status:</span> {statusMessage}
                </p>
            </div>
        </div>
    );
}
