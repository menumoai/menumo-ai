import type { Expense } from "../models/expense";
import type { Order, OrderChannel, OrderLineItem } from "../models/order";
import type { Product } from "../models/product";

export type Summary = {
    count: number;
    revenueCents: number;
};

export type DashboardSummary = {
    today: Summary;
    last7Days: Summary;
    allTime: Summary;
};

export type RevenueTrendPoint = {
    isoDate: string;
    label: string;
    revenueCents: number;
    orders: number;
    expenseCents: number;
};

export type RankedMenuItem = {
    productId: string;
    name: string;
    category: string;
    quantity: number;
    orders: number;
    revenueCents: number;
    avgUnitPriceCents: number;
    estimatedCostCents: number | null;
    estimatedGrossProfitCents: number | null;
};

export type RevenueCategoryRow = {
    category: string;
    quantity: number;
    revenueCents: number;
    shareOfRevenuePct: number;
};

export type HourlyRevenueBucket = {
    dayOfWeek: number;
    hour: number;
    revenueCents: number;
    orderCount: number;
};

export type ChannelPerformanceRow = {
    channel: OrderChannel;
    orders: number;
    revenueCents: number;
    averageOrderValueCents: number;
    shareOfRevenuePct: number;
};

export type RevenueAnalytics = {
    summary: DashboardSummary;
    totalRevenueCents: number;
    totalExpenseCents: number;
    averageOrderValueCents: number;
    weeklyTrend: RevenueTrendPoint[];
    periodTrend: RevenueTrendPoint[];
    hourlyBuckets: HourlyRevenueBucket[];
    recentOrders: Order[];
    topItems: RankedMenuItem[];
    bottomItems: RankedMenuItem[];
    categoryRevenue: RevenueCategoryRow[];
    channelPerformance: ChannelPerformanceRow[];
    peakRevenueDay: string | null;
    bestChannel: string | null;
    estimatedGrossProfitCents: number | null;
    estimatedGrossMarginPct: number | null;
    marginCoveragePct: number;
};

export type MenuPerformanceQuadrant = "star" | "plowhorse" | "puzzle" | "dog";

export type MenuPerformancePoint = {
    productId: string;
    name: string;
    category: string;
    popularity: number;
    profitability: number;
    revenueCents: number;
    quantitySold: number;
    marginPercent: number;
    quadrant: MenuPerformanceQuadrant;
};

export type AnalyticsSnapshot = {
    orders: Order[];
    lineItems: OrderLineItem[];
    products: Product[];
    expenses: Expense[];
};
