// src/pages/CustomerOrderFormPage.tsx
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { listProducts } from "../services/product";
import { createCustomer } from "../services/customer";
import { createOrderWithLineItems } from "../services/order";
import type { Product } from "../models/product";
import { useSearchParams } from "react-router-dom";

interface QuantityMap {
    [productId: string]: string;
}

export function CustomerOrderFormPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [quantities, setQuantities] = useState<QuantityMap>({});
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const [searchParams] = useSearchParams();
    const accountId = searchParams.get("account");

    useEffect(() => {
        if (!accountId) return;

        const load = async () => {
            setLoading(true);
            try {
                const prods = await listProducts(accountId);
                setProducts(prods);

                const qInit: QuantityMap = {};
                for (const p of prods) {
                    qInit[p.id] = "";
                }
                setQuantities(qInit);

                setStatus("Menu loaded ✅");
            } catch (err) {
                console.error(err);
                setStatus("Error loading menu");
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [accountId]);

    if (!accountId) {
        return (
            <div style={{ padding: "1.5rem", maxWidth: 600, margin: "0 auto" }}>
                <h1>Place an Order</h1>
                <p style={{ color: "#b91c1c" }}>
                    No account specified. This page should be opened with a link like:
                </p>
                <code>/order-form?account=YOUR_ACCOUNT_ID</code>
            </div>
        );
    }

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
                setStatus("Please select at least one item.");
                setLoading(false);
                return;
            }

            let customerId: string | undefined;
            if (customerName || customerPhone) {
                customerId = await createCustomer({
                    accountId,
                    name: customerName || undefined,
                    phone: customerPhone || undefined,
                    marketingOptIn: false,
                });
            }

            const orderId = await createOrderWithLineItems({
                accountId,
                customerId,
                items,
            });

            setStatus(`Thank you! Your order was placed. (id: ${orderId})`);

            const resetQuantities: QuantityMap = {};
            for (const p of products) {
                resetQuantities[p.id] = "";
            }
            setQuantities(resetQuantities);
            setCustomerName("");
            setCustomerPhone("");
        } catch (err) {
            console.error(err);
            setStatus("Error placing order. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "1.5rem", maxWidth: 900, margin: "0 auto" }}>
            <h1>Place an Order</h1>
            <p style={{ color: "#555", marginBottom: "1rem" }}>
                Demo customer-facing form for <strong>{accountId}</strong>
            </p>

            {loading && products.length === 0 ? (
                <p>Loading menu...</p>
            ) : products.length === 0 ? (
                <p style={{ color: "#777" }}>
                    Menu is empty. Staff needs to add products in the Menu screen.
                </p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <section style={{ marginBottom: "1.5rem" }}>
                        <h2>Your Info</h2>
                        <div
                            style={{
                                display: "grid",
                                gap: "0.5rem",
                                maxWidth: 400,
                                marginTop: "0.5rem",
                            }}
                        >
                            <input
                                type="text"
                                placeholder="Name (optional)"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                            />
                            <input
                                type="tel"
                                placeholder="Phone (optional)"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                            />
                        </div>
                    </section>

                    <section style={{ marginBottom: "1.5rem" }}>
                        <h2>Menu</h2>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                marginTop: "0.5rem",
                            }}
                        >
                            <thead>
                                <tr>
                                    <th
                                        style={{
                                            textAlign: "left",
                                            borderBottom: "1px solid #eee",
                                            padding: "0.5rem",
                                        }}
                                    >
                                        Item
                                    </th>
                                    <th
                                        style={{
                                            textAlign: "right",
                                            borderBottom: "1px solid #eee",
                                            padding: "0.5rem",
                                        }}
                                    >
                                        Price
                                    </th>
                                    <th
                                        style={{
                                            textAlign: "right",
                                            borderBottom: "1px solid #eee",
                                            padding: "0.5rem",
                                        }}
                                    >
                                        Qty
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((p) => (
                                    <tr key={p.id}>
                                        <td
                                            style={{
                                                padding: "0.5rem",
                                                borderBottom: "1px solid #f5f5f5",
                                            }}
                                        >
                                            <strong>{p.name}</strong>
                                            {p.description && (
                                                <div
                                                    style={{
                                                        fontSize: "0.85rem",
                                                        color: "#666",
                                                        marginTop: 2,
                                                    }}
                                                >
                                                    {p.description}
                                                </div>
                                            )}
                                        </td>
                                        <td
                                            style={{
                                                padding: "0.5rem",
                                                textAlign: "right",
                                                borderBottom: "1px solid #f5f5f5",
                                            }}
                                        >
                                            ${p.price.toFixed(2)}
                                        </td>
                                        <td
                                            style={{
                                                padding: "0.5rem",
                                                textAlign: "right",
                                                borderBottom: "1px solid #f5f5f5",
                                            }}
                                        >
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
                    </section>

                    <button type="submit" disabled={loading}>
                        {loading ? "Placing order..." : "Place Order"}
                    </button>
                </form>
            )}

            <p style={{ marginTop: "1rem", color: "#555" }}>
                <strong>Status:</strong> {status}
            </p>
        </div>
    );
}
