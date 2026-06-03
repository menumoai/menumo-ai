export type FinancePeriod = "month" | "quarter" | "year";

export interface FinancePeriodData {
    revenue: number;
    cogs: number;
    grossProfit: number;
    operatingExpenses: number;
    netProfit: number;
    taxEstimate: number;
    label: string;
}

export interface FinanceExpense {
    category: string;
    amount: number;
    pct: number;
    type: "cogs" | "opex";
}

export interface MonthlyTrend {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
}

export interface AvailableReport {
    name: string;
    period: string;
}

export const DEMO_PERIOD_DATA: Record<FinancePeriod, FinancePeriodData> = {
    month: {
        revenue: 47280,
        cogs: 14940,
        grossProfit: 32340,
        operatingExpenses: 8600,
        netProfit: 23740,
        taxEstimate: 5935,
        label: "March 2026",
    },
    quarter: {
        revenue: 138420,
        cogs: 43700,
        grossProfit: 94720,
        operatingExpenses: 25800,
        netProfit: 68920,
        taxEstimate: 17230,
        label: "Q1 2026",
    },
    year: {
        revenue: 512800,
        cogs: 162000,
        grossProfit: 350800,
        operatingExpenses: 98400,
        netProfit: 252400,
        taxEstimate: 63100,
        label: "2025",
    },
};

export const DEMO_EXPENSES: FinanceExpense[] = [
    { category: "Food & Ingredients (COGS)", amount: 14940, pct: 31.6, type: "cogs" },
    { category: "Truck Payment / Lease", amount: 1800, pct: 3.8, type: "opex" },
    { category: "Fuel & Maintenance", amount: 1240, pct: 2.6, type: "opex" },
    { category: "Staff / Labor", amount: 3200, pct: 6.8, type: "opex" },
    { category: "Permits & Licenses", amount: 420, pct: 0.9, type: "opex" },
    { category: "Marketing & SMS", amount: 380, pct: 0.8, type: "opex" },
    { category: "Menumo Subscription", amount: 149, pct: 0.3, type: "opex" },
    { category: "Supplies & Packaging", amount: 611, pct: 1.3, type: "opex" },
];

export const DEMO_MONTHLY_TREND: MonthlyTrend[] = [
    { month: "Oct", revenue: 38200, expenses: 22100, profit: 16100 },
    { month: "Nov", revenue: 41500, expenses: 23800, profit: 17700 },
    { month: "Dec", revenue: 44200, expenses: 25100, profit: 19100 },
    { month: "Jan", revenue: 39800, expenses: 22400, profit: 17400 },
    { month: "Feb", revenue: 43100, expenses: 23540, profit: 19560 },
    { month: "Mar", revenue: 47280, expenses: 23540, profit: 23740 },
];

export const DEMO_AVAILABLE_REPORTS: AvailableReport[] = [
    { name: "Monthly P&L Statement", period: "March 2026" },
    { name: "Sales Tax Summary", period: "Q1 2026" },
    { name: "Expense Breakdown", period: "March 2026" },
    { name: "Revenue by Location", period: "Last 30 days" },
];
