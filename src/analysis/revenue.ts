import type { Expense } from "../models/expense";
import type { Order, OrderLineItem } from "../models/order";
import type { Product } from "../models/product";
import { addDays, endOfDay, formatDayLabel, formatShortDate, isWithinRange, startOfDay, toDate } from "./date";
import { computeDashboardSummary, selectRecentOrders } from "./dashboard";
import type {
    AnalyticsSnapshot,
    ChannelPerformanceRow,
    HourlyRevenueBucket,
    RankedMenuItem,
    RevenueAnalytics,
    RevenueCategoryRow,
    RevenueTrendPoint,
} from "./types";

function toCents(amount: number | null | undefined): number {
    return Math.round((amount ?? 0) * 100);
}

function isIncludedOrder(order: Order): boolean {
    return order.status !== "canceled" && order.status !== "refunded";
}

function getRange(days: number, now: Date) {
    const end = endOfDay(now);
    const start = startOfDay(addDays(end, -(days - 1)));
    return { start, end };
}

function buildTrend(
    orders: Order[],
    expenses: Expense[],
    days: number,
    now: Date,
): RevenueTrendPoint[] {
    const { start, end } = getRange(days, now);
    const byDate = new Map<string, RevenueTrendPoint>();

    for (let index = 0; index < days; index += 1) {
        const current = addDays(start, index);
        const isoDate = current.toISOString().slice(0, 10);
        byDate.set(isoDate, {
            isoDate,
            label: days <= 7 ? formatDayLabel(current) : formatShortDate(current),
            revenueCents: 0,
            orders: 0,
            expenseCents: 0,
        });
    }

    for (const order of orders) {
        if (!isIncludedOrder(order)) continue;

        const placedAt = toDate(order.placedAt);
        if (!isWithinRange(placedAt, start, end)) continue;

        const isoDate = placedAt.toISOString().slice(0, 10);
        const point = byDate.get(isoDate);
        if (!point) continue;

        point.revenueCents += toCents(order.totalAmount);
        point.orders += 1;
    }

    for (const expense of expenses) {
        const expenseDate = toDate(expense.date);
        if (!isWithinRange(expenseDate, start, end)) continue;

        const isoDate = expenseDate.toISOString().slice(0, 10);
        const point = byDate.get(isoDate);
        if (!point) continue;

        point.expenseCents += expense.amountCents ?? 0;
    }

    return Array.from(byDate.values());
}

function buildTopItems(
    periodOrders: Order[],
    lineItems: OrderLineItem[],
    products: Product[],
): {
    topItems: RankedMenuItem[];
    bottomItems: RankedMenuItem[];
    categoryRevenue: RevenueCategoryRow[];
    estimatedGrossProfitCents: number | null;
    estimatedGrossMarginPct: number | null;
    marginCoveragePct: number;
} {
    const orderIds = new Set(periodOrders.map((order) => order.id));
    const itemRows = lineItems.filter((item) => orderIds.has(item.orderId));
    const productsById = new Map(products.map((product) => [product.id, product]));
    const itemSummary = new Map<string, RankedMenuItem>();
    const categorySummary = new Map<string, { revenueCents: number; quantity: number }>();

    let coveredRevenueCents = 0;
    let estimatedCostCents = 0;
    let totalItemRevenueCents = 0;

    for (const item of itemRows) {
        const product = productsById.get(item.productId);
        const quantity = item.quantity ?? 0;
        const revenueCents = toCents(item.lineSubtotal ?? item.unitPrice * quantity);
        const name = product?.name ?? "Unknown item";
        const category = product?.category ?? "Uncategorized";

        totalItemRevenueCents += revenueCents;

        const costCents =
            product?.cost != null ? Math.round(product.cost * quantity * 100) : null;

        if (costCents != null) {
            coveredRevenueCents += revenueCents;
            estimatedCostCents += costCents;
        }

        const existingItem = itemSummary.get(item.productId);
        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.orders += 1;
            existingItem.revenueCents += revenueCents;

            if (existingItem.estimatedCostCents != null && costCents != null) {
                existingItem.estimatedCostCents += costCents;
                existingItem.estimatedGrossProfitCents =
                    existingItem.revenueCents - existingItem.estimatedCostCents;
            } else {
                existingItem.estimatedCostCents = null;
                existingItem.estimatedGrossProfitCents = null;
            }
        } else {
            itemSummary.set(item.productId, {
                productId: item.productId,
                name,
                category,
                quantity,
                orders: 1,
                revenueCents,
                avgUnitPriceCents: quantity > 0 ? Math.round(revenueCents / quantity) : 0,
                estimatedCostCents: costCents,
                estimatedGrossProfitCents:
                    costCents != null ? revenueCents - costCents : null,
            });
        }

        const existingCategory = categorySummary.get(category) ?? {
            revenueCents: 0,
            quantity: 0,
        };
        existingCategory.revenueCents += revenueCents;
        existingCategory.quantity += quantity;
        categorySummary.set(category, existingCategory);
    }

    const rankedItems = Array.from(itemSummary.values())
        .map((row) => ({
            ...row,
            avgUnitPriceCents:
                row.quantity > 0 ? Math.round(row.revenueCents / row.quantity) : 0,
        }))
        .sort((left, right) => {
            if (right.revenueCents !== left.revenueCents) {
                return right.revenueCents - left.revenueCents;
            }
            return right.quantity - left.quantity;
        });

    const topItems = rankedItems.slice(0, 8);
    const bottomItems = [...rankedItems]
        .sort((left, right) => {
            if (left.revenueCents !== right.revenueCents) {
                return left.revenueCents - right.revenueCents;
            }
            return left.quantity - right.quantity;
        })
        .slice(0, 5);

    const categoryRevenue = Array.from(categorySummary.entries())
        .map(([category, value]) => ({
            category,
            quantity: value.quantity,
            revenueCents: value.revenueCents,
            shareOfRevenuePct:
                totalItemRevenueCents > 0
                    ? (value.revenueCents / totalItemRevenueCents) * 100
                    : 0,
        }))
        .sort((left, right) => right.revenueCents - left.revenueCents);

    const grossProfitCents =
        coveredRevenueCents > 0 ? coveredRevenueCents - estimatedCostCents : null;
    const grossMarginPct =
        grossProfitCents != null && coveredRevenueCents > 0
            ? (grossProfitCents / coveredRevenueCents) * 100
            : null;
    const marginCoveragePct =
        totalItemRevenueCents > 0 ? (coveredRevenueCents / totalItemRevenueCents) * 100 : 0;

    return {
        topItems,
        bottomItems,
        categoryRevenue,
        estimatedGrossProfitCents: grossProfitCents,
        estimatedGrossMarginPct: grossMarginPct,
        marginCoveragePct,
    };
}

