// src/components/orders/ProductOptionsSelector.tsx
import type { FC } from "react";
import type { Product } from "../../models/product";

type OptionGroups = Product["optionGroups"];

interface ProductOptionsSelectorProps {
    productId: string;
    optionGroups: OptionGroups;
    selectedForProduct: { [groupId: string]: string[] } | undefined;
    onToggleOption: (
        productId: string,
        groupId: string,
        optionId: string,
        multiSelect: boolean
    ) => void;
}

/**
 * Renders all option groups + options for a product
 * (size, toppings, sides, etc.).
 */
export const ProductOptionsSelector: FC<ProductOptionsSelectorProps> = ({
    productId,
    optionGroups,
    selectedForProduct,
    onToggleOption,
}) => {
    if (!optionGroups || optionGroups.length === 0) return null;

    return (
        <div className="mt-2 space-y-2">
            {optionGroups.map((group) => {
                const multi = !!group.multiSelect;
                const selectedForGroup = selectedForProduct?.[group.id] ?? [];

                return (
                    <div
                        key={group.id}
                        className="border-t border-slate-100 pt-2 dark:border-slate-800"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                {group.name}
                                {group.required && (
                                    <span className="ml-1 text-[10px] font-normal uppercase text-red-500">
                                        required
                                    </span>
                                )}
                            </span>
                            {group.description && (
                                <span className="ml-2 text-[10px] text-slate-500 dark:text-slate-400">
                                    {group.description}
                                </span>
                            )}
                        </div>

                        <div className="mt-1 flex flex-wrap gap-2">
                            {group.options.map((opt) => {
                                const checked = selectedForGroup.includes(opt.id);
                                const inputType = multi ? "checkbox" : "radio";

                                return (
                                    <label
                                        key={opt.id}
                                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${checked
                                                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/40 dark:text-indigo-200"
                                                : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                            }`}
                                    >
                                        <input
                                            type={inputType}
                                            className="h-3 w-3"
                                            name={`${productId}-${group.id}`}
                                            checked={checked}
                                            onChange={() =>
                                                onToggleOption(
                                                    productId,
                                                    group.id,
                                                    opt.id,
                                                    multi
                                                )
                                            }
                                        />
                                        <span>{opt.label}</span>
                                        {opt.priceDelta && opt.priceDelta !== 0 && (
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                {opt.priceDelta > 0 ? "+" : "-"}$
                                                {Math.abs(opt.priceDelta).toFixed(2)}
                                            </span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
