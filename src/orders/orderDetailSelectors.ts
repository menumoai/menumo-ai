import type { Order } from "../models/order";

export const ORDER_STATUS_FLOW: Order["status"][] = [
    "pending",
    "accepted",
    "preparing",
    "ready",
    "completed",
];

export function getNextStatus(status: Order["status"]): Order["status"] | null {
    const idx = ORDER_STATUS_FLOW.indexOf(status);
    if (idx === -1) return null;
    return idx < ORDER_STATUS_FLOW.length - 1 ? ORDER_STATUS_FLOW[idx + 1] : null;
}

export function toDateSafe(value: unknown): Date | null {
    if (!value) return null;
    const anyVal: any = value;
    if (typeof anyVal?.toDate === "function") return anyVal.toDate();
    const d = new Date(anyVal);
    return Number.isNaN(d.getTime()) ? null : d;
}
