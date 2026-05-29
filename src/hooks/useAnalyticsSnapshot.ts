import { useCallback, useEffect, useMemo, useState } from "react";
import type { AnalyticsSnapshot } from "../analysis/types";
import { listExpenses } from "../services/expense";
import { listOrders, listOrderLineItemsForOrders } from "../services/order";
import { listProducts } from "../services/product";

const EMPTY_SNAPSHOT: AnalyticsSnapshot = {
    orders: [],
    lineItems: [],
    products: [],
    expenses: [],
};

export function useAnalyticsSnapshot(accountId: string | null) {
    const [snapshot, setSnapshot] = useState<AnalyticsSnapshot>(EMPTY_SNAPSHOT);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState("");

    const reload = useCallback(async () => {
        if (!accountId) {
            return;
        }

        setLoading(true);
        setError(null);
        setStatus("Loading analytics...");

        try {
            const [orders, products, expenses] = await Promise.all([
                listOrders(accountId),
                listProducts(accountId),
                listExpenses(accountId, { limit: 500 }),
            ]);

            const lineItems = await listOrderLineItemsForOrders(
                accountId,
                orders.map((order) => order.id),
            );

            setSnapshot({ orders, lineItems, products, expenses });
            setStatus(
                `Loaded ${orders.length} orders, ${lineItems.length} line items, ${products.length} products, and ${expenses.length} expenses.`,
            );
        } catch (caught) {
            console.error("Failed to load analytics snapshot", caught);
            setError("Failed to load analytics data.");
            setStatus("Analytics load failed.");
        } finally {
            setLoading(false);
        }
    }, [accountId]);

    useEffect(() => {
        void reload();
    }, [reload]);

    const visibleSnapshot = useMemo(
        () => (accountId ? snapshot : EMPTY_SNAPSHOT),
        [accountId, snapshot],
    );

    return {
        snapshot: visibleSnapshot,
        loading,
        error,
        status,
        reload,
    };
}
