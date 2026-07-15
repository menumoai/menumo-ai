// src/hooks/useInventory.ts
import { useCallback, useEffect, useState } from "react";
import type { Product } from "../models/product";
import type { InventoryEvent } from "../models/inventoryEventType";
import { listProducts } from "../services/product";
import { listInventoryEvents } from "../services/inventoryEvent";

interface UseInventoryResult {
    products: Product[];
    events: InventoryEvent[];
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

/**
 * Bridges the product + inventoryEvent services into React for the inventory
 * page: loads the current product catalog (which carries denormalized stock)
 * and the recent movement ledger, and exposes a `reload` for after a write.
 */
export function useInventory(
    accountId: string | null,
    eventLimit = 100
): UseInventoryResult {
    const [products, setProducts] = useState<Product[]>([]);
    const [events, setEvents] = useState<InventoryEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        if (!accountId) {
            setProducts([]);
            setEvents([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [nextProducts, nextEvents] = await Promise.all([
                listProducts(accountId),
                listInventoryEvents(accountId, { limit: eventLimit }),
            ]);
            setProducts(nextProducts);
            setEvents(nextEvents);
        } catch (caught) {
            console.error("Failed to load inventory", caught);
            setError("Failed to load inventory data.");
        } finally {
            setLoading(false);
        }
    }, [accountId, eventLimit]);

    useEffect(() => {
        void reload();
    }, [reload]);

    return { products, events, loading, error, reload };
}
