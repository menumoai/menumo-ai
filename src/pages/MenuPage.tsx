// src/pages/MenuPage.tsx
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { createProduct, listProducts } from "../services/product";
import type { Product } from "../models/product";
import { useAccount } from "../account/AccountContext";

export function MenuPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>("");

    const [name, setName] = useState("");
    const [price, setPrice] = useState<string>("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");

    const { accountId, loading: accountLoading, account } = useAccount();

    const loadProducts = async (acctId: string) => {
        setLoading(true);
        try {
            const prods = await listProducts(acctId);
            setProducts(prods);
            setStatus("Loaded products ✅");
        } catch (err) {
            console.error(err);
            setStatus("Error loading products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!accountId) return;
        void loadProducts(accountId);
    }, [accountId]);

    if (accountLoading) {
        return <p style={{ padding: "1.5rem" }}>Loading account...</p>;
    }
    if (!accountId) {
        return <p style={{ padding: "1.5rem" }}>No account selected.</p>;
    }

    const handleCreateProduct = async (e: FormEvent) => {
        e.preventDefault();
        if (!name || !price) {
            setStatus("Name and price are required");
            return;
        }

        try {
            setLoading(true);
            const priceNumber = parseFloat(price);
            if (Number.isNaN(priceNumber)) {
                setStatus("Price must be a number");
                setLoading(false);
                return;
            }

            await createProduct({
                accountId,
                name,
                price: priceNumber,
                category: category || undefined,
                description: description || undefined,
                menuType: "food",
                stockUnit: "each",
                isActive: true,
            });

            setName("");
            setPrice("");
            setCategory("");
            setDescription("");

            await loadProducts(accountId);
            setStatus("Created product ✅");
        } catch (err) {
            console.error(err);
            setStatus("Error creating product");
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "1.5rem", maxWidth: 900, margin: "0 auto" }}>
            <h1>Menu</h1>
            <p style={{ color: "#555" }}>
                Managing products for account{" "}
                <code>{account?.name ?? accountId}</code>
            </p>

            <section style={{ margin: "1.5rem 0" }}>
                <h2>Add Product</h2>
                <form
                    onSubmit={handleCreateProduct}
                    style={{ display: "grid", gap: "0.5rem", maxWidth: 400 }}
                >
                    <input
                        type="text"
                        placeholder="Name (e.g., Birria Taco)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Price (e.g., 5.50)"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Category (optional)"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    />
                    <textarea
                        placeholder="Description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Create Product"}
                    </button>
                </form>
            </section>

            <section>
                <h2>Products ({products.length})</h2>
                {loading && products.length === 0 ? (
                    <p>Loading...</p>
                ) : products.length === 0 ? (
                    <p style={{ color: "#777" }}>No products yet.</p>
                ) : (
                    <ul>
                        {products.map((p) => (
                            <li key={p.id}>
                                <strong>{p.name}</strong> — ${p.price.toFixed(2)}{" "}
                                {p.category && <span> [{p.category}]</span>}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <p style={{ marginTop: "1rem", color: "#555" }}>
                <strong>Status:</strong> {status}
            </p>
        </div>
    );
}
