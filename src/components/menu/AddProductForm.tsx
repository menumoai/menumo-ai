// src/components/menu/AddProductForm.tsx
import React from "react";

export type AddProductFormValues = {
    name: string;
    price: string;
    category: string;
    description: string;
};

export function AddProductForm(props: {
    values: AddProductFormValues;
    onChange: (next: AddProductFormValues) => void;
    onSubmit: React.FormEventHandler<HTMLFormElement>;
    loading: boolean;
}) {
    const { values, onChange, onSubmit, loading } = props;

    return (
        <section className="mb-8">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    Add Product
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Quickly add items to your truck’s menu. You can edit or extend this later.
                </p>

                <form onSubmit={onSubmit} className="mt-4 grid max-w-md gap-3">
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                            Name
                        </label>
                        <input
                            type="text"
                            placeholder="Name (e.g., Birria Taco)"
                            value={values.name}
                            onChange={(e) => onChange({ ...values, name: e.target.value })}
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
                            value={values.price}
                            onChange={(e) => onChange({ ...values, price: e.target.value })}
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
                            value={values.category}
                            onChange={(e) => onChange({ ...values, category: e.target.value })}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-indigo-500/0 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                            Description
                        </label>
                        <textarea
                            placeholder="Description (optional)"
                            value={values.description}
                            onChange={(e) => onChange({ ...values, description: e.target.value })}
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
    );
}
