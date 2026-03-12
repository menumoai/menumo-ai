// src/pages/OrdersPage.tsx
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import {
    ClipboardList,
    Plus,
    Clock3,
    CheckCircle2,
    DollarSign,
} from "lucide-react";

import { listOrders, createOrderWithLineItems } from "../services/order";
import { listProducts } from "../services/product";

import type { Order } from "../models/order";
import type { Product } from "../models/product";
import type { SelectedOption } from "../models/order";
import { useAccount } from "../account/AccountContext";

type OrderStatus = Order["status"];

interface QuantityMap {
    [productId: string]: string;
}

interface SelectedOptionsMap {
    [productId: string]: {
        [groupId: string]: string[];
    };
}

function formatMoney(value: number) {
    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    });
}

export function OrdersPage() {
    const { accountId, loading: accountLoading } = useAccount();

    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [quantities, setQuantities] = useState<QuantityMap>({});
    const [selectedOptions, setSelectedOptions] = useState<SelectedOptionsMap>(
        {}
    );

    const [loadingOrders, setLoadingOrders] = useState(false);
    const [creatingOrder, setCreatingOrder] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
    const [todayOnly, setTodayOnly] = useState(false);

    const [showStaffForm, setShowStaffForm] = useState(false);

    const loadData = async (acctId: string) => {
        setLoadingOrders(true);
        try {
            const [ords, prods] = await Promise.all([
                listOrders(acctId),
                listProducts(acctId),
            ]);

            setOrders(ords);
            setProducts(prods);

            const initQuantities: QuantityMap = {};
            const initOptions: SelectedOptionsMap = {};

            for (const p of prods) {
                initQuantities[p.id] = "";
                if (p.optionGroups && p.optionGroups.length > 0) {
                    initOptions[p.id] = {};
                    for (const g of p.optionGroups) {
                        initOptions[p.id][g.id] = [];
                    }
                }
            }

            setQuantities(initQuantities);
            setSelectedOptions(initOptions);
            setStatusMessage("Orders + products loaded ✅");
        } catch (err) {
            console.error(err);
            setStatusMessage("Error loading orders or products");
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        if (!accountId) return;
        void loadData(accountId);
    }, [accountId]);

    const handleQuantityChange = (productId: string, value: string) => {
        setQuantities((prev) => ({
            ...prev,
            [productId]: value,
        }));
    };

    const handleToggleOption = (
        productId: string,
        groupId: string,
        optionId: string,
        multiSelect: boolean
    ) => {
        setSelectedOptions((prev) => {
            const productOpts = prev[productId] ?? {};
            const groupOpts = productOpts[groupId] ?? [];

            let nextGroupOpts: string[];
            if (multiSelect) {
                if (groupOpts.includes(optionId)) {
                    nextGroupOpts = groupOpts.filter((id) => id !== optionId);
                } else {
                    nextGroupOpts = [...groupOpts, optionId];
                }
            } else {
                nextGroupOpts = [optionId];
            }

            return {
                ...prev,
                [productId]: {
                    ...productOpts,
                    [groupId]: nextGroupOpts,
                },
            };
        });
    };

    const handleCreateOrder = async (e: FormEvent) => {
        e.preventDefault();
        if (!accountId) return;

        setStatusMessage("");
        setCreatingOrder(true);

        try {
            const items = products
                .map((p) => {
                    const raw = quantities[p.id];
                    const qty = raw ? parseInt(raw, 10) : 0;
                    if (!qty || Number.isNaN(qty) || qty <= 0) return null;

                    const productSelections = selectedOptions[p.id] ?? {};
                    const selectedOptionsForItem: SelectedOption[] = [];

                    if (p.optionGroups) {
                        for (const group of p.optionGroups) {
                            const chosenIds = productSelections[group.id] ?? [];
                            for (const opt of group.options) {
                                if (chosenIds.includes(opt.id)) {
                                    selectedOptionsForItem.push({
                                        groupId: group.id,
                                        groupName: group.name,
                                        optionId: opt.id,
                                        optionLabel: opt.label,
                                        priceDelta: opt.priceDelta ?? 0,
                                    });
                                }
                            }
                        }
                    }

                    return {
                        productId: p.id,
                        quantity: qty,
                        unitPrice: p.price,
                        selectedOptions: selectedOptionsForItem,
                    };
                })
                .filter((x) => x !== null) as {
                    productId: string;
                    quantity: number;
                    unitPrice: number;
                    selectedOptions?: SelectedOption[];
                }[];

            if (items.length === 0) {
                setStatusMessage("Select at least one product with quantity > 0");
                setCreatingOrder(false);
                return;
            }

            const orderId = await createOrderWithLineItems({
                accountId,
                items,
                channel: "in_person",
            });

            setStatusMessage(`Order created ✅ (id: ${orderId})`);

            const resetQuantities: QuantityMap = {};
            const resetOptions: SelectedOptionsMap = {};

            for (const p of products) {
                resetQuantities[p.id] = "";
                if (p.optionGroups && p.optionGroups.length > 0) {
                    resetOptions[p.id] = {};
                    for (const g of p.optionGroups) {
                        resetOptions[p.id][g.id] = [];
                    }
                }
            }

            setQuantities(resetQuantities);
            setSelectedOptions(resetOptions);

            await loadData(accountId);
        } catch (err) {
            console.error("Error creating order", err);
            setStatusMessage("Error creating order");
        } finally {
            setCreatingOrder(false);
        }
    };

    const visibleOrders = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return orders.filter((o) => {
            if (statusFilter !== "all" && o.status !== statusFilter) return false;

            if (todayOnly) {
                if (!o.placedAt) return false;
                const placed = (o.placedAt as any).toDate
                    ? (o.placedAt as any).toDate()
                    : new Date(o.placedAt as any);
                if (!(placed >= today && placed < tomorrow)) return false;
            }

            return true;
        });
    }, [orders, statusFilter, todayOnly]);

    const stats = useMemo(() => {
        const pendingCount = visibleOrders.filter((o) =>
            ["pending", "accepted", "preparing", "ready"].includes(o.status)
        ).length;

        const completedCount = visibleOrders.filter(
            (o) => o.status === "completed"
        ).length;

        const visibleRevenue = visibleOrders.reduce(
            (sum, o) => sum + (o.totalAmount ?? 0),
            0
        );

        return {
            total: visibleOrders.length,
            pending: pendingCount,
            completed: completedCount,
            revenue: visibleRevenue,
        };
    }, [visibleOrders]);

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
                No account.
            </p>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-700">
                                <ClipboardList className="h-5 w-5 text-white" />
                            </div>

                            <h1
                                className="text-3xl font-bold text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                Orders
                            </h1>
                        </div>

                        <p className="text-gray-600">
                            Track live orders and create staff orders for{" "}
                            <span className="font-medium text-gray-900">{accountId}</span>
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowStaffForm((prev) => !prev)}
                        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#D94C3D] to-[#E67E50] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:from-[#C43D2E] hover:to-[#D96D3F]"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        {showStaffForm ? "Hide Staff Order Form" : "Create Order"}
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Visible Orders</span>
                            <ClipboardList className="h-4 w-4 text-teal-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                        <div className="mt-1 text-xs text-gray-500">
                            Based on current filters
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Active Queue</span>
                            <Clock3 className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.pending}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            Pending, accepted, preparing, ready
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Completed</span>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.completed}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            Completed orders in view
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Revenue</span>
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {formatMoney(stats.revenue)}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            Total of visible orders
                        </div>
                    </div>
                </div>

                {/* Staff Create Order Panel */}
                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <button
                        type="button"
                        onClick={() => setShowStaffForm((prev) => !prev)}
                        className="flex w-full items-center justify-between border-b border-gray-100 px-5 py-4 text-left"
                    >
                        <div>
                            <h2
                                className="text-lg font-semibold text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                Create Order (Staff)
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Build an in-person order from your current menu
                            </p>
                        </div>

                        <span
                            className={`text-sm text-gray-500 transition-transform ${showStaffForm ? "rotate-90" : ""
                                }`}
                        >
                            ▸
                        </span>
                    </button>

                    {showStaffForm && (
                        <div className="px-5 py-5">
                            {products.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                    No products yet. Go to{" "}
                                    <Link
                                        to="/menu"
                                        className="font-medium text-teal-700 hover:text-teal-800"
                                    >
                                        Menu
                                    </Link>{" "}
                                    to add items first.
                                </p>
                            ) : (
                                <form onSubmit={handleCreateOrder} className="space-y-4">
                                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                        Product
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                        Price
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                        Qty
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-gray-100">
                                                {products.map((p) => (
                                                    <tr key={p.id} className="align-top hover:bg-gray-50">
                                                        <td className="px-4 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium text-gray-900">
                                                                        {p.name}
                                                                    </span>

                                                                    {p.category && (
                                                                        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700">
                                                                            {p.category}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {p.description && (
                                                                    <p className="text-xs text-gray-500">
                                                                        {p.description}
                                                                    </p>
                                                                )}

                                                                {p.optionGroups && p.optionGroups.length > 0 && (
                                                                    <div className="mt-2 space-y-2">
                                                                        {p.optionGroups.map((group) => {
                                                                            const multi = !!group.multiSelect;
                                                                            const selectedForGroup =
                                                                                selectedOptions[p.id]?.[group.id] ?? [];

                                                                            return (
                                                                                <div
                                                                                    key={group.id}
                                                                                    className="border-t border-gray-100 pt-2"
                                                                                >
                                                                                    <div className="flex items-center justify-between">
                                                                                        <span className="text-xs font-semibold text-gray-700">
                                                                                            {group.name}
                                                                                            {group.required && (
                                                                                                <span className="ml-1 text-[10px] font-normal uppercase text-red-500">
                                                                                                    required
                                                                                                </span>
                                                                                            )}
                                                                                        </span>

                                                                                        {group.description && (
                                                                                            <span className="ml-2 text-[10px] text-gray-500">
                                                                                                {group.description}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>

                                                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                                                        {group.options.map((opt) => {
                                                                                            const checked =
                                                                                                selectedForGroup.includes(opt.id);
                                                                                            const inputType = multi
                                                                                                ? "checkbox"
                                                                                                : "radio";

                                                                                            return (
                                                                                                <label
                                                                                                    key={opt.id}
                                                                                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${checked
                                                                                                            ? "border-teal-300 bg-teal-50 text-teal-700"
                                                                                                            : "border-gray-200 bg-gray-50 text-gray-700"
                                                                                                        }`}
                                                                                                >
                                                                                                    <input
                                                                                                        type={inputType}
                                                                                                        className="h-3 w-3"
                                                                                                        name={`${p.id}-${group.id}`}
                                                                                                        checked={checked}
                                                                                                        onChange={() =>
                                                                                                            handleToggleOption(
                                                                                                                p.id,
                                                                                                                group.id,
                                                                                                                opt.id,
                                                                                                                multi
                                                                                                            )
                                                                                                        }
                                                                                                    />
                                                                                                    <span>{opt.label}</span>

                                                                                                    {opt.priceDelta &&
                                                                                                        opt.priceDelta !== 0 && (
                                                                                                            <span className="text-[10px] text-gray-500">
                                                                                                                {opt.priceDelta > 0
                                                                                                                    ? "+"
                                                                                                                    : "-"}
                                                                                                                $
                                                                                                                {Math.abs(
                                                                                                                    opt.priceDelta
                                                                                                                ).toFixed(2)}
                                                                                                            </span>
                                                                                                        )}
                                                                                                </label>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="px-4 py-4 text-right font-medium text-gray-900">
                                                            ${p.price.toFixed(2)}
                                                        </td>

                                                        <td className="px-4 py-4 text-right">
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                step={1}
                                                                value={quantities[p.id] ?? ""}
                                                                onChange={(e) =>
                                                                    handleQuantityChange(p.id, e.target.value)
                                                                }
                                                                className="w-16 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-right text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={creatingOrder}
                                        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#5B9A8B] to-[#4A7C70] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {creatingOrder ? "Creating..." : "Create Order"}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </section>

                {/* Filters */}
                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2
                                className="text-lg font-semibold text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                Tracking Orders
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Filter and review current order flow
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            <label className="flex items-center gap-2">
                                <span className="font-medium text-gray-600">Status</span>
                                <select
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(e.target.value as OrderStatus | "all")
                                    }
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                >
                                    <option value="all">All</option>
                                    <option value="pending">Pending</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="preparing">Preparing</option>
                                    <option value="ready">Ready</option>
                                    <option value="completed">Completed</option>
                                    <option value="canceled">Canceled</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                            </label>

                            <label className="flex items-center gap-2 text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={todayOnly}
                                    onChange={(e) => setTodayOnly(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                />
                                <span>Today only</span>
                            </label>
                        </div>
                    </div>
                </section>

                {/* Orders List */}
                <section>
                    {loadingOrders && orders.length === 0 ? (
                        <p className="text-sm text-gray-500">Loading orders...</p>
                    ) : visibleOrders.length === 0 ? (
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <p className="text-sm text-gray-500">
                                No orders match this filter.
                            </p>
                        </div>
                    ) : (
                        <ul className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                            {visibleOrders.map((o) => (
                                <li
                                    key={o.id}
                                    className="flex items-center justify-between border-b border-gray-100 px-5 py-4 last:border-b-0 hover:bg-gray-50"
                                >
                                    <div className="flex flex-col gap-1">
                                        <Link
                                            to={`/orders/${o.id}`}
                                            className="text-sm font-semibold text-teal-700 hover:text-teal-800"
                                        >
                                            {o.id}
                                        </Link>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                                {o.channel}
                                            </span>
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium capitalize text-gray-700">
                                                {o.status}
                                            </span>
                                        </div>
                                    </div>

                                    <span className="text-sm font-semibold text-gray-900">
                                        ${o.totalAmount.toFixed(2)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <p className="text-xs text-gray-500">
                    <span className="font-semibold">Status:</span> {statusMessage || "—"}
                </p>
            </div>
        </div>
    );
}
