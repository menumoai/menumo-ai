// src/pages/MenuPage.tsx
import { useMemo, useState, type FormEvent } from "react";
import {
    UtensilsCrossed,
    Plus,
    Tags,
    DollarSign,
    Package,
    Search,
} from "lucide-react";

import { useAccount } from "../account/AccountContext";
import { createProduct } from "../services/product";
import { useMenuProducts } from "../hooks/useMenuProducts";

import {
    AddProductForm,
    type AddProductFormValues,
} from "../components/menu/AddProductForm";
import { ProductList } from "../components/menu/ProductList";

const emptyForm: AddProductFormValues = {
    name: "",
    price: "",
    category: "",
    description: "",
};

function formatMoney(value: number) {
    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    });
}

export function MenuPage() {
    const { accountId, loading: accountLoading, account } = useAccount();

    const { products, loading, status, setStatus, reload } = useMenuProducts(
        accountId ?? null
    );

    const [saving, setSaving] = useState(false);
    const [formValues, setFormValues] = useState<AddProductFormValues>(emptyForm);
    const [showAddForm, setShowAddForm] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    const stats = useMemo(() => {
        const totalItems = products.length;
        const categories = new Set(
            products.map((p) => p.category).filter(Boolean)
        ).size;

        const averagePrice =
            products.length > 0
                ? products.reduce((sum, p) => sum + (p.price ?? 0), 0) / products.length
                : 0;

        const activeItems = products.filter((p: any) => p.isActive !== false).length;

        return {
            totalItems,
            categories,
            averagePrice,
            activeItems,
        };
    }, [products]);

    const categories = useMemo(() => {
        const set = new Set(
            products.map((p) => p.category).filter(Boolean)
        );

        return ["all", ...Array.from(set)];
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch =
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory =
                selectedCategory === "all" || p.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [products, searchQuery, selectedCategory]);

    if (accountLoading) {
        return (
            <p className="px-6 py-6 text-sm text-slate-600">
                Loading account...
            </p>
        );
    }

    if (!accountId) {
        return (
            <p className="px-6 py-6 text-sm text-slate-600">
                No account selected.
            </p>
        );
    }

    const handleCreateProduct = async (values: AddProductFormValues) => {
        if (!values.name.trim() || !values.price.trim()) {
            setStatus("Name and price are required");
            return;
        }

        const priceNumber = parseFloat(values.price);
        if (Number.isNaN(priceNumber)) {
            setStatus("Price must be a number");
            return;
        }

        setSaving(true);
        setStatus("");

        try {
            await createProduct({
                accountId,
                name: values.name.trim(),
                price: priceNumber,
                category: values.category.trim() || undefined,
                description: values.description.trim() || undefined,
                menuType: "food",
                stockUnit: "each",
                isActive: true,
            });

            setFormValues(emptyForm);
            setStatus("Created product ✅");
            setShowAddForm(false);
            await reload();
        } catch (err) {
            console.error(err);
            setStatus("Error creating product");
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        void handleCreateProduct(formValues);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-700">
                                <UtensilsCrossed className="h-5 w-5 text-white" />
                            </div>

                            <h1
                                className="text-3xl font-bold text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                Menu
                            </h1>
                        </div>

                        <p className="text-gray-600">
                            Manage products for{" "}
                            <span className="font-medium text-gray-900">
                                {account?.name ?? accountId}
                            </span>
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowAddForm((prev) => !prev)}
                        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#D94C3D] to-[#E67E50] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:from-[#C43D2E] hover:to-[#D96D3F]"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        {showAddForm ? "Hide Add Product" : "Add Menu Item"}
                    </button>
                </div>

                {/* Hero Banner */}
                <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 p-6 text-white shadow-lg">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                            <UtensilsCrossed className="h-6 w-6" />
                        </div>

                        <div className="flex-1">
                            <h3 className="mb-2 text-lg font-semibold">
                                Menu Management Snapshot
                            </h3>
                            <p className="mb-4 text-teal-50">
                                You currently have {stats.totalItems} menu items across{" "}
                                {stats.categories || 0} categories, with an average listed price of{" "}
                                {formatMoney(stats.averagePrice)}.
                            </p>

                            <div className="flex flex-wrap gap-2">
                                <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                                    <Package className="mr-1 inline h-4 w-4" />
                                    {stats.totalItems} Items
                                </span>
                                <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                                    <Tags className="mr-1 inline h-4 w-4" />
                                    {stats.categories} Categories
                                </span>
                                <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                                    <DollarSign className="mr-1 inline h-4 w-4" />
                                    Avg {formatMoney(stats.averagePrice)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total Items</span>
                            <UtensilsCrossed className="h-4 w-4 text-teal-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.totalItems}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            Products on your menu
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Categories</span>
                            <Tags className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.categories}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            Unique menu groupings
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Avg Price</span>
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {formatMoney(stats.averagePrice)}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            Across all menu items
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Active Items</span>
                            <Package className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.activeItems}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            Currently available
                        </div>
                    </div>
                </div>

                {/* Add Product Panel */}
                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <button
                        type="button"
                        onClick={() => setShowAddForm((prev) => !prev)}
                        className="flex w-full items-center justify-between border-b border-gray-100 px-5 py-4 text-left"
                    >
                        <div>
                            <h2
                                className="text-lg font-semibold text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                Add Menu Item
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Create a new product and publish it to your truck menu
                            </p>
                        </div>

                        <span
                            className={`text-sm text-gray-500 transition-transform ${showAddForm ? "rotate-90" : ""
                                }`}
                        >
                            ▸
                        </span>
                    </button>

                    {showAddForm && (
                        <div className="px-5 py-5">
                            <AddProductForm
                                values={formValues}
                                onChange={setFormValues}
                                onSubmit={handleSubmit}
                                loading={saving}
                            />
                        </div>
                    )}
                </section>

                {/* Product List */}
                <section className="space-y-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2
                                className="text-xl font-semibold text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                Menu Items
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Review and manage your current menu catalog
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search menu items..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat as string)}
                                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${selectedCategory === cat
                                                ? "bg-teal-600 text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                    >
                                        {cat === "all" ? "All Items" : cat}
                                    </button>
                                ))}
                            </div>                        </div>
                    </div>

                    <ProductList products={filteredProducts} loading={loading} />
                </section>

                <p className="text-xs text-gray-500">
                    <span className="font-semibold">Status:</span> {status || "—"}
                </p>
            </div>
        </div>
    );
}
