import type { Product } from "../models/product";
import type { QuantityMap, SelectedOptionsMap } from "./orderTypes";

export function buildInitialOrderState(products: Product[]) {
    const quantities: QuantityMap = {};
    const selectedOptions: SelectedOptionsMap = {};

    for (const p of products) {
        quantities[p.id] = "";

        if (p.optionGroups?.length) {
            selectedOptions[p.id] = {};
            for (const g of p.optionGroups) selectedOptions[p.id][g.id] = [];
        }
    }

    return { quantities, selectedOptions };
}
