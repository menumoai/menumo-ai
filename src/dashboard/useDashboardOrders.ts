import { useEffect, useState } from "react";
import type { Order } from "../models/order";
import { listOrders } from "../services/order";

export function useDashboardOrders(accountId: string | null) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    useEffect(() => {
        if (!accountId) return;

        const load = async () => {
            setLoading(true);
            setStatus("Loading orders...");
            try {
                const ords = await listOrders(accountId);
                setOrders(ords);
                setStatus(`Loaded ${ords.length} orders ✅`);
            } catch (err) {
                console.error("Error loading orders for dashboard", err);
                setStatus("Error loading orders");
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [accountId]);

    return { orders, loading, status, setStatus };
}
