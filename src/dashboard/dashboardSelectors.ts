import type { Order } from "../models/order";
import type { DashboardSummary, Summary } from "./dashboardTypes";

export function toDate(value: unknown): Date {
    if (value instanceof Date) return value;
    return new Date(value as any);
}

export function startOfDay(d: Date) {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

export function computeDashboardSummary(orders: Order[], now = new Date()): DashboardSummary {
    const base: Summary = { count: 0, revenue: 0 };

    const acc: DashboardSummary = {
        today: { ...base },
        last7Days: { ...base },
        allTime: { ...base },
    };

    const todayStart = startOfDay(now);
    const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const o of orders) {
        const placed = toDate(o.placedAt);
        const total = o.totalAmount ?? 0;

        acc.allTime.count += 1;
        acc.allTime.revenue += total;

        if (placed >= weekAgo && placed <= now) {
            acc.last7Days.count += 1;
            acc.last7Days.revenue += total;
        }

        if (placed >= todayStart && placed <= now) {
            acc.today.count += 1;
            acc.today.revenue += total;
        }
    }

    return acc;
}

export function selectRecentOrders(orders: Order[], limit = 10): Order[] {
    return [...orders]
        .sort((a, b) => toDate(b.placedAt).getTime() - toDate(a.placedAt).getTime())
        .slice(0, limit);
}
