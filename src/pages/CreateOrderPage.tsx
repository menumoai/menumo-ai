// src/pages/CreateOrderPage.tsx
import { useEffect, useState, type FormEvent } from "react";
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
                channel: "in_person", // staff-created
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
        return (
            <p className="px-6 py-6 text-sm text-slate-600 dark:text-slate-300">
                Loading account...
            </p>
        );
    }
    if (!accountId) {
        return (
            <p className="px-6 py-6 text-sm text-slate-600 dark:text-slate-300">
                No account.
            </p>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-6">
            <div className="mb-4">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                    Create Order
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    For account <code className="font-mono">{accountId}</code>
                </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {loading && products.length === 0 ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Loading products...
                    </p>
                ) : products.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        No products yet. Go to the{" "}
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            Menu
                        </span>{" "}
                        page and add some first.
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800">
                            <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-800">
                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Product
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Price
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Qty
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                                    {products.map((p) => (
                                        <tr key={p.id}>
                                            <td className="px-3 py-2 align-top text-sm text-slate-800 dark:text-slate-100">
                                                <div className="font-medium">{p.name}</div>
                                                {p.category && (
                                                    <div className="mt-0.5 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                        {p.category}
                                                    </div>
                                                )}
                                                {p.description && (
                                                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                        {p.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right text-sm text-slate-800 dark:text-slate-100">
                                                ${p.price.toFixed(2)}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step={1}
                                                    className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-indigo-400"
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
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Creating..." : "Create Order"}
                        </button>
                    </form>
                )}

                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">Status:</span> {status}
                </p>
            </div>
        </div>
    );
}
