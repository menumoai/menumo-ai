export function toDate(value: unknown): Date {
    if (value instanceof Date) return value;

    if (
        value &&
        typeof value === "object" &&
        "toDate" in value &&
        typeof (value as { toDate?: unknown }).toDate === "function"
    ) {
        return (value as { toDate: () => Date }).toDate();
    }

    return new Date(value as string | number | Date);
}

export function startOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

export function endOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(23, 59, 59, 999);
    return copy;
}

export function addDays(date: Date, days: number): Date {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
}

export function isWithinRange(date: Date, start: Date, end: Date): boolean {
    return date >= start && date <= end;
}

export function formatDayLabel(date: Date): string {
    return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function formatShortDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}
