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
        return (
            <p className="px-6 py-6 text-sm text-slate-600 dark:text-slate-300">
                Loading account...
            </p>
        );
    }
    if (!accountId) {
        return (
            <p className="px-6 py-6 text-sm text-slate-600 dark:text-slate-300">
                No account selected.
            </p>
        );
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
        <div className="mx-auto max-w-5xl px-4 py-6">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    Menu
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Managing products for{" "}
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                        {account?.name ?? accountId}
                    </span>
                </p>
            </header>

            {/* Add Product */}
            <section className="mb-8">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                        Add Product
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Quickly add items to your truck’s menu. You can edit or extend this later.
                    </p>

                    <form
                        onSubmit={handleCreateProduct}
                        className="mt-4 grid gap-3 max-w-md"
                    >
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                                Name
                            </label>
                            <input
                                type="text"
                                placeholder="Name (e.g., Birria Taco)"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-indigo-500/0 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                                Price
                            </label>
                            <input
                                type="text"
                                placeholder="Price (e.g., 5.50)"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-indigo-500/0 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                                Category
                            </label>
                            <input
                                type="text"
                                placeholder="Category (optional)"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-indigo-500/0 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                                Description
                            </label>
                            <textarea
                                placeholder="Description (optional)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-indigo-500/0 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-1 inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                        >
                            {loading ? "Saving..." : "Create Product"}
                        </button>
                    </form>
                </div>
            </section>

            {/* Products list */}
            <section>
                <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                        Products ({products.length})
                    </h2>
                </div>

                {loading && products.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                        Loading...
                    </p>
                ) : products.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                        No products yet. Add your first item above.
                    </p>
                ) : (
                    <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                        {products.map((p) => (
                            <li
                                key={p.id}
                                className="flex items-start justify-between gap-4 px-4 py-3"
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <strong className="text-sm font-medium text-slate-900 dark:text-slate-50">
                                            {p.name}
                                        </strong>
                                        {p.category && (
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                                                {p.category}
                                            </span>
                                        )}
                                    </div>
                                    {p.description && (
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {p.description}
                                        </p>
                                    )}
                                </div>
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                    ${p.price.toFixed(2)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Status:</span> {status || "—"}
            </p>
        </div>
    );
}
