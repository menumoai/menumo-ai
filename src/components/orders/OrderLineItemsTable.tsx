import type { OrderLineItem } from "../../models/order";

export function OrderLineItemsTable(props: { items: OrderLineItem[] }) {
    const { items } = props;

    return (
        <section className="mt-4">
            <h2
                className="text-lg font-semibold text-gray-900"
                style={{ fontFamily: "Poppins, sans-serif" }}
            >
                Line Items
            </h2>

            {items.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">No items for this order.</p>
                </div>
            ) : (
                <div className="mt-3 overflow-hidden rounded-2xl border border-gray-100">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Product
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Qty
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Price
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Subtotal
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100 bg-white">
                            {items.map((li) => (
                                <tr key={li.id} className="transition-colors hover:bg-gray-50">
                                    <td className="px-4 py-3 align-top">
                                        <div className="font-medium text-gray-900">{li.productId}</div>

                                        {li.selectedOptions?.length ? (
                                            <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
                                                {li.selectedOptions.map((opt) => (
                                                    <li key={`${opt.groupId}-${opt.optionId}`}>
                                                        <span className="font-semibold text-gray-700">
                                                            {opt.groupName}:
                                                        </span>{" "}
                                                        <span>{opt.optionLabel}</span>
                                                        {!!opt.priceDelta && opt.priceDelta !== 0 && (
                                                            <span className="ml-1">
                                                                ({opt.priceDelta > 0 ? "+" : "-"}$
                                                                {Math.abs(opt.priceDelta).toFixed(2)})
                                                            </span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : null}
                                    </td>

                                    <td className="px-4 py-3 text-right text-gray-700">
                                        {li.quantity}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-700">
                                        ${li.unitPrice.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                        ${li.lineSubtotal.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
