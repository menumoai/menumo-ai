import type { Order } from "../models/order";
import { startOfDay, toDate } from "./date";
import type { DashboardSummary } from "./types";

function toCents(amount: number | null | undefined): number {
    return Math.round((amount ?? 0) * 100);
}

function isIncludedOrder(order: Order): boolean {
    return order.status !== "canceled" && order.status !== "refunded";
}

export function computeDashboardSummary(
    orders: Order[],
    now = new Date(),
): DashboardSummary {
    const base = { count: 0, revenueCents: 0 };
    const summary: DashboardSummary = {
        today: { ...base },
        last7Days: { ...base },
        allTime: { ...base },
    };

    const todayStart = startOfDay(now);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);

    for (const order of orders) {
        if (!isIncludedOrder(order)) continue;

        const placedAt = toDate(order.placedAt);
        const revenueCents = toCents(order.totalAmount);

        summary.allTime.count += 1;
        summary.allTime.revenueCents += revenueCents;

        if (placedAt >= weekStart && placedAt <= now) {
            summary.last7Days.count += 1;
            summary.last7Days.revenueCents += revenueCents;
        }

        if (placedAt >= todayStart && placedAt <= now) {
            summary.today.count += 1;
            summary.today.revenueCents += revenueCents;
        }
    }

    return summary;
}

export function selectRecentOrders(orders: Order[], limit = 10): Order[] {
    return [...orders]
        .filter(isIncludedOrder)
        .sort((left, right) => toDate(right.placedAt).getTime() - toDate(left.placedAt).getTime())
        .slice(0, limit);
}
