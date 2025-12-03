// src/pages/CustomerOrderFormPage.tsx
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";

import { listProducts } from "../services/product";
import { createCustomer } from "../services/customer";
import { createOrderWithLineItems } from "../services/order";
import type { Product } from "../models/product";

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

    // render remains the same, just uses handleSubmit
    // and the updated state
    return (
        // ... your existing JSX ...
        // (no more DEMO_ACCOUNT_ID usage)
        <div>...</div>
    );
}
