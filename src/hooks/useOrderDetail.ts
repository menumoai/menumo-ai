import { useCallback, useEffect, useState } from "react";
import type { Order, OrderLineItem } from "../models/order";
import { getOrder, listOrderLineItems, updateOrderStatus } from "../services/order";

export function useOrderDetail(accountId: string | null, orderId: string | null) {
    const [order, setOrder] = useState<Order | null>(null);
    const [items, setItems] = useState<OrderLineItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    const reload = useCallback(async () => {
        if (!accountId || !orderId) return;

        setLoading(true);
        try {
            const [o, li] = await Promise.all([
                getOrder(accountId, orderId),
                listOrderLineItems(accountId, orderId),
            ]);

            if (!o) {
                setOrder(null);
                setItems([]);
                setStatusMessage("Order not found");
                return;
            }

            setOrder(o);
            setItems(li);
            setStatusMessage("Order loaded ✅");
        } catch (err) {
            console.error(err);
            setStatusMessage("Failed to load order");
        } finally {
            setLoading(false);
        }
    }, [accountId, orderId]);

    useEffect(() => {
        void reload();
    }, [reload]);

    const setOrderStatus = useCallback(
        async (newStatus: Order["status"]) => {
            if (!accountId || !orderId) return;

            setLoading(true);
            setStatusMessage(`Updating status to ${newStatus}...`);
            try {
                await updateOrderStatus(accountId, orderId, newStatus);
                setStatusMessage(`Status updated to ${newStatus} ✅`);
                await reload();
            } catch (err) {
                console.error(err);
                setStatusMessage("Failed to update status");
            } finally {
                setLoading(false);
            }
        },
        [accountId, orderId, reload]
    );

    return { order, items, loading, statusMessage, reload, setOrderStatus, setStatusMessage };
}
