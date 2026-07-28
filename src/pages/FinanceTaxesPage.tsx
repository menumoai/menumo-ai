import { useMemo, useState } from "react";
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
import { Lock } from "lucide-react";
import { useAccount } from "../account/AccountContext";
import { useAnalyticsSnapshot } from "../hooks/useAnalyticsSnapshot";
import { saveTaxFigures, saveTaxProfile } from "../services/accounts";
import { TaxProfileDialog } from "../components/finance/TaxProfileDialog";
import { Contractor1099Panel } from "../components/finance/Contractor1099Panel";
import { UpgradePrompt } from "../components/finance/UpgradePrompt";
import { hasCapability } from "../account/entitlements";
import {
    estimateTax,
    defaultTaxFigures,
    isTaxProfileConfigured,
    TAX_YEAR,
    type TaxProfile,
} from "../analysis/tax";
import {
    computeFinanceOverview,
    type FinanceExpense,
    type FinancePeriod,
    type FinancePeriodData,
    type MonthlyTrend,
} from "../analysis/finance";

const REPORT_ICONS: Record<string, typeof FileText> = {
    "Monthly P&L Statement": FileText,
    "Sales Tax Summary": Receipt,
    "Expense Breakdown": TrendingDown,
    "Revenue by Location": Calendar,
};

