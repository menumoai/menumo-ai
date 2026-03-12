import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ReceiptText } from "lucide-react";

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
        return (
            <p className="px-6 py-6 text-sm text-gray-600">
                Loading account...
            </p>
        );
    }

    if (!accountId) {
        return (
            <p className="px-6 py-6 text-sm text-gray-600">
                No account.
            </p>
        );
    }

    if (!orderId) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-5xl">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h1
                            className="text-2xl font-bold text-gray-900"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            Invalid order ID
                        </h1>

                        <Link
                            to="/orders"
                            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-teal-700 transition hover:text-teal-800"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Orders
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (loading && !order) {
        return (
            <p className="px-6 py-6 text-sm text-gray-600">
                Loading...
            </p>
        );
    }

    if (!order) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-5xl">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h1
                            className="text-2xl font-bold text-gray-900"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            Order not found
                        </h1>

                        <Link
                            to="/orders"
                            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-teal-700 transition hover:text-teal-800"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Orders
                        </Link>

                        <p className="mt-4 text-sm text-gray-500">{statusMessage}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Back link */}
                <Link
                    to="/orders"
                    className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 transition hover:text-teal-800"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Orders
                </Link>

                {/* Page header */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-700">
                        <ReceiptText className="h-5 w-5 text-white" />
                    </div>

                    <div>
                        <h1
                            className="text-3xl font-bold text-gray-900"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            Order Details
                        </h1>
                        <p className="text-sm text-gray-500">
                            Review items, totals, and update fulfillment status
                        </p>
                    </div>
                </div>

                {/* Main card */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                    <OrderDetailHeader
                        order={order}
                        loading={loading}
                        onSetStatus={setOrderStatus}
                    />

                    <div className="mt-6">
                        <OrderLineItemsTable items={items} />
                    </div>

                    <div className="mt-6">
                        <OrderTotals order={order} />
                    </div>

                    <div className="mt-6 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">Status:</span>{" "}
                        {statusMessage}
                    </div>
                </div>
            </div>
        </div>
    );
}
