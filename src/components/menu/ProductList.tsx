// src/components/menu/ProductList.tsx
import {
    DollarSign,
    Tags,
    UtensilsCrossed,
    Eye,
    EyeOff,
    Edit2,
} from "lucide-react";
import type { Product } from "../../models/product";

function formatMoney(value: number) {
    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    });
}

export function ProductList(props: {
    products: Product[];
    loading: boolean;
}) {
    const { products, loading } = props;

    if (loading && products.length === 0) {
        return (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">Loading...</p>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">
                    No products match this filter.
                </p>
            </div>
        );
    }

    return (
        <section>
            <div className="grid gap-4">
                {products.map((p: any) => {
                    const isActive = p.isActive !== false;

                    return (
                        <div
                            key={p.id}
                            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                        >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                {/* Left */}
                                <div className="flex-1">
                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-teal-200">
                                            <UtensilsCrossed className="h-4 w-4 text-teal-700" />
                                        </div>

                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {p.name}
                                        </h3>

                                        {p.category && (
                                            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-700">
                                                {p.category}
                                            </span>
                                        )}

                                        <span
                                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${isActive
                                                    ? "bg-green-50 text-green-700"
                                                    : "bg-gray-100 text-gray-600"
                                                }`}
                                        >
                                            {isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>

                                    {p.description && (
                                        <p className="mb-3 text-sm text-gray-600">
                                            {p.description}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap gap-3">
                                        <div className="rounded-xl bg-gray-50 p-3 min-w-[140px]">
                                            <div className="mb-1 flex items-center gap-1">
                                                <DollarSign className="h-3.5 w-3.5 text-green-600" />
                                                <span className="text-xs text-gray-600">Price</span>
                                            </div>
                                            <div className="text-lg font-bold text-gray-900">
                                                {formatMoney(p.price ?? 0)}
                                            </div>
                                        </div>

                                        <div className="rounded-xl bg-gray-50 p-3 min-w-[160px]">
                                            <div className="mb-1 flex items-center gap-1">
                                                <Tags className="h-3.5 w-3.5 text-blue-600" />
                                                <span className="text-xs text-gray-600">Category</span>
                                            </div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {p.category || "Uncategorized"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right actions */}
                                <div className="flex gap-2 lg:flex-col">
                                    <button
                                        type="button"
                                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                    >
                                        <Edit2 className="mr-2 h-3.5 w-3.5" />
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                    >
                                        {isActive ? (
                                            <>
                                                <EyeOff className="mr-2 h-3.5 w-3.5" />
                                                Disable
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="mr-2 h-3.5 w-3.5" />
                                                Enable
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
