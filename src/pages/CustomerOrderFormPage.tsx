// src/pages/CustomerOrderFormPage.tsx

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";

import { listProducts } from "../services/product";
import { createCustomer } from "../services/customer";
import { createOrderWithLineItems } from "../services/order";
import type { Product } from "../models/product";
import { useAccount } from "../account/AccountContext";

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
    const urlAccountId = searchParams.get("account");

    // 🔗 use AccountContext so owners/staff can preview their own customer form
    const { accountId: contextAccountId, loading: accountLoading } = useAccount();

    // 1) Prefer URL param, 2) fall back to context accountId, 3) else null
    const accountId = urlAccountId ?? contextAccountId ?? null;

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

    // If we're still resolving the logged-in account and there's no URL override,
    // give it a second instead of instantly erroring.
    if (!urlAccountId && accountLoading) {
        return (
            <div className="mx-auto max-w-xl px-4 py-8">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    Place an Order
                </h1>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    Loading food truck information…
                </p>
            </div>
        );
    }

    if (!accountId) {
        // Truly no way to know which truck this order is for
        return (
            <div className="mx-auto max-w-xl px-4 py-8">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    Place an Order
                </h1>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    This order page needs to be tied to a specific food truck account.
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Please open this page using the link provided by the food truck, or
                    log in as the truck owner to preview your order form.
                </p>
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
                channel: "web_form",
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
        <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                    Place Your Order
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Choose your items and enter your contact info so we can confirm your order.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
                {/* Customer info */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Your details
                    </h2>
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                Name (optional)
                            </label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400"
                                placeholder="Your name"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                Phone (optional)
                            </label>
                            <input
                                type="tel"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400"
                                placeholder="555-123-4567"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Your details help us contact you about your order. You can also leave this
                        blank if you’re ordering in person.
                    </p>
                </section>

                {/* Menu / items */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Menu
                    </h2>

                    {loading && products.length === 0 ? (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Loading menu...
                        </p>
                    ) : products.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            No items are available right now.
                        </p>
                    ) : (
                        <div className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800">
                            <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-800">
                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Item
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
                                                    value={quantities[p.id] ?? ""}
                                                    onChange={(e) =>
                                                        handleQuantityChange(p.id, e.target.value)
                                                    }
                                                    className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* Submit + status */}
                <div className="flex flex-col items-start gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <button
                        type="submit"
                        disabled={loading || products.length === 0}
                        className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Placing order..." : "Place Order"}
                    </button>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold">Status:</span> {status}
                    </p>
                </div>
            </form>
        </div>
    );
}
