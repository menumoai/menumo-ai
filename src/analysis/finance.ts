// src/analysis/finance.ts
//
// Real P&L computed from the account's own orders and expenses.
//
// This replaces src/finance/fixtures.ts, where every figure on /finance was a
// hardcoded constant (revenue: 47280, taxEstimate: 5935, label: "March 2026")
// shown identically to every account. Those fixtures came from profitpilot,
// whose finance service still returns them behind
// `TODO(post-pilot): replace fixture return with real DB queries`.
//
// The accounting model is ported from those fixtures, which encode it exactly
// and consistently across all three periods:
//
//     grossProfit = revenue - cogs
//     netProfit   = grossProfit - operatingExpenses
//     taxEstimate = netProfit * 0.25
//
// Pure and deterministic: no I/O, no React, `now` is injected. Money is handled
// in integer cents throughout and only converted to dollars at the boundary,
// because the page renders currency and Firestore stores float dollars.

import type { Expense } from "../models/expense";
import type { ExpenseCategory } from "../models/expense";
import type { Order } from "../models/order";
import type { AnalyticsSnapshot } from "./types";
import { toDate } from "./date";

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

export interface FinanceOverview {
    periods: Record<FinancePeriod, FinancePeriodData>;
    expenses: FinanceExpense[];
    monthlyTrend: MonthlyTrend[];
    /** True when there are no orders and no expenses in the widest period. */
    isEmpty: boolean;
}

/**
 * Flat effective rate applied to net profit, ported from profitpilot: its
 * fixtures set taxEstimate to exactly 25% of netProfit for month, quarter and
 * year alike.
 *
 * This is a placeholder, not tax accounting. It ignores jurisdiction, entity
 * type, filing frequency, deductions and sales-vs-income tax entirely. The
 * account model already carries state / county / postalCode, which is where a
 * real implementation would start. Until then the UI must present this as a
 * rough set-aside and never as a filing figure.
 */
export const ESTIMATED_TAX_RATE = 0.25;

/**
 * Expense categories treated as cost of goods sold. Everything else is
 * operating expense.
 *
 * Matches the ported fixtures, where "Food & Ingredients (COGS)" was the only
 * cogs row and "Supplies & Packaging" sat in opex.
 *
 * COGS is taken from expenses rather than from per-product cost estimates so
 * the two never double-count. Product costs drive margin analysis on /menu;
 * this page reports money actually spent.
 */
const COGS_CATEGORIES: ReadonlySet<ExpenseCategory> = new Set<ExpenseCategory>([
    "Food",
]);

const MONTH_LABELS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function toCents(amount: number | null | undefined): number {
    return Math.round((amount ?? 0) * 100);
}

function centsToDollars(cents: number): number {
    return Math.round(cents) / 100;
}

/** Mirrors the rule in analysis/revenue.ts so both agree on what counts. */
function isIncludedOrder(order: Order): boolean {
    return order.status !== "canceled" && order.status !== "refunded";
}

function periodStart(period: FinancePeriod, now: Date): Date {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(1);

    if (period === "month") {
        return start;
    }
    if (period === "quarter") {
        start.setMonth(Math.floor(start.getMonth() / 3) * 3);
        return start;
    }
    start.setMonth(0);
    return start;
}

function periodLabel(period: FinancePeriod, now: Date): string {
    const year = now.getFullYear();
    if (period === "month") {
        return `${MONTH_LABELS[now.getMonth()]} ${year}`;
    }
    if (period === "quarter") {
        return `Q${Math.floor(now.getMonth() / 3) + 1} ${year}`;
    }
    return String(year);
}

function inRange(value: unknown, start: Date, end: Date): boolean {
    const date = toDate(value);
    return date >= start && date <= end;
}