/** Guards against divide-by-zero now that revenue can genuinely be 0. */
function pctOfRevenue(value: number, revenue: number) {
    return revenue > 0 ? ((value / revenue) * 100).toFixed(1) : "0.0";
}

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

    const { accountId, account } = useAccount();
    const [taxDialogOpen, setTaxDialogOpen] = useState(false);
    const [savingTax, setSavingTax] = useState(false);
    const { snapshot, loading, error } = useAnalyticsSnapshot(accountId);

    // Real P&L from this account's own orders and expenses. Every figure on
    // this page used to be a hardcoded fixture shown identically to everyone.
    const overview = useMemo(
        () => computeFinanceOverview(snapshot),
        [snapshot],
    );

    const periods: Record<FinancePeriod, FinancePeriodData> = overview.periods;
    const expenses: FinanceExpense[] = overview.expenses;
    const monthlyTrend: MonthlyTrend[] = overview.monthlyTrend;

    // "Advanced P&L" is sold on the Business plan. Basic P&L - the current
    // period, its KPIs and the expense breakdown - stays on every plan; what is
    // gated is the comparative reporting. Pinning the period here means a stale
    // selection cannot leak a quarter view after a downgrade.
    const canUseAdvancedPnl = hasCapability(account, "advancedPnl");
    const effectivePeriod = canUseAdvancedPnl ? period : "month";
    const data = periods[effectivePeriod];

    // Real estimate: SE tax, federal brackets and QBI, stacked on any other
    // household income. Falls back to an unconfigured state that prompts rather
    // than inventing a filing status.
    const taxProfile = (account?.taxProfile ?? null) as TaxProfile | null;
    const taxConfigured = isTaxProfileConfigured(taxProfile);

    // Statutory figures: the owner's confirmed set if there is one, otherwise
    // the shipped defaults. Those defaults were transcribed by hand rather than
    // taken from an IRS feed, so an estimate built on them is labelled
    // unverified until a person records that they have checked them.
    const storedFigures = account?.taxFigures ?? null;
    const figures = useMemo(
        () =>
            storedFigures
                ? {
                      taxYear: storedFigures.taxYear,
                      standardDeduction: storedFigures.standardDeduction,
                      brackets: storedFigures.brackets,
                      ssWageBase: storedFigures.ssWageBase,
                      qbiThreshold: storedFigures.qbiThreshold,
                      addlMedicareThreshold: storedFigures.addlMedicareThreshold,
                  }
                : defaultTaxFigures(
                      taxProfile?.filingStatus ?? "single",
                  ),
        [storedFigures, taxProfile?.filingStatus],
    );
    const figuresVerified = Boolean(storedFigures?.verifiedAt);
    const tax = useMemo(
        () =>
            taxConfigured
                ? estimateTax(data.netProfit, taxProfile, figures)
                : null,
        [taxConfigured, taxProfile, data.netProfit, figures],
    );

    // These cards are labelled as planned surfaces, not downloads. Their period
    // captions still came from fixtures ("March 2026"), so derive them from the
    // real computed periods instead of stating a date that is not ours.
    const availableReports = useMemo(
        () => [
            { name: "Monthly P&L Statement", period: periods.month.label },
            { name: "Sales Tax Summary", period: periods.quarter.label },
            { name: "Expense Breakdown", period: periods.month.label },
            { name: "Revenue by Location", period: "Last 30 days" },
        ],
        [periods],
    );
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
            ["Cost of Goods Sold", `$${data.cogs}`, `${pctOfRevenue(data.cogs, data.revenue)}%`],
            ["Gross Profit", `$${data.grossProfit}`, `${grossMarginPct}%`],
            ["Operating Expenses", `$${data.operatingExpenses}`, `${pctOfRevenue(data.operatingExpenses, data.revenue)}%`],
            ["Net Profit", `$${data.netProfit}`, `${netMarginPct}%`],
            ["Tax set-aside (estimate)", tax ? `$${tax.total}` : "not configured", tax ? `${tax.effectiveRatePct}%` : ""],
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

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <p className="text-sm text-gray-500">Loading your financials…</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {overview.isEmpty && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        <span className="font-semibold">No financial data yet.</span>{" "}
                        Log some orders and expenses and this page fills in from your
                        own numbers.
                    </div>
                )}

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
                            <span className="font-semibold uppercase tracking-wide">
                                Estimate
                            </span>
                            <span>
                                P&amp;L is from your own orders and expenses. Tax figures
                                are a set-aside estimate, not a filing figure.
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex rounded-lg bg-gray-100 p-1">
                            {(["month", "quarter", "year"] as FinancePeriod[]).map((option) => {
                                // Quarter and year are the comparative reporting
                                // sold as Advanced P&L. Rendered locked rather
                                // than hidden, so the plan boundary is legible.
                                const locked = option !== "month" && !canUseAdvancedPnl;

                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        disabled={locked}
                                        title={
                                            locked
                                                ? "Quarter and year comparisons are part of Advanced P&L"
                                                : undefined
                                        }
                                        onClick={() => !locked && setPeriod(option)}
                                        className={`flex items-center gap-1 rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors ${
                                            locked
                                                ? "cursor-not-allowed text-gray-400"
                                                : effectivePeriod === option
                                                  ? "bg-white text-gray-900 shadow"
                                                  : "text-gray-500 hover:text-gray-700"
                                        }`}
                                    >
                                        {option}
                                        {locked && <Lock className="h-3 w-3" />}
                                    </button>
                                );
                            })}
                        </div>

                        {canUseAdvancedPnl ? (
                            <Button
                                onClick={handleExport}
                                className="rounded-xl bg-gradient-to-r from-[#D94C3D] to-[#E67E50] text-white shadow-lg hover:from-[#C43D2E] hover:to-[#D96D3F]"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export All Reports
                            </Button>
                        ) : (
                            <Button
                                variant="secondary"
                                disabled
                                title="CSV export is part of Advanced P&L"
                                className="rounded-xl"
                            >
                                <Lock className="mr-2 h-4 w-4" />
                                Export All Reports
                            </Button>
                        )}
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
                                Tax set-aside estimate
                            </h2>
                            <p className="text-sm text-gray-600">{data.label}</p>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="ml-auto"
                            onClick={() => setTaxDialogOpen(true)}
                        >
                            {taxConfigured ? "Edit settings" : "Set up estimate"}
                        </Button>
                    </div>

                    {/* The figures are shipped defaults, transcribed by hand
                        rather than pulled from an IRS feed. Saying so is the
                        honest position: an owner reserving money against this
                        should know whether a person has checked the tables, and
                        can correct them if not. */}
                    {taxConfigured && !figuresVerified && (
                        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                            <span>
                                <span className="font-semibold">
                                    Using unverified {figures.taxYear} tax figures.
                                </span>{" "}
                                Menumo ships standard federal brackets and
                                deductions as a starting point, but nobody has
                                confirmed them for your return yet. Check them
                                against the IRS tables, or ask your accountant,
                                before you rely on this number.{" "}
                                <button
                                    type="button"
                                    onClick={() => setTaxDialogOpen(true)}
                                    className="font-semibold underline underline-offset-2"
                                >
                                    Review the figures
                                </button>
                            </span>
                        </div>
                    )}

                    {tax ? (
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                                <div className="text-sm text-gray-600">
                                    Self-employment tax
                                </div>
                                <div className="mt-1 text-xl font-bold text-gray-900">
                                    {formatCurrency(tax.selfEmploymentTax)}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Social Security + Medicare on 92.35% of profit
                                </p>
                            </div>
                            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                                <div className="text-sm text-gray-600">
                                    Federal income tax
                                </div>
                                <div className="mt-1 text-xl font-bold text-gray-900">
                                    {formatCurrency(tax.federalIncomeTax)}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    What the truck adds on top of your other income
                                </p>
                            </div>
                            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                                <div className="text-sm text-gray-600">State + local</div>
                                <div className="mt-1 text-xl font-bold text-gray-900">
                                    {formatCurrency(tax.stateTax)}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    At the rate you set
                                </p>
                            </div>
                            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                                <div className="text-sm text-gray-600">
                                    QBI deduction applied
                                </div>
                                <div className="mt-1 text-xl font-bold text-green-700">
                                    {formatCurrency(tax.qbiDeduction)}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    20% pass-through deduction, already netted off
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <h3 className="font-semibold text-gray-900">
                                Estimate your tax set-aside
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-600">
                                We can estimate self-employment tax, federal income tax
                                and the QBI deduction from your P&amp;L. Three things we
                                cannot read from your sales: filing status, your state
                                rate, and any other household income.
                            </p>
                        </div>
                    )}

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                            <div className="mb-2 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <h3 className="font-semibold text-gray-900">
                                    Deductible expenses
                                </h3>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {formatCurrency(data.cogs + data.operatingExpenses)}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Everything you logged this period, from your own expense
                                records
                            </p>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="mb-2 flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-gray-400" />
                                <h3 className="font-semibold text-gray-900">
                                    Sales tax
                                </h3>
                            </div>
                            <div className="text-2xl font-bold text-gray-400">
                                Not tracked
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Menumo does not record sales tax on orders, so we cannot
                                report on it. This estimate covers income and
                                self-employment tax only.
                            </p>
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
                        label="Tax set-aside"
                        value={tax ? formatCurrency(tax.total) : "Set up"}
                        hint={
                            tax
                                ? `${tax.effectiveRatePct}% effective · TY${TAX_YEAR}`
                                : "Add filing status to estimate"
                        }
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
                                    {formatCurrency(data.netProfit - (tax?.total ?? 0))}
                                </span>
                            </div>
                        </div>
                    </div>

                    {!canUseAdvancedPnl ? (
                        <UpgradePrompt capability="advancedPnl" title="Advanced P&L">
                            Compare quarters and years, see six months of revenue
                            against profit, and export your P&amp;L as a CSV for your
                            accountant. This month&rsquo;s figures stay on every plan.
                        </UpgradePrompt>
                    ) : (
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
                    )}
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

                <Contractor1099Panel
                    accountId={accountId}
                    account={account}
                    taxYear={new Date().getFullYear()}
                />

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
                                Report exports are not built yet. Use Export All Reports above for a CSV of this P&L.
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

            <TaxProfileDialog
                open={taxDialogOpen}
                initial={taxProfile}
                figures={figures}
                verified={figuresVerified}
                saving={savingTax}
                onClose={() => !savingTax && setTaxDialogOpen(false)}
                onSave={async (profile, nextFigures) => {
                    if (!accountId) return;
                    setSavingTax(true);
                    try {
                        await saveTaxProfile(accountId, profile);
                        // Only written when the owner ticked the confirmation,
                        // so verifiedAt always means a person actually checked.
                        if (nextFigures) {
                            await saveTaxFigures(accountId, nextFigures);
                        }
                        setTaxDialogOpen(false);
                        setToast("Tax settings saved");
                        setTimeout(() => setToast(null), 3000);
                    } catch (err) {
                        console.error("Failed to save tax profile", err);
                        setToast("Could not save tax settings");
                        setTimeout(() => setToast(null), 3000);
                    } finally {
                        setSavingTax(false);
                    }
                }}
            />
        </div>
    );
}
