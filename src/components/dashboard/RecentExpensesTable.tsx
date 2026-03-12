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

export default function RecentExpensesTable({
    expenses,
    maxRows = 8,
}: Props) {
    const rows = expenses.slice(0, maxRows);

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
                <h3
                    className="text-lg font-semibold text-gray-900"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                >
                    Recent Expenses
                </h3>
            </div>

            {rows.length === 0 ? (
                <div className="text-sm text-gray-500">No expenses yet.</div>
            ) : (
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
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Amount
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {rows.map((e) => (
                                <tr key={e.id} className="transition-colors hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-700">{formatDate(e.date)}</td>

                                    <td className="px-4 py-3">
                                        <span className="inline-flex rounded-full bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700">
                                            {e.category}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3 text-gray-600">
                                        {e.vendorName || "—"}
                                    </td>

                                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
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
