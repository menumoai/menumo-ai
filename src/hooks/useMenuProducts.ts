import { useCallback, useEffect, useState } from "react";
import type { Product } from "../models/product";
import { listProducts } from "../services/product";
import { buildInitialOrderState } from "../orders/orderInit";
import type { QuantityMap, SelectedOptionsMap } from "../orders/orderTypes";

export function useMenuProducts(accountId: string | null) {
    const [products, setProducts] = useState<Product[]>([]);
    const [quantities, setQuantities] = useState<QuantityMap>({});
    const [selectedOptions, setSelectedOptions] = useState<SelectedOptionsMap>({});
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    const applyInitialState = useCallback((prods: Product[]) => {
        setProducts(prods);

        const init = buildInitialOrderState(prods);
        setQuantities(init.quantities);
        setSelectedOptions(init.selectedOptions);
    }, []);

    const load = useCallback(async () => {
        if (!accountId) return;

        setLoading(true);
        try {
            const prods = await listProducts(accountId);
            applyInitialState(prods);
            setStatus("Menu loaded ✅");
        } catch (err) {
            console.error(err);
            setStatus("Error loading menu");
        } finally {
            setLoading(false);
        }
    }, [accountId, applyInitialState]);

    useEffect(() => {
        void load();
    }, [load]);

    const resetOrderState = useCallback(() => {
        const init = buildInitialOrderState(products);
        setQuantities(init.quantities);
        setSelectedOptions(init.selectedOptions);
    }, [products]);

    return {
        products,
        setProducts,
        quantities,
        setQuantities,
        selectedOptions,
        setSelectedOptions,
        loading,
        status,
        setStatus,
        resetOrderState,
        applyInitialState,
        reload: load,
    };
}
