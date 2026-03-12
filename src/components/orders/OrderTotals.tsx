import { DollarSign } from "lucide-react";
import type { Order } from "../../models/order";

export function OrderTotals(props: { order: Order }) {
    const { order } = props;

    return (
        <section className="mt-6 border-t border-gray-100 pt-5">
            <div className="mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <h2
                    className="text-lg font-semibold text-gray-900"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                >
                    Totals
                </h2>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
                <dl className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <dt className="text-gray-600">Subtotal</dt>
                        <dd className="font-medium text-gray-900">
                            ${order.subtotalAmount.toFixed(2)}
                        </dd>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                        <dt className="font-medium text-gray-700">Total</dt>
                        <dd className="text-lg font-bold text-gray-900">
                            ${order.totalAmount.toFixed(2)}
                        </dd>
                    </div>
                </dl>
            </div>
        </section>
    );
}
