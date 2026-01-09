// src/components/dashboard/RecentExpensesTable.tsx
import type { Expense } from "../../models/expense";

function formatMoney(cents: number) {
    const dollars = (cents || 0) / 100;
    return dollars.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
    });
}

function formatDate(ts: any) {
    try {
        const d: Date = ts?.toDate?.() ?? new Date();
        return d.toLocaleDateString();
    } catch {
        return "";
    }
}

type Props = {
    expenses: Expense[];
    maxRows?: number;
};

export default function RecentExpensesTable({ expenses, maxRows = 8 }: Props) {
    const rows = expenses.slice(0, maxRows);

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Recent Expenses
                </h3>
            </div>

            {rows.length === 0 ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                    No expenses yet.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800">
                                <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Date
                                </th>
                                <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Category
                                </th>
                                <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Vendor
                                </th>
                                <th className="py-2 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Amount
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map((e) => (
                                <tr
                                    key={e.id}
                                    className="border-b border-slate-100 last:border-b-0 dark:border-slate-800"
                                >
                                    <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                                        {formatDate(e.date)}
                                    </td>
                                    <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                                        {e.category}
                                    </td>
                                    <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">
                                        {e.vendorName || "—"}
                                    </td>
                                    <td className="py-2 text-right font-medium text-slate-900 dark:text-slate-50">
                                        {formatMoney(e.amountCents)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
