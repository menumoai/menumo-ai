import type { Order } from "../../models/order";
import { getNextStatus, toDateSafe } from "../../orders/orderDetailSelectors";

export function OrderDetailHeader(props: {
    order: Order;
    loading: boolean;
    onSetStatus: (s: Order["status"]) => void;
}) {
    const { order, loading, onSetStatus } = props;

    const nextStatus = getNextStatus(order.status);
    const placedDate = toDateSafe(order.placedAt);

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
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    Order <span className="font-mono text-xs">{order.id}</span>
                </h1>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Channel: <span className="font-medium">{order.channel}</span> · Placed:{" "}
                    <span>{placedDate ? placedDate.toLocaleString() : "—"}</span>
                </p>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    Status: <span className="ml-1 font-semibold">{order.status}</span>
                </span>

                <div className="flex flex-wrap gap-2">
                    {nextStatus && (
                        <button
                            onClick={() => onSetStatus(nextStatus)}
                            className={secondaryButton}
                            disabled={loading}
                        >
                            Mark as {nextStatus}
                        </button>
                    )}

                    {order.status !== "canceled" && (
                        <button
                            onClick={() => onSetStatus("canceled")}
                            className={dangerButton}
                            disabled={loading}
                        >
                            Cancel Order
                        </button>
                    )}

                    {order.status !== "refunded" && (
                        <button
                            onClick={() => onSetStatus("refunded")}
                            className={mutedButton}
                            disabled={loading}
                        >
                            Refund
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
