// src/analysis/shelfLife.ts
//
// Pure, deterministic shelf-life + expiry-risk math. No I/O, no React. Given a
// perishable category, resolve a default shelf life; given received batches,
// classify how close each is to spoiling. This is the "daily background job"
// from the spec, computed on read for the pilot rather than by a server cron.

import type { InventoryBatch, PerishableCategory } from "../models/inventoryBatch";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Default shelf life in days per spoilage class (the spec's defaults). Non-
 * perishable dry goods still get a long finite life so every batch carries a
 * concrete `expiresAt`; the owner can override any of these at log time.
 */
export const SHELF_LIFE_DEFAULTS: Record<PerishableCategory, number> = {
    dairy: 7,
    produce: 4,
    protein: 3,
    non_perishable: 365,
    other: 14,
};

/** Days below which a still-good batch is flagged Critical (spoils imminently). */
export const CRITICAL_DAYS = 2;
/** Days below which a batch is flagged as expiring soon (heads-up, not urgent). */
export const WARNING_DAYS = 4;

export function defaultShelfLifeDays(category: PerishableCategory): number {
    return SHELF_LIFE_DEFAULTS[category] ?? SHELF_LIFE_DEFAULTS.other;
}

/** `receivedAt` + `shelfLifeDays`, as a Date. Services convert to a Timestamp. */
export function computeExpiresAt(receivedAt: Date, shelfLifeDays: number): Date {
    return new Date(receivedAt.getTime() + shelfLifeDays * DAY_MS);
}

export type BatchRiskLevel = "ok" | "expiring_soon" | "critical" | "expired";

export interface BatchRisk {
    batch: InventoryBatch;
    level: BatchRiskLevel;
    /** Whole days until expiry (negative once expired), relative to `now`. */
    daysUntilExpiry: number;
    /** Remaining on-hand value in dollars: quantityRemaining * unitCost. */
    value: number;
}

export interface BatchRiskSummary {
    /** Every active, non-empty batch, soonest expiry first. */
    risks: BatchRisk[];
    critical: BatchRisk[];
    expiringSoon: BatchRisk[];
    expired: BatchRisk[];
    /** Total dollar value of critical + expired batches (what waste would cost). */
    atRiskValue: number;
}

/** Whole days from `now` until the batch expires; negative once past. */
export function daysUntilExpiry(batch: InventoryBatch, now: Date): number {
    const diffMs = batch.expiresAt.toMillis() - now.getTime();
    return Math.ceil(diffMs / DAY_MS);
}

/**
 * Classify a single batch. Only batches that still hold stock can be at risk;
 * depleted lots and those with no remaining quantity are treated as "ok".
 */
export function batchRiskLevel(batch: InventoryBatch, now: Date): BatchRiskLevel {
    if (batch.status === "depleted" || batch.quantityRemaining <= 0) return "ok";
    const days = daysUntilExpiry(batch, now);
    if (days < 0) return "expired";
    if (days <= CRITICAL_DAYS) return "critical";
    if (days <= WARNING_DAYS) return "expiring_soon";
    return "ok";
}

const LEVEL_URGENCY: Record<BatchRiskLevel, number> = {
    expired: 0,
    critical: 1,
    expiring_soon: 2,
    ok: 3,
};

/**
 * Roll a set of batches up into the buckets the inventory page surfaces. Pass an
 * explicit `now` for deterministic tests; defaults to the current time.
 */
export function summarizeBatchRisk(
    batches: InventoryBatch[],
    now: Date = new Date(),
): BatchRiskSummary {
    const risks: BatchRisk[] = batches
        .filter((b) => b.status !== "depleted" && b.quantityRemaining > 0)
        .map((batch) => ({
            batch,
            level: batchRiskLevel(batch, now),
            daysUntilExpiry: daysUntilExpiry(batch, now),
            value: batch.quantityRemaining * (batch.unitCost ?? 0),
        }))
        .sort((a, b) => {
            const byUrgency = LEVEL_URGENCY[a.level] - LEVEL_URGENCY[b.level];
            if (byUrgency !== 0) return byUrgency;
            return a.daysUntilExpiry - b.daysUntilExpiry;
        });

    const critical = risks.filter((r) => r.level === "critical");
    const expiringSoon = risks.filter((r) => r.level === "expiring_soon");
    const expired = risks.filter((r) => r.level === "expired");
    const atRiskValue = [...critical, ...expired].reduce((sum, r) => sum + r.value, 0);

    return { risks, critical, expiringSoon, expired, atRiskValue };
}
