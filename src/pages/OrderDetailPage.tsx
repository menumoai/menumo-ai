import { Link, useParams } from "react-router-dom";
import { useAccount } from "../account/AccountContext";
import { useOrderDetail } from "../hooks/useOrderDetail";

import { OrderDetailHeader } from "../components/orders/OrderDetailHeader";
import { OrderLineItemsTable } from "../components/orders/OrderLineItemsTable";
import { OrderTotals } from "../components/orders/OrderTotals";

export function OrderDetailPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const { accountId, loading: accountLoading } = useAccount();

    const { order, items, loading, statusMessage, setOrderStatus } =
        useOrderDetail(accountId ?? null, orderId ?? null);

    if (accountLoading) {
        return <p className="px-6 py-6 text-sm text-slate-600 dark:text-slate-300">Loading account...</p>;
    }
    if (!accountId) {
        return <p className="px-6 py-6 text-sm text-slate-600 dark:text-slate-300">No account.</p>;
    }
    if (!orderId) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-6">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Invalid order ID</h1>
                <Link to="/orders" className="mt-3 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                    ⬅ Back to Orders
                </Link>
            </div>
        );
    }
    if (loading && !order) {
        return <p className="px-6 py-6 text-sm text-slate-600 dark:text-slate-300">Loading...</p>;
    }
    if (!order) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-6">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Order not found</h1>
                <Link to="/orders" className="mt-3 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                    ⬅ Back to Orders
                </Link>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{statusMessage}</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-6">
            <Link
                to="/orders"
                className="mb-4 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
                ⬅ Back to Orders
            </Link>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <OrderDetailHeader order={order} loading={loading} onSetStatus={setOrderStatus} />
                <OrderLineItemsTable items={items} />
                <OrderTotals order={order} />

                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">Status:</span> {statusMessage}
                </p>
            </div>
        </div>
    );
}