function buildHourlyBuckets(periodOrders: Order[]): HourlyRevenueBucket[] {
    const bySlot = new Map<string, HourlyRevenueBucket>();

    for (const order of periodOrders) {
        const placedAt = toDate(order.placedAt);
        const dayOfWeek = placedAt.getDay();
        const hour = placedAt.getHours();
        const key = `${dayOfWeek}-${hour}`;
        const existing = bySlot.get(key) ?? {
            dayOfWeek,
            hour,
            revenueCents: 0,
            orderCount: 0,
        };

        existing.revenueCents += toCents(order.totalAmount);
        existing.orderCount += 1;
        bySlot.set(key, existing);
    }

    return Array.from(bySlot.values()).sort((left, right) => {
        if (left.dayOfWeek !== right.dayOfWeek) {
            return left.dayOfWeek - right.dayOfWeek;
        }
        return left.hour - right.hour;
    });
}

function buildChannelPerformance(periodOrders: Order[]): ChannelPerformanceRow[] {
    const totalRevenueCents = periodOrders.reduce(
        (sum, order) => sum + toCents(order.totalAmount),
        0,
    );
    const byChannel = new Map<
        Order["channel"],
        { orders: number; revenueCents: number }
    >();

    for (const order of periodOrders) {
        const existing = byChannel.get(order.channel) ?? { orders: 0, revenueCents: 0 };
        existing.orders += 1;
        existing.revenueCents += toCents(order.totalAmount);
        byChannel.set(order.channel, existing);
    }

    return Array.from(byChannel.entries())
        .map(([channel, value]) => ({
            channel,
            orders: value.orders,
            revenueCents: value.revenueCents,
            averageOrderValueCents:
                value.orders > 0 ? Math.round(value.revenueCents / value.orders) : 0,
            shareOfRevenuePct:
                totalRevenueCents > 0 ? (value.revenueCents / totalRevenueCents) * 100 : 0,
        }))
        .sort((left, right) => right.revenueCents - left.revenueCents);
}

export function computeRevenueAnalytics(
    snapshot: AnalyticsSnapshot,
    options?: { days?: number; now?: Date },
): RevenueAnalytics {
    const days = options?.days ?? 30;
    const now = options?.now ?? new Date();
    const { start, end } = getRange(days, now);

    const eligibleOrders = snapshot.orders.filter(isIncludedOrder);
    const periodOrders = eligibleOrders.filter((order) =>
        isWithinRange(toDate(order.placedAt), start, end),
    );
    const periodExpenses = snapshot.expenses.filter((expense) =>
        isWithinRange(toDate(expense.date), start, end),
    );

    const totalRevenueCents = periodOrders.reduce(
        (sum, order) => sum + toCents(order.totalAmount),
        0,
    );
    const totalExpenseCents = periodExpenses.reduce(
        (sum, expense) => sum + (expense.amountCents ?? 0),
        0,
    );
    const averageOrderValueCents =
        periodOrders.length > 0 ? Math.round(totalRevenueCents / periodOrders.length) : 0;

    const periodTrend = buildTrend(eligibleOrders, snapshot.expenses, days, now);
    const weeklyTrend = buildTrend(eligibleOrders, snapshot.expenses, 7, now);
    const hourlyBuckets = buildHourlyBuckets(periodOrders);
    const recentOrders = selectRecentOrders(periodOrders.length > 0 ? periodOrders : eligibleOrders, 10);
    const channelPerformance = buildChannelPerformance(periodOrders);
    const topItemMetrics = buildTopItems(periodOrders, snapshot.lineItems, snapshot.products);
    const peakRevenueDay =
        periodTrend.length > 0
            ? [...periodTrend].sort((left, right) => right.revenueCents - left.revenueCents)[0]
                  ?.label ?? null
            : null;
    const bestChannel = channelPerformance[0]?.channel ?? null;

    return {
        summary: computeDashboardSummary(eligibleOrders, now),
        totalRevenueCents,
        totalExpenseCents,
        averageOrderValueCents,
        weeklyTrend,
        periodTrend,
        hourlyBuckets,
        recentOrders,
        topItems: topItemMetrics.topItems,
        bottomItems: topItemMetrics.bottomItems,
        categoryRevenue: topItemMetrics.categoryRevenue,
        channelPerformance,
        peakRevenueDay,
        bestChannel,
        estimatedGrossProfitCents: topItemMetrics.estimatedGrossProfitCents,
        estimatedGrossMarginPct: topItemMetrics.estimatedGrossMarginPct,
        marginCoveragePct: topItemMetrics.marginCoveragePct,
    };
}
