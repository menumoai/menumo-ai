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
import type { Product } from "../models/product";
import { useAnalyticsSnapshot } from "../hooks/useAnalyticsSnapshot";
import { createProduct, updateProduct } from "../services/product";
import { useMenuProducts } from "../hooks/useMenuProducts";
import { computeMenuPerformanceMatrix } from "../analysis/menu";
import { MenuPerformanceMatrix } from "../components/analytics/MenuPerformanceMatrix";

import {
    AddProductForm,
    type AddProductFormValues,
} from "../components/menu/AddProductForm";
import { ProductList } from "../components/menu/ProductList";

const emptyForm: AddProductFormValues = {
    name: "",
    price: "",
    cost: "",
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

function toFormValues(product: Product): AddProductFormValues {
    return {
        name: product.name ?? "",
        price: String(product.price ?? ""),
        cost: product.cost != null ? String(product.cost) : "",
        category: product.category ?? "",
        description: product.description ?? "",
    };
}

export function MenuPage() {
    const { accountId, loading: accountLoading, account } = useAccount();

    const { products, loading, status, setStatus, reload } = useMenuProducts(
        accountId ?? null
    );
    const {
        snapshot: analyticsSnapshot,
        loading: analyticsLoading,
        reload: reloadAnalytics,
    } = useAnalyticsSnapshot(accountId ?? null);

    const [saving, setSaving] = useState(false);
    const [actionProductId, setActionProductId] = useState<string | null>(null);
    const [formValues, setFormValues] = useState<AddProductFormValues>(emptyForm);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProductId, setEditingProductId] = useState<string | null>(null);

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

        const activeItems = products.filter((p) => p.isActive !== false).length;

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

    const performanceMatrixData = useMemo(
        () =>
            computeMenuPerformanceMatrix(
                analyticsSnapshot.products,
                analyticsSnapshot.orders,
                analyticsSnapshot.lineItems,
            ),
        [analyticsSnapshot.lineItems, analyticsSnapshot.orders, analyticsSnapshot.products],
    );

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

    const resetEditor = () => {
        setFormValues(emptyForm);
        setEditingProductId(null);
        setShowAddForm(false);
    };

    const cancelEdit = () => {
        setFormValues(emptyForm);
        setEditingProductId(null);
    };

    const toggleFormPanel = () => {
        if (showAddForm) {
            setShowAddForm(false);
            setFormValues(emptyForm);
            return;
        }

        setEditingProductId(null);
        setFormValues(emptyForm);
        setShowAddForm(true);
    };

    const handleSaveProduct = async (values: AddProductFormValues) => {
        if (!values.name.trim() || !values.price.trim()) {
            setStatus("Name and price are required");
            return;
        }

        const priceNumber = parseFloat(values.price);
        if (Number.isNaN(priceNumber)) {
            setStatus("Price must be a number");
            return;
        }

        const costNumber =
            values.cost.trim() === "" ? undefined : parseFloat(values.cost.trim());
        if (values.cost.trim() !== "" && (costNumber == null || Number.isNaN(costNumber))) {
            setStatus("Cost must be a number");
            return;
        }

        setSaving(true);
        setStatus("");

        try {
            if (editingProductId) {
                const currentProduct = products.find((product) => product.id === editingProductId);
                if (!currentProduct) {
                    setStatus("Product not found");
                    return;
                }

                await updateProduct({
                    accountId,
                    productId: editingProductId,
                    name: values.name.trim(),
                    price: priceNumber,
                    category: values.category.trim() || undefined,
                    description: values.description.trim() || undefined,
                    cost: costNumber,
                    isActive: currentProduct.isActive,
                    menuType: currentProduct.menuType ?? "food",
                    stockUnit: currentProduct.stockUnit ?? "each",
                    currentStock: currentProduct.currentStock,
                    prepTimeSeconds: currentProduct.prepTimeSeconds,
                });
                await reload();
                await reloadAnalytics();
                setStatus("Updated product ✅");
            } else {
                await createProduct({
                    accountId,
                    name: values.name.trim(),
                    price: priceNumber,
                    category: values.category.trim() || undefined,
                    description: values.description.trim() || undefined,
                    cost: costNumber,
                    menuType: "food",
                    stockUnit: "each",
                    isActive: true,
                });
                await reload();
                await reloadAnalytics();
                setStatus("Created product ✅");
            }

            resetEditor();
        } catch (err) {
            console.error(err);
            setStatus(editingProductId ? "Error updating product" : "Error creating product");
        } finally {
            setSaving(false);
        }
    };

    const handleEditProduct = (product: Product) => {
        setEditingProductId(product.id);
        setFormValues(toFormValues(product));
        setShowAddForm(false);
        setStatus(`Editing ${product.name}`);
    };

    const handleToggleActive = async (product: Product) => {
        setActionProductId(product.id);
        setStatus("");

        try {
            await updateProduct({
                accountId,
                productId: product.id,
                name: product.name,
                price: product.price,
                category: product.category ?? undefined,
                description: product.description ?? undefined,
                isActive: product.isActive === false,
                menuType: product.menuType ?? "food",
                stockUnit: product.stockUnit ?? "each",
                currentStock: product.currentStock,
                prepTimeSeconds: product.prepTimeSeconds,
                cost: product.cost,
            });
            await reload();
            await reloadAnalytics();
            setStatus(`${product.name} ${product.isActive === false ? "enabled" : "disabled"} ✅`);
        } catch (err) {
            console.error(err);
            setStatus("Error updating product status");
        } finally {
            setActionProductId(null);
        }
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        void handleSaveProduct(formValues);
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
                        onClick={toggleFormPanel}
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
                        onClick={toggleFormPanel}
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
                                onCancel={() => {
                                    setShowAddForm(false);
                                    setFormValues(emptyForm);
                                }}
                                loading={saving}
                                mode="create"
                            />
                        </div>
                    )}
                </section>

                <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2
                                className="text-xl font-semibold text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                Menu Performance Matrix
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Popularity vs. profitability by menu item, using Firestore orders,
                                line items, and product cost data.
                            </p>
                        </div>

                        <div className="text-xs text-gray-500">
                            Requires menu items with both price and cost data.
                        </div>
                    </div>

                    {analyticsLoading && performanceMatrixData.length === 0 ? (
                        <p className="text-sm text-gray-500">Loading performance data...</p>
                    ) : performanceMatrixData.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            No matrix data yet. Add menu item costs and record some orders to map
                            items into popularity/profitability quadrants.
                        </p>
                    ) : (
                        <MenuPerformanceMatrix data={performanceMatrixData} />
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
                            </div>
                        </div>
                    </div>

                    <ProductList
                        products={filteredProducts}
                        loading={loading}
                        actionProductId={actionProductId}
                        editingProductId={editingProductId}
                        editForm={
                            <AddProductForm
                                values={formValues}
                                onChange={setFormValues}
                                onSubmit={handleSubmit}
                                onCancel={cancelEdit}
                                loading={saving}
                                mode="edit"
                            />
                        }
                        onEdit={handleEditProduct}
                        onToggleActive={handleToggleActive}
                    />
                </section>

                <p className="text-xs text-gray-500">
                    <span className="font-semibold">Status:</span> {status || "—"}
                </p>
            </div>
        </div>
    );
}
