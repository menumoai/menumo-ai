import type { OrderLineItem } from "../../models/order";

export function OrderLineItemsTable(props: { items: OrderLineItem[] }) {
    const { items } = props;

    return (
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
                                        <div className="font-medium">{li.productId}</div>

                                        {li.selectedOptions?.length ? (
                                            <ul className="mt-1 space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                {li.selectedOptions.map((opt) => (
                                                    <li key={`${opt.groupId}-${opt.optionId}`}>
                                                        <span className="font-semibold">{opt.groupName}:</span>{" "}
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
    );
}
