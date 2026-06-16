import type { RevenueAnalytics } from "../../analysis/types";

// Shared companion types — used by both the presentational component and the
// request helper so the UI and the serverless function agree on one shape.

export type CompanionCategory =
    | "revenue"
    | "menu"
    | "orders"
    | "expenses"
    | "locations"
    | "operations";

export type CompanionUrgency = "now" | "soon" | "idea";

export type CompanionActionStyle = "primary" | "secondary";

export interface SuggestionAction {
    label: string;
    style: CompanionActionStyle;
    effect: string;
}

export interface CompanionSuggestion {
    id: string;
    icon: string;
    title: string;
    description: string;
    detail: string;
    projectedValue: string;
    category: CompanionCategory;
    urgency: CompanionUrgency;
    actions: SuggestionAction[];
}

// The model returns everything except the client-side `actions`, which we
// attach generically since "apply" effects are not wired to real writes yet.
export type GeneratedSuggestion = Omit<CompanionSuggestion, "actions">;

const DEFAULT_ACTIONS: SuggestionAction[] = [
    { label: "Dismiss", style: "secondary", effect: "dismiss" },
];

function centsToDollars(cents: number): number {
    return Math.round(cents) / 100;
}

/**
 * Compact, off-device summary of the account's analytics. This is the only data
 * sent to the serverless function — keep it small and human-meaningful (dollars,
 * not cents; a handful of rows, not the full snapshot).
 */
export function buildCompanionSummary(analytics: RevenueAnalytics) {
    return {
        totals: {
            revenue: centsToDollars(analytics.totalRevenueCents),
            expenses: centsToDollars(analytics.totalExpenseCents),
            averageOrderValue: centsToDollars(
                analytics.averageOrderValueCents,
            ),
            grossMarginPct: analytics.estimatedGrossMarginPct,
        },
        peakRevenueDay: analytics.peakRevenueDay,
        bestChannel: analytics.bestChannel,
        topItems: analytics.topItems.slice(0, 5).map((item) => ({
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            revenue: centsToDollars(item.revenueCents),
            grossProfit:
                item.estimatedGrossProfitCents == null
                    ? null
                    : centsToDollars(item.estimatedGrossProfitCents),
        })),
        bottomItems: analytics.bottomItems.slice(0, 3).map((item) => ({
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            revenue: centsToDollars(item.revenueCents),
        })),
        channelPerformance: analytics.channelPerformance.map((row) => ({
            channel: row.channel,
            orders: row.orders,
            revenue: centsToDollars(row.revenueCents),
            averageOrderValue: centsToDollars(row.averageOrderValueCents),
            shareOfRevenuePct: row.shareOfRevenuePct,
        })),
        categoryRevenue: analytics.categoryRevenue.map((row) => ({
            category: row.category,
            quantity: row.quantity,
            revenue: centsToDollars(row.revenueCents),
            shareOfRevenuePct: row.shareOfRevenuePct,
        })),
    };
}

export type CompanionSummary = ReturnType<typeof buildCompanionSummary>;

/** Thrown on any non-OK response so the caller can surface a clear error. */
export class CompanionRequestError extends Error {
    status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.name = "CompanionRequestError";
        this.status = status;
    }
}

/**
 * Request route-aware suggestions from the serverless function. Throws a
 * CompanionRequestError on any non-200 response so the caller can show an error.
 */
export async function fetchCompanionSuggestions(
    context: string,
    summary: CompanionSummary,
    signal?: AbortSignal,
): Promise<CompanionSuggestion[]> {
    let response: Response;
    try {
        response = await fetch("/api/companion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ context, summary }),
            signal,
        });
    } catch (error) {
        // Network failure / server not reachable (e.g. running plain `vite` with
        // no dev API, or the function is down).
        if (error instanceof DOMException && error.name === "AbortError") {
            throw error;
        }
        throw new CompanionRequestError(
            "Could not reach the AI service. Check your connection and try again.",
        );
    }

    if (!response.ok) {
        let serverMessage: string | undefined;
        try {
            serverMessage = (await response.json())?.error;
        } catch {
            // Non-JSON error body — ignore and use a status-based message below.
        }
        throw new CompanionRequestError(
            serverMessage ?? `Request failed (${response.status}).`,
            response.status,
        );
    }

    const data: { suggestions?: GeneratedSuggestion[] } = await response.json();
    const suggestions = Array.isArray(data.suggestions)
        ? data.suggestions
        : [];

    return suggestions.map((suggestion) => ({
        ...suggestion,
        actions: DEFAULT_ACTIONS,
    }));
}
