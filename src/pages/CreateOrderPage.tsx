// src/pages/CreateOrderPage.tsx
import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { DEMO_ACCOUNT_ID as ACCOUNT_ID } from "../config";
import { listProducts } from "../services/product";
import { createOrderWithLineItems } from "../services/order";
import type { Product } from "../models/product";

interface QuantityMap {
  [productId: string]: string; // store as string for easy binding to <input>
}

export function CreateOrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<QuantityMap>({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // load products on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const prods = await listProducts(ACCOUNT_ID);
        setProducts(prods);

        // init quantities to "" (empty) for each product
        const initial: QuantityMap = {};
        for (const p of prods) {
          initial[p.id] = "";
        }
        setQuantities(initial);

        setStatus("Products loaded ✅");
      } catch (err) {
        console.error("Error loading products", err);
        setStatus("Error loading products");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const handleQuantityChange = (productId: string, value: string) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("");
    setLoading(true);

    try {
      // Build line items from non-zero quantities
      const items = products
        .map((p) => {
          const raw = quantities[p.id];
          const qty = raw ? parseInt(raw, 10) : 0;
          if (!qty || Number.isNaN(qty) || qty <= 0) return null;

          return {
            productId: p.id,
            quantity: qty,
            unitPrice: p.price,
          };
        })
        .filter((x) => x !== null) as {
        productId: string;
        quantity: number;
        unitPrice: number;
      }[];

      if (items.length === 0) {
        setStatus("Select at least one product with quantity > 0");
        setLoading(false);
        return;
      }

      const orderId = await createOrderWithLineItems({
        accountId: ACCOUNT_ID,
        items,
      });

      setStatus(`Order created ✅ (id: ${orderId})`);
      // Optionally navigate to orders list after a short delay
      setTimeout(() => {
        navigate("/orders");
      }, 800);
    } catch (err) {
      console.error("Error creating order", err);
      setStatus("Error creating order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: 900, margin: "0 auto" }}>
      <h1>Create Order</h1>
      <p style={{ color: "#555" }}>
        For account <code>{ACCOUNT_ID}</code>
      </p>

      {loading && products.length === 0 ? (
        <p>Loading products...</p>
      ) : products.length === 0 ? (
        <p style={{ color: "#777" }}>
          No products yet. Go to the <strong>Menu</strong> page and add some first.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "1rem",
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: "0.5rem" }}>Product</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #eee", padding: "0.5rem" }}>Price</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #eee", padding: "0.5rem" }}>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: "0.5rem", borderBottom: "1px solid #f5f5f5" }}>
                    <strong>{p.name}</strong>
                    {p.category && (
                      <span style={{ marginLeft: 4, fontSize: "0.85rem", color: "#666" }}>
                        [{p.category}]
                      </span>
                    )}
                    {p.description && (
                      <div style={{ fontSize: "0.85rem", color: "#666" }}>
                        {p.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "0.5rem", textAlign: "right", borderBottom: "1px solid #f5f5f5" }}>
                    ${p.price.toFixed(2)}
                  </td>
                  <td style={{ padding: "0.5rem", textAlign: "right", borderBottom: "1px solid #f5f5f5" }}>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      style={{ width: "4rem" }}
                      value={quantities[p.id] ?? ""}
                      onChange={(e) =>
                        handleQuantityChange(p.id, e.target.value)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Order"}
          </button>
        </form>
      )}

      <p style={{ marginTop: "1rem", color: "#555" }}>
        <strong>Status:</strong> {status}
      </p>
    </div>
  );
}

