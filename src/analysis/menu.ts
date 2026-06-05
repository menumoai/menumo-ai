import type { Order, OrderLineItem } from "../models/order";
import type { Product } from "../models/product";
import { toDate } from "./date";
import type { MenuPerformancePoint } from "./types";

function toCents(amount: number | null | undefined): number {
    return Math.round((amount ?? 0) * 100);
}

function isIncludedOrder(order: Order): boolean {
    return order.status !== "canceled" && order.status !== "refunded";
}

function classifyQuadrant(popularity: number, profitability: number) {
    const popHigh = popularity >= 50;
    const profitHigh = profitability >= 50;

    if (popHigh && profitHigh) return "star" as const;
    if (popHigh && !profitHigh) return "plowhorse" as const;
    if (!popHigh && profitHigh) return "puzzle" as const;
    return "dog" as const;
}

export function computeMenuPerformanceMatrix(
    products: Product[],
    orders: Order[],
    lineItems: OrderLineItem[],
): MenuPerformancePoint[] {
    const eligibleOrderIds = new Set(
        orders
            .filter(isIncludedOrder)
            .sort((left, right) => toDate(right.placedAt).getTime() - toDate(left.placedAt).getTime())
            .map((order) => order.id),
    );

    const productsWithCost = products.filter(
        (product) =>
            product.price > 0 &&
            typeof product.cost === "number" &&
            Number.isFinite(product.cost),
    );

    const lineItemsByProduct = new Map<
        string,
        { quantity: number; revenueCents: number }
    >();

    for (const item of lineItems) {
        if (!eligibleOrderIds.has(item.orderId)) continue;

        const existing = lineItemsByProduct.get(item.productId) ?? {
            quantity: 0,
            revenueCents: 0,
        };

        existing.quantity += item.quantity ?? 0;
        existing.revenueCents += toCents(
            item.lineSubtotal ?? item.unitPrice * (item.quantity ?? 0),
        );

        lineItemsByProduct.set(item.productId, existing);
    }

    const maxQuantity = Math.max(
        ...productsWithCost.map(
            (product) => lineItemsByProduct.get(product.id)?.quantity ?? 0,
        ),
        1,
    );

    return productsWithCost
        .map((product) => {
            const quantity = lineItemsByProduct.get(product.id)?.quantity ?? 0;
            const revenueCents = lineItemsByProduct.get(product.id)?.revenueCents ?? 0;
            const marginPercent =
                product.price > 0 && product.cost != null
                    ? ((product.price - product.cost) / product.price) * 100
                    : 0;
            const popularity = maxQuantity > 0 ? (quantity / maxQuantity) * 100 : 0;
            const profitability = Math.max(0, Math.min(100, marginPercent));

            return {
                productId: product.id,
                name: product.name,
                category: product.category ?? "uncategorized",
                popularity: Math.round(popularity),
                profitability: Math.round(profitability),
                revenueCents,
                quantitySold: quantity,
                marginPercent: Math.round(marginPercent * 10) / 10,
                quadrant: classifyQuadrant(popularity, profitability),
            };
        })
        .sort((left, right) => right.revenueCents - left.revenueCents);
}
