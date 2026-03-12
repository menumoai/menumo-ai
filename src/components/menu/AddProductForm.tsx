// src/components/menu/AddProductForm.tsx
import React from "react";
import { Plus } from "lucide-react";

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
        <section>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-5">
                    <h2
                        className="text-lg font-semibold text-gray-900"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                        Add Product
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Quickly add items to your truck’s menu. You can edit or extend this later.
                    </p>
                </div>

                <form onSubmit={onSubmit} className="grid max-w-2xl gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-gray-600">
                                Name
                            </label>
                            <input
                                type="text"
                                placeholder="Birria Taco"
                                value={values.name}
                                onChange={(e) => onChange({ ...values, name: e.target.value })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-gray-600">
                                Price
                            </label>
                            <input
                                type="text"
                                placeholder="5.50"
                                value={values.price}
                                onChange={(e) => onChange({ ...values, price: e.target.value })}
                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-gray-600">
                            Category
                        </label>
                        <input
                            type="text"
                            placeholder="Tacos, Burritos, Drinks..."
                            value={values.category}
                            onChange={(e) => onChange({ ...values, category: e.target.value })}
                            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-gray-600">
                            Description
                        </label>
                        <textarea
                            placeholder="Short description for customers"
                            value={values.description}
                            onChange={(e) =>
                                onChange({ ...values, description: e.target.value })
                            }
                            className="min-h-[100px] w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#5B9A8B] to-[#4A7C70] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {loading ? "Saving..." : "Create Product"}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}
