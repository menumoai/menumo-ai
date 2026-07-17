// src/hooks/useInventory.ts
import { useCallback, useEffect, useState } from "react";
import type { Product } from "../models/product";
import type { InventoryEvent } from "../models/inventoryEventType";
import type { InventoryBatch } from "../models/inventoryBatch";
import { listProducts } from "../services/product";
import { listInventoryEvents } from "../services/inventoryEvent";
import { listActiveBatches } from "../services/inventoryBatch";

interface UseInventoryResult {
    products: Product[];
    events: InventoryEvent[];
    batches: InventoryBatch[];
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

/**
 * Bridges the product + inventoryEvent + inventoryBatch services into React for
 * the inventory page: loads the current product catalog (which carries
 * denormalized stock), the recent movement ledger, and the active dated batches
 * (for expiry risk), and exposes a `reload` for after a write.
 */
export function useInventory(
    accountId: string | null,
    eventLimit = 100
): UseInventoryResult {
    const [products, setProducts] = useState<Product[]>([]);
    const [events, setEvents] = useState<InventoryEvent[]>([]);
    const [batches, setBatches] = useState<InventoryBatch[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        if (!accountId) {
            setProducts([]);
            setEvents([]);
            setBatches([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [nextProducts, nextEvents, nextBatches] = await Promise.all([
                listProducts(accountId),
                listInventoryEvents(accountId, { limit: eventLimit }),
                listActiveBatches(accountId),
            ]);
            setProducts(nextProducts);
            setEvents(nextEvents);
            setBatches(nextBatches);
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

    return { products, events, batches, loading, error, reload };
}
