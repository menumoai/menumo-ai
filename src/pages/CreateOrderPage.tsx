// src/pages/CreateOrderPage.tsx
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { listProducts } from "../services/product";
import { createOrderWithLineItems } from "../services/order";
import type { Product } from "../models/product";
import { useAccount } from "../account/AccountContext";

interface QuantityMap {
    [productId: string]: string;
}

export function CreateOrderPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [quantities, setQuantities] = useState<QuantityMap>({});
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { accountId, loading: accountLoading } = useAccount();

    useEffect(() => {
        if (!accountId) return;

        const load = async () => {
            setLoading(true);
            try {
                const prods = await listProducts(accountId);
                setProducts(prods);

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
    }, [accountId]);

    const handleQuantityChange = (productId: string, value: string) => {
        setQuantities((prev) => ({
            ...prev,
            [productId]: value,
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!accountId) return;

        setStatus("");
        setLoading(true);

        try {
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
                accountId,
                items,
            });

            setStatus(`Order created ✅ (id: ${orderId})`);
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

    if (accountLoading) {
        return <p style={{ padding: "1.5rem" }}>Loading account...</p>;
    }
    if (!accountId) {
        return <p style={{ padding: "1.5rem" }}>No account.</p>;
    }

    return (
        <div style={{ padding: "1.5rem", maxWidth: 900, margin: "0 auto" }}>
            <h1>Create Order</h1>
            <p style={{ color: "#555" }}>
                For account <code>{accountId}</code>
            </p>

            {loading && products.length === 0 ? (
                <p>Loading products...</p>
            ) : products.length === 0 ? (
                <p style={{ color: "#777" }}>
                    No products yet. Go to the <strong>Menu</strong> page and add some first.
                </p>
            ) : (
                <form onSubmit={handleSubmit}>
                    {/* table unchanged, using quantities[...] */}
                    {/* ... */}
                </form>
            )}

            <p style={{ marginTop: "1rem", color: "#555" }}>
                <strong>Status:</strong> {status}
            </p>
        </div>
    );
}
