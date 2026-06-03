import { useState } from "react";
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    DollarSign,
    Download,
    FileText,
    Receipt,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
    DEMO_AVAILABLE_REPORTS,
    DEMO_EXPENSES,
    DEMO_MONTHLY_TREND,
    DEMO_PERIOD_DATA,
    type AvailableReport,
    type FinanceExpense,
    type FinancePeriod,
    type FinancePeriodData,
    type MonthlyTrend,
} from "../finance/fixtures";

const REPORT_ICONS: Record<string, typeof FileText> = {
    "Monthly P&L Statement": FileText,
    "Sales Tax Summary": Receipt,
    "Expense Breakdown": TrendingDown,
    "Revenue by Location": Calendar,
};

function formatCurrency(value: number) {
    return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    });
}

function exportCSV(filename: string, rows: string[][]) {
    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}

function KpiTile({
    label,
    value,
    hint,
    hintTint = "text-gray-500",
    Icon,
    iconTint,
}: {
    label: string;
    value: string;
    hint?: string;
    hintTint?: string;
    Icon: typeof DollarSign;
    iconTint: string;
}) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-gray-600">{label}</span>
                <Icon className={`h-4 w-4 ${iconTint}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            {hint && <div className={`mt-1 text-xs ${hintTint}`}>{hint}</div>}
        </div>
    );
}

function PLRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">{label}</span>
            <span className="text-sm font-medium text-gray-900">{value}</span>
        </div>
    );
}

export default function FinanceTaxesPage() {
    const [period, setPeriod] = useState<FinancePeriod>("month");
    const [toast, setToast] = useState<string | null>(null);

    const periods: Record<FinancePeriod, FinancePeriodData> = DEMO_PERIOD_DATA;
    const expenses: FinanceExpense[] = DEMO_EXPENSES;
    const monthlyTrend: MonthlyTrend[] = DEMO_MONTHLY_TREND;
    const availableReports: AvailableReport[] = DEMO_AVAILABLE_REPORTS;

    const data = periods[period];
    const grossMarginPct =
        data.revenue > 0 ? ((data.grossProfit / data.revenue) * 100).toFixed(1) : "0.0";
    const netMarginPct =
        data.revenue > 0 ? ((data.netProfit / data.revenue) * 100).toFixed(1) : "0.0";
    const maxRevenue =
        monthlyTrend.length > 0 ? Math.max(...monthlyTrend.map((month) => month.revenue)) : 0;

    function handleExport() {
        const rows: string[][] = [
            ["Category", "Amount", "% of Revenue"],
            ["Revenue", `$${data.revenue}`, "100%"],
            ["Cost of Goods Sold", `$${data.cogs}`, `${((data.cogs / data.revenue) * 100).toFixed(1)}%`],
            ["Gross Profit", `$${data.grossProfit}`, `${grossMarginPct}%`],
            ["Operating Expenses", `$${data.operatingExpenses}`, `${((data.operatingExpenses / data.revenue) * 100).toFixed(1)}%`],
            ["Net Profit", `$${data.netProfit}`, `${netMarginPct}%`],
            ["Tax Estimate", `$${data.taxEstimate}`, ""],
            [""],
            ["Expense Detail", "Amount", "% of Revenue"],
            ...expenses.map((expense) => [
                expense.category,
                `$${expense.amount}`,
                `${expense.pct}%`,
            ]),
        ];

        exportCSV(`menumo-financials-${data.label.replace(/\s+/g, "-")}.csv`, rows);
        setToast("Financial report exported");
        setTimeout(() => setToast(null), 3000);
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {toast && (
                    <div className="fixed right-4 top-20 z-50 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
                        {toast}
                    </div>
                )}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-700">
                                <Receipt className="h-5 w-5 text-white" />
                            </div>
                            <h1
                                className="text-3xl font-bold text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                Finance & Taxes
                            </h1>
                        </div>
                        <p className="text-gray-600">
                            Financial reports and tax documentation made simple
                        </p>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-900">
                            <span className="font-semibold uppercase tracking-wide">Beta</span>
                            <span>
                                Numbers shown are sample data while live finance aggregates are being built.
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex rounded-lg bg-gray-100 p-1">
                            {(["month", "quarter", "year"] as FinancePeriod[]).map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => setPeriod(option)}
                                    className={`rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors ${
                                        period === option
                                            ? "bg-white text-gray-900 shadow"
                                            : "text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        <Button
                            onClick={handleExport}
                            className="rounded-xl bg-gradient-to-r from-[#D94C3D] to-[#E67E50] text-white shadow-lg hover:from-[#C43D2E] hover:to-[#D96D3F]"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export All Reports
                        </Button>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2
                                className="text-xl font-bold text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                Tax Documentation Status
                            </h2>
                            <p className="text-sm text-gray-600">{data.label}</p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                            <div className="mb-2 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <h3 className="font-semibold text-gray-900">Sales Tax Ready</h3>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {formatCurrency(4359)}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Collected this period</p>
                            <Button size="sm" variant="secondary" className="mt-3 w-full">
                                <Download className="mr-2 h-3 w-3" />
                                Download Report
                            </Button>
                        </div>

                        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                            <div className="mb-2 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <h3 className="font-semibold text-gray-900">Expense Tracking</h3>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {formatCurrency(data.cogs + data.operatingExpenses)}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Total deductible expenses</p>
                            <Button size="sm" variant="secondary" className="mt-3 w-full">
                                <Download className="mr-2 h-3 w-3" />
                                Download Report
                            </Button>
                        </div>

                        <div className="rounded-xl border border-orange-200 bg-white p-4 shadow-sm">
                            <div className="mb-2 flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-orange-600" />
                                <h3 className="font-semibold text-gray-900">1099 Forms</h3>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">Due Feb 1</div>
                            <p className="mt-1 text-xs text-gray-500">2 contractors to file</p>
                            <Button size="sm" className="mt-3 w-full bg-orange-100 text-orange-700 hover:bg-orange-200">
                                <FileText className="mr-2 h-3 w-3" />
                                Generate Forms
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <KpiTile
                        label="Net Income"
                        value={formatCurrency(data.netProfit)}
                        hint={data.label}
                        hintTint="text-green-600"
                        Icon={DollarSign}
                        iconTint="text-green-600"
                    />
                    <KpiTile
                        label="Total Expenses"
                        value={formatCurrency(data.cogs + data.operatingExpenses)}
                        hint={data.label}
                        Icon={TrendingDown}
                        iconTint="text-red-600"
                    />
                    <KpiTile
                        label="Net Margin"
                        value={`${netMarginPct}%`}
                        hint={`${grossMarginPct}% gross margin`}
                        hintTint="text-green-600"
                        Icon={TrendingUp}
                        iconTint="text-green-600"
                    />
                    <KpiTile
                        label="Tax Liability"
                        value={formatCurrency(data.taxEstimate)}
                        hint="Set aside recommended"
                        Icon={Receipt}
                        iconTint="text-purple-600"
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h3
                                className="text-xl font-bold text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                Profit & Loss Statement
                            </h3>
                            <span className="text-xs text-gray-500">{data.label}</span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 py-3">
                                <span className="font-semibold text-gray-900">Total Revenue</span>
                                <span className="text-lg font-bold text-green-700">
                                    {formatCurrency(data.revenue)}
                                </span>
                            </div>

                            <div className="space-y-2 pl-4">
                                <PLRow
                                    label="Cost of Goods Sold"
                                    value={formatCurrency(data.cogs)}
                                />
                                {expenses
                                    .filter((expense) => expense.type === "opex")
                                    .map((expense) => (
                                        <PLRow
                                            key={expense.category}
                                            label={expense.category}
                                            value={formatCurrency(expense.amount)}
                                        />
                                    ))}
                            </div>

                            <div className="flex items-center justify-between border-t-2 border-gray-200 py-3">
                                <span className="text-lg font-bold text-gray-900">Net Profit</span>
                                <span className="text-2xl font-bold text-teal-600">
                                    {formatCurrency(data.netProfit)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
                                <span className="text-sm font-semibold text-amber-900">
                                    After-Tax Profit
                                </span>
                                <span className="text-sm font-bold text-amber-700">
                                    {formatCurrency(data.netProfit - data.taxEstimate)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h3
                            className="mb-4 text-xl font-bold text-gray-900"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            Revenue vs Profit (6 Months)
                        </h3>

                        <div className="space-y-3">
                            {monthlyTrend.map((month) => (
                                <div key={month.month}>
                                    <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                                        <span className="w-8 font-medium text-gray-600">
                                            {month.month}
                                        </span>
                                        <span className="font-medium text-green-600">
                                            {formatCurrency(month.profit)} profit
                                        </span>
                                        <span>{formatCurrency(month.revenue)}</span>
                                    </div>
                                    <div className="relative h-5 overflow-hidden rounded-full bg-gray-100">
                                        <div
                                            className="absolute inset-y-0 left-0 rounded-full bg-teal-200"
                                            style={{
                                                width: `${(month.revenue / maxRevenue) * 100}%`,
                                            }}
                                        />
                                        <div
                                            className="absolute inset-y-0 left-0 rounded-full bg-teal-600"
                                            style={{
                                                width: `${(month.profit / maxRevenue) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <span className="inline-block h-2 w-3 rounded bg-teal-200" />
                                Revenue
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="inline-block h-2 w-3 rounded bg-teal-600" />
                                Net Profit
                            </span>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                        <h3
                            className="text-xl font-bold text-gray-900"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            Expense Breakdown
                        </h3>
                        <span className="text-xs text-gray-500">{data.label}</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    {["Category", "Type", "Amount", "% of Revenue", "Visual"].map((heading) => (
                                        <th
                                            key={heading}
                                            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                                        >
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {expenses.map((expense) => (
                                    <tr key={expense.category} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            {expense.category}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`rounded-full border px-2 py-1 text-xs font-medium ${
                                                    expense.type === "cogs"
                                                        ? "border-amber-200 bg-amber-50 text-amber-700"
                                                        : "border-teal-100 bg-teal-50 text-teal-700"
                                                }`}
                                            >
                                                {expense.type === "cogs" ? "COGS" : "OpEx"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                            {formatCurrency(expense.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {expense.pct}%
                                        </td>
                                        <td className="w-32 px-4 py-3">
                                            <div className="h-2 rounded-full bg-gray-100">
                                                <div
                                                    className={`h-2 rounded-full ${
                                                        expense.type === "cogs"
                                                            ? "bg-amber-400"
                                                            : "bg-teal-500"
                                                    }`}
                                                    style={{
                                                        width: `${Math.min(expense.pct * 3, 100)}%`,
                                                    }}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                            <h3
                                className="text-xl font-bold text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                Available Reports
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Download-ready reporting surfaces planned for the live finance rollout.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {availableReports.map((report) => {
                            const Icon = REPORT_ICONS[report.name] ?? FileText;

                            return (
                                <div
                                    key={report.name}
                                    className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                                >
                                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                                        <Icon className="h-5 w-5 text-teal-600" />
                                    </div>
                                    <div className="font-semibold text-gray-900">{report.name}</div>
                                    <div className="mt-1 text-sm text-gray-500">{report.period}</div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}
