// src/pages/ExpensesPage.tsx
import { useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import {
    Receipt,
    DollarSign,
    Filter,
    Plus,
    Trash2,
    CalendarDays,
    Tags,
} from "lucide-react";

import { useAccount } from "../account/AccountContext";
import { useAuth } from "../auth/AuthContext";
import { useExpenses } from "../hooks/useExpense";
import {
    EXPENSE_CATEGORIES,
    type ExpenseCategory,
} from "../models/expense";
import { createExpense, deleteExpense } from "../services/expense";

function formatMoney(cents: number) {
    const dollars = (cents || 0) / 100;
    return dollars.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    });
}

function toDateInputValue(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

const inputClass =
    "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 " +
    "outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500";

export default function ExpensesPage() {
    const { accountId, account } = useAccount();
    const { user } = useAuth();

    const defaultStart = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const defaultEnd = useMemo(() => {
        const d = new Date();
        d.setHours(23, 59, 59, 999);
        return d;
    }, []);

    const [startDate, setStartDate] = useState<Date>(defaultStart);
    const [endDate, setEndDate] = useState<Date>(defaultEnd);
    const [category, setCategory] = useState<ExpenseCategory | "all">("all");

    const { expenses, totalExpenseCents, loading, error } = useExpenses({
        start: startDate,
        end: endDate,
        category,
        limit: 200,
    });

    const [amount, setAmount] = useState<string>("");
    const [date, setDate] = useState<string>(toDateInputValue(new Date()));
    const [formCategory, setFormCategory] =
        useState<ExpenseCategory>("Food");
    const [vendorName, setVendorName] = useState<string>("");
    const [note, setNote] = useState<string>("");
    const [saving, setSaving] = useState<boolean>(false);

    const stats = useMemo(() => {
        const uniqueVendors = new Set(
            expenses.map((e) => e.vendorName?.trim()).filter(Boolean)
        ).size;

        const avgExpense =
            expenses.length > 0 ? Math.round(totalExpenseCents / expenses.length) : 0;

        const categoryBreakdown = new Map<string, number>();
        for (const e of expenses) {
            categoryBreakdown.set(
                e.category,
                (categoryBreakdown.get(e.category) ?? 0) + e.amountCents
            );
        }

        let topCategory = "—";
        let topCategoryAmount = 0;

        for (const [cat, total] of categoryBreakdown.entries()) {
            if (total > topCategoryAmount) {
                topCategory = cat;
                topCategoryAmount = total;
            }
        }

        return {
            count: expenses.length,
            total: totalExpenseCents,
            avgExpense,
            uniqueVendors,
            topCategory,
        };
    }, [expenses, totalExpenseCents]);

    async function onAddExpense() {
        if (!accountId || !user?.uid) return;

        const parsed = Number(amount);
        if (!Number.isFinite(parsed) || parsed <= 0) return;

        const d = new Date(date);
        d.setHours(12, 0, 0, 0);

        const amountCents = Math.round(parsed * 100);

        setSaving(true);
        try {
            await createExpense(
                accountId,
                {
                    amountCents,
                    currency: "USD",
                    date: Timestamp.fromDate(d),
                    category: formCategory,
                    vendorName: vendorName.trim(),
                    note: note.trim(),
                },
                user.uid
            );

            setAmount("");
            setVendorName("");
            setNote("");
        } finally {
            setSaving(false);
        }
    }

    async function onDelete(id: string) {
        if (!accountId) return;
        await deleteExpense(accountId, id);
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-700">
                                <Receipt className="h-5 w-5 text-white" />
                            </div>

                            <h1
                                className="text-3xl font-bold text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                Expenses
                            </h1>
                        </div>

                        <p className="text-gray-600">
                            Track spend for{" "}
                            <span className="font-medium text-gray-900">
                                {account?.name ?? accountId ?? "your account"}
                            </span>
                        </p>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 text-right shadow-sm">
                        <div className="text-xs uppercase tracking-wide text-gray-500">
                            Total (filtered)
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {formatMoney(totalExpenseCents)}
                        </div>
                    </div>
                </div>

                {/* Hero Banner */}
                <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 p-6 text-white shadow-lg">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                            <DollarSign className="h-6 w-6" />
                        </div>

                        <div className="flex-1">
                            <h3 className="mb-2 text-lg font-semibold">
                                Expense Tracking Snapshot
                            </h3>
                            <p className="mb-4 text-teal-50">
                                You’ve recorded {stats.count} expenses in this filtered range,
                                totaling {formatMoney(stats.total)}. Your current top spending
                                category is <span className="font-semibold">{stats.topCategory}</span>.
                            </p>

                            <div className="flex flex-wrap gap-2">
                                <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                                    <Receipt className="mr-1 inline h-4 w-4" />
                                    {stats.count} Expenses
                                </span>
                                <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                                    <Tags className="mr-1 inline h-4 w-4" />
                                    {stats.topCategory}
                                </span>
                                <span className="rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur">
                                    <DollarSign className="mr-1 inline h-4 w-4" />
                                    Avg {formatMoney(stats.avgExpense)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total Expenses</span>
                            <Receipt className="h-4 w-4 text-teal-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.count}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            In current filtered range
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total Spend</span>
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {formatMoney(stats.total)}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            Sum of filtered expenses
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Avg Expense</span>
                            <CalendarDays className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {formatMoney(stats.avgExpense)}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            Average per entry
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Vendors</span>
                            <Tags className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {stats.uniqueVendors}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                            Unique vendor names
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <Filter className="h-4 w-4 text-teal-600" />
                        <h2
                            className="text-lg font-semibold text-gray-900"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            Filters
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-gray-600">
                                Start Date
                            </label>
                            <input
                                className={inputClass}
                                type="date"
                                value={toDateInputValue(startDate)}
                                onChange={(e) => {
                                    const d = new Date(e.target.value);
                                    d.setHours(0, 0, 0, 0);
                                    setStartDate(d);
                                }}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-gray-600">
                                End Date
                            </label>
                            <input
                                className={inputClass}
                                type="date"
                                value={toDateInputValue(endDate)}
                                onChange={(e) => {
                                    const d = new Date(e.target.value);
                                    d.setHours(23, 59, 59, 999);
                                    setEndDate(d);
                                }}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-gray-600">
                                Category
                            </label>
                            <select
                                className={inputClass}
                                value={category}
                                onChange={(e) => setCategory(e.target.value as any)}
                            >
                                <option value="all">All</option>
                                {EXPENSE_CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {error ? (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    ) : null}
                </section>

                {/* Add Expense */}
                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <Plus className="h-4 w-4 text-teal-600" />
                        <h2
                            className="text-lg font-semibold text-gray-900"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            Add Expense
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-gray-600">
                                Amount ($)
                            </label>
                            <input
                                className={inputClass}
                                placeholder="12.50"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-gray-600">
                                Date
                            </label>
                            <input
                                className={inputClass}
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-gray-600">
                                Category
                            </label>
                            <select
                                className={inputClass}
                                value={formCategory}
                                onChange={(e) => setFormCategory(e.target.value as any)}
                            >
                                {EXPENSE_CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-gray-600">
                                Vendor
                            </label>
                            <input
                                className={inputClass}
                                placeholder="Costco"
                                value={vendorName}
                                onChange={(e) => setVendorName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-gray-600">
                                Note
                            </label>
                            <input
                                className={inputClass}
                                placeholder="Propane refill"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end">
                        <button
                            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#5B9A8B] to-[#4A7C70] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={!accountId || !user?.uid || saving}
                            onClick={onAddExpense}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {saving ? "Saving..." : "Add Expense"}
                        </button>
                    </div>
                </section>

                {/* Expenses Table */}
                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2
                                className="text-lg font-semibold text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                Expenses
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Review your tracked spending
                            </p>
                        </div>

                        <div className="text-sm text-gray-500">
                            {loading ? "Loading..." : `${expenses.length} items`}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Date
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Category
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Vendor
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Note
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Amount
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {expenses.map((e) => (
                                    <tr key={e.id} className="transition-colors hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                                            {e.date?.toDate?.().toLocaleDateString?.() ?? ""}
                                        </td>

                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="inline-flex rounded-full bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700">
                                                {e.category}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3 text-gray-700">
                                            {e.vendorName || "—"}
                                        </td>

                                        <td className="px-4 py-3 text-gray-600">
                                            {e.note || "—"}
                                        </td>

                                        <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-gray-900">
                                            {formatMoney(e.amountCents)}
                                        </td>

                                        <td className="px-4 py-3 text-right">
                                            <button
                                                className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                                                onClick={() => onDelete(e.id)}
                                            >
                                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {!loading && expenses.length === 0 ? (
                                    <tr>
                                        <td
                                            className="px-4 py-8 text-center text-sm text-gray-500"
                                            colSpan={6}
                                        >
                                            No expenses found for this filter range.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}
