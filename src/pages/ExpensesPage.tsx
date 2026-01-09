// src/pages/ExpensesPage.tsx
import { useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";

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

const cardClass =
    "rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900";
const labelClass =
    "mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400";
const selectClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 " +
    "outline-none focus:ring-2 focus:ring-emerald-500/30 " +
    "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 " +
    "[&>option]:bg-white [&>option]:text-slate-900 " +
    "dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-50";
const inputClass = selectClass;

export default function ExpensesPage() {
    const { accountId } = useAccount();
    const { user } = useAuth();

    // Filters
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

    // Form
    const [amount, setAmount] = useState<string>("");
    const [date, setDate] = useState<string>(toDateInputValue(new Date()));
    const [formCategory, setFormCategory] =
        useState<ExpenseCategory>("Food");
    const [vendorName, setVendorName] = useState<string>("");
    const [note, setNote] = useState<string>("");
    const [saving, setSaving] = useState<boolean>(false);

    async function onAddExpense() {
        if (!accountId || !user?.uid) return;

        const parsed = Number(amount);
        if (!Number.isFinite(parsed) || parsed <= 0) return;

        const d = new Date(date);
        d.setHours(12, 0, 0, 0); // avoid timezone edge cases

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
                user.uid,
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
        <div className="mx-auto w-full max-w-5xl px-4 py-6">
            {/* Header */}
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                        Expenses
                    </h1>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        Track spend and compare it to revenue on your dashboard.
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        Total (filtered)
                    </div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                        {formatMoney(totalExpenseCents)}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className={`mb-6 ${cardClass}`}>
                <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Filters
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                        <label className={labelClass}>Start</label>
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
                        <label className={labelClass}>End</label>
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
                        <label className={labelClass}>Category</label>
                        <select
                            className={selectClass}
                            value={category}
                            onChange={(e) =>
                                setCategory(e.target.value as any)
                            }
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
                    <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
                        {error}
                    </div>
                ) : null}
            </div>

            {/* Add Expense */}
            <div className={`mb-6 ${cardClass}`}>
                <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Add expense
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                    <div className="md:col-span-1">
                        <label className={labelClass}>Amount ($)</label>
                        <input
                            className={inputClass}
                            placeholder="12.50"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    <div className="md:col-span-1">
                        <label className={labelClass}>Date</label>
                        <input
                            className={inputClass}
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <div className="md:col-span-1">
                        <label className={labelClass}>Category</label>
                        <select
                            className={selectClass}
                            value={formCategory}
                            onChange={(e) =>
                                setFormCategory(e.target.value as any)
                            }
                        >
                            {EXPENSE_CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-1">
                        <label className={labelClass}>Vendor</label>
                        <input
                            className={inputClass}
                            placeholder="Costco"
                            value={vendorName}
                            onChange={(e) => setVendorName(e.target.value)}
                        />
                    </div>

                    <div className="md:col-span-1">
                        <label className={labelClass}>Note</label>
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
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                        disabled={!accountId || !user?.uid || saving}
                        onClick={onAddExpense}
                    >
                        {saving ? "Saving..." : "Add expense"}
                    </button>
                </div>
            </div>

            {/* List */}
            <div className={cardClass}>
                <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Expenses
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        {loading ? "Loading..." : `${expenses.length} items`}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="text-xs text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="py-2 pr-4">Date</th>
                                <th className="py-2 pr-4">Category</th>
                                <th className="py-2 pr-4">Vendor</th>
                                <th className="py-2 pr-4">Note</th>
                                <th className="py-2 text-right">Amount</th>
                                <th className="py-2 text-right">Action</th>
                            </tr>
                        </thead>

                        <tbody className="text-slate-700 dark:text-slate-200">
                            {expenses.map((e) => (
                                <tr
                                    key={e.id}
                                    className="border-t border-slate-200 dark:border-slate-800"
                                >
                                    <td className="py-2 pr-4 whitespace-nowrap">
                                        {e.date?.toDate?.().toLocaleDateString?.() ??
                                            ""}
                                    </td>
                                    <td className="py-2 pr-4 whitespace-nowrap">
                                        {e.category}
                                    </td>
                                    <td className="py-2 pr-4">
                                        {e.vendorName || "—"}
                                    </td>
                                    <td className="py-2 pr-4">
                                        {e.note || "—"}
                                    </td>
                                    <td className="py-2 text-right whitespace-nowrap font-medium text-slate-900 dark:text-slate-50">
                                        {formatMoney(e.amountCents)}
                                    </td>
                                    <td className="py-2 text-right">
                                        <button
                                            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                            onClick={() => onDelete(e.id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {!loading && expenses.length === 0 ? (
                                <tr>
                                    <td
                                        className="py-6 text-center text-sm text-slate-500 dark:text-slate-400"
                                        colSpan={6}
                                    >
                                        No expenses found for this filter range.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
