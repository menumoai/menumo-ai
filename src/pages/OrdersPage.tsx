// src/pages/OrdersPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DEMO_ACCOUNT_ID as ACCOUNT_ID } from "../config";
import { listOrders } from "../services/order";
import type { Order } from "../models/order";

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    try {
      const ords = await listOrders(ACCOUNT_ID);
      setOrders(ords);
      setStatus("Orders loaded ✅");
    } catch (err) {
      console.error(err);
      setStatus("Error loading orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  return (
    <div style={{ padding: "1.5rem", maxWidth: 900, margin: "0 auto" }}>
      <h1>Orders</h1>
      <p style={{ color: "#555" }}>
        Viewing orders for <code>{ACCOUNT_ID}</code>
      </p>

      <div style={{ margin: "0.75rem 0 1rem" }}>
        <Link to="/orders/new">
          <button>Create New Order</button>
        </Link>
      </div>

      {loading && orders.length === 0 ? (
        <p>Loading...</p>
      ) : orders.length === 0 ? (
        <p style={{ color: "#777" }}>No orders yet.</p>
      ) : (
        <ul>
          {orders.map((o) => (
            <li key={o.id}>
              <strong>{o.id}</strong> — {o.status}, total $
              {o.totalAmount.toFixed(2)} via {o.channel}
            </li>
          ))}
        </ul>
      )}

      <p style={{ marginTop: "1rem", color: "#555" }}>
        <strong>Status:</strong> {status}
      </p>
    </div>
  );
}

