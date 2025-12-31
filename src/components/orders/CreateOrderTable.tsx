// src/components/orders/CreateOrderTable.tsx
import type { FC } from "react";
import type { Product } from "../../models/product";
import { ProductOptionsSelector } from "./ProductOptionsSelector";

// These shapes match what you're using in CreateOrderPage
export interface QuantityMap {
    [productId: string]: string;
}

export interface SelectedOptionsMap {
    [productId: string]: {
        [groupId: string]: string[];
    };
}

interface CreateOrderTableProps {
    products: Product[];
    quantities: QuantityMap;
    selectedOptions: SelectedOptionsMap;
    onQuantityChange: (productId: string, value: string) => void;
    onToggleOption: (
        productId: string,
        groupId: string,
        optionId: string,
        multiSelect: boolean
    ) => void;
}

/**
 * Staff-facing order creation table:
 * - product info
 * - customization options
 * - quantity input
 */
export const CreateOrderTable: FC<CreateOrderTableProps> = ({
    products,
    quantities,
    selectedOptions,
    onQuantityChange,
    onToggleOption,
}) => {
    return (
        <div className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800">
            <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Product
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Price
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Qty
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                    {products.map((p) => (
                        <tr key={p.id}>
                            <td className="px-3 py-2 align-top text-sm text-slate-800 dark:text-slate-100">
                                <div className="font-medium">{p.name}</div>
                                {p.category && (
                                    <div className="mt-0.5 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                        {p.category}
                                    </div>
                                )}
                                {p.description && (
                                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {p.description}
                                    </div>
                                )}

                                {/* shared options UI */}
                                <ProductOptionsSelector
                                    productId={p.id}
                                    optionGroups={p.optionGroups}
                                    selectedForProduct={selectedOptions[p.id]}
                                    onToggleOption={onToggleOption}
                                />
                            </td>

                            <td className="px-3 py-2 text-right text-sm text-slate-800 dark:text-slate-100">
                                ${p.price.toFixed(2)}
                            </td>

                            <td className="px-3 py-2 text-right">
                                <input
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={quantities[p.id] ?? ""}
                                    onChange={(e) => onQuantityChange(p.id, e.target.value)}
                                    className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400"
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