function computePeriod(
    snapshot: AnalyticsSnapshot,
    period: FinancePeriod,
    now: Date,
): FinancePeriodData {
    const start = periodStart(period, now);
    const end = now;

    let revenueCents = 0;
    for (const order of snapshot.orders) {
        if (!isIncludedOrder(order)) continue;
        if (!inRange(order.placedAt, start, end)) continue;
        revenueCents += toCents(order.totalAmount);
    }

    let cogsCents = 0;
    let opexCents = 0;
    for (const expense of snapshot.expenses) {
        if (!inRange(expense.date, start, end)) continue;
        // Expenses are already stored in integer cents.
        const cents = expense.amountCents ?? 0;
        if (COGS_CATEGORIES.has(expense.category)) {
            cogsCents += cents;
        } else {
            opexCents += cents;
        }
    }

    const grossProfitCents = revenueCents - cogsCents;
    const netProfitCents = grossProfitCents - opexCents;

    // A loss creates no income-tax liability, so never show a negative estimate.
    const taxEstimateCents =
        netProfitCents > 0 ? Math.round(netProfitCents * ESTIMATED_TAX_RATE) : 0;

    return {
        revenue: centsToDollars(revenueCents),
        cogs: centsToDollars(cogsCents),
        grossProfit: centsToDollars(grossProfitCents),
        operatingExpenses: centsToDollars(opexCents),
        netProfit: centsToDollars(netProfitCents),
        taxEstimate: centsToDollars(taxEstimateCents),
        label: periodLabel(period, now),
    };
}

/** Expense breakdown for the current month, largest first. */
function computeExpenseBreakdown(
    expenses: Expense[],
    now: Date,
): FinanceExpense[] {
    const start = periodStart("month", now);
    const totals = new Map<ExpenseCategory, number>();

    for (const expense of expenses) {
        if (!inRange(expense.date, start, now)) continue;
        totals.set(
            expense.category,
            (totals.get(expense.category) ?? 0) + (expense.amountCents ?? 0),
        );
    }

    const totalCents = [...totals.values()].reduce((sum, c) => sum + c, 0);
    if (totalCents === 0) return [];

    return [...totals.entries()]
        .map(([category, cents]) => ({
            category,
            amount: centsToDollars(cents),
            pct: Math.round((cents / totalCents) * 1000) / 10,
            type: COGS_CATEGORIES.has(category)
                ? ("cogs" as const)
                : ("opex" as const),
        }))
        .sort((left, right) => right.amount - left.amount);
}

/** Trailing six calendar months, oldest first. */
function computeMonthlyTrend(
    snapshot: AnalyticsSnapshot,
    now: Date,
): MonthlyTrend[] {
    const points: MonthlyTrend[] = [];

    for (let offset = 5; offset >= 0; offset -= 1) {
        const monthStart = new Date(
            now.getFullYear(),
            now.getMonth() - offset,
            1,
        );
        const monthEnd = new Date(
            monthStart.getFullYear(),
            monthStart.getMonth() + 1,
            0,
            23,
            59,
            59,
            999,
        );

        let revenueCents = 0;
        for (const order of snapshot.orders) {
            if (!isIncludedOrder(order)) continue;
            if (!inRange(order.placedAt, monthStart, monthEnd)) continue;
            revenueCents += toCents(order.totalAmount);
        }

        let expenseCents = 0;
        for (const expense of snapshot.expenses) {
            if (!inRange(expense.date, monthStart, monthEnd)) continue;
            expenseCents += expense.amountCents ?? 0;
        }

        points.push({
            month: MONTH_LABELS[monthStart.getMonth()],
            revenue: centsToDollars(revenueCents),
            expenses: centsToDollars(expenseCents),
            profit: centsToDollars(revenueCents - expenseCents),
        });
    }

    return points;
}

export function computeFinanceOverview(
    snapshot: AnalyticsSnapshot,
    options: { now?: Date } = {},
): FinanceOverview {
    const now = options.now ?? new Date();

    const periods: Record<FinancePeriod, FinancePeriodData> = {
        month: computePeriod(snapshot, "month", now),
        quarter: computePeriod(snapshot, "quarter", now),
        year: computePeriod(snapshot, "year", now),
    };

    const year = periods.year;

    return {
        periods,
        expenses: computeExpenseBreakdown(snapshot.expenses, now),
        monthlyTrend: computeMonthlyTrend(snapshot, now),
        isEmpty: year.revenue === 0 && year.cogs === 0 && year.operatingExpenses === 0,
    };
}
