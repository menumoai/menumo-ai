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

export type RevenueTrendPoint = {
    day: string;
    revenue: number;
    orders: number;
};

export function selectWeeklyRevenueTrend(
    orders: Order[],
    now = new Date(),
): RevenueTrendPoint[] {
    const end = startOfDay(now);
    const days: RevenueTrendPoint[] = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date(end);
        d.setDate(end.getDate() - i);

        days.push({
            day: d.toLocaleDateString("en-US", { weekday: "short" }),
            revenue: 0,
            orders: 0,
        });
    }

    for (const order of orders) {
        const placed = startOfDay(toDate(order.placedAt));
        const diffDays = Math.floor(
            (end.getTime() - placed.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (diffDays >= 0 && diffDays < 7) {
            const index = 6 - diffDays;
            days[index].revenue += order.totalAmount ?? 0;
            days[index].orders += 1;
        }
    }

    return days;
}
