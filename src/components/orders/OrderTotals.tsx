import type { Order } from "../../models/order";

export function OrderTotals(props: { order: Order }) {
    const { order } = props;

    return (
        <section className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Totals
            </h2>

            <dl className="mt-2 space-y-1 text-sm text-slate-800 dark:text-slate-100">
                <div className="flex items-center justify-between">
                    <dt className="text-slate-600 dark:text-slate-300">Subtotal</dt>
                    <dd className="font-medium">${order.subtotalAmount.toFixed(2)}</dd>
                </div>
                <div className="flex items-center justify-between">
                    <dt className="text-slate-600 dark:text-slate-300">Total</dt>
                    <dd className="font-semibold">${order.totalAmount.toFixed(2)}</dd>
                </div>
            </dl>
        </section>
    );
}
