import type { Product } from "../models/product";
import type { SelectedOption } from "../models/order";
import type { QuantityMap, SelectedOptionsMap } from "./orderTypes";

export function buildOrderItems(
    products: Product[],
    quantities: QuantityMap,
    selectedOptions: SelectedOptionsMap
) {
    return products
        .map((p) => {
            const raw = quantities[p.id];
            const qty = raw ? parseInt(raw, 10) : 0;
            if (!qty || Number.isNaN(qty) || qty <= 0) return null;

            const productSelections = selectedOptions[p.id] ?? {};
            const selectedOptionsForItem: SelectedOption[] = [];

            if (p.optionGroups) {
                for (const group of p.optionGroups) {
                    const chosenIds = productSelections[group.id] ?? [];
                    for (const opt of group.options) {
                        if (chosenIds.includes(opt.id)) {
                            selectedOptionsForItem.push({
                                groupId: group.id,
                                groupName: group.name,
                                optionId: opt.id,
                                optionLabel: opt.label,
                                priceDelta: opt.priceDelta ?? 0,
                            });
                        }
                    }
                }
            }

            return {
                productId: p.id,
                quantity: qty,
                unitPrice: p.price,
                selectedOptions: selectedOptionsForItem,
            };
        })
        .filter((x) => x !== null);
}
