// api/_http.ts
//
// Small request helpers shared by the subscription endpoints.

/**
 * Where Stripe returns the customer to after checkout or the portal.
 *
 * Prefers APP_URL and only falls back to the request's own Origin. Origin is
 * caller-supplied, so taking it unconditionally would let someone mint checkout
 * links that return to a site they control - fine in dev, not on a deploy.
 */
export function resolveBaseUrl(origin: string | undefined): string {
    const configured = process.env.APP_URL;
    if (configured) return configured.replace(/\/$/, "");
    return (origin ?? "http://localhost:5173").replace(/\/$/, "");
}

/** Parses a JSON body without throwing on malformed input. */
export function safeParse(value: string): Record<string, unknown> {
    try {
        const parsed: unknown = JSON.parse(value);
        return parsed && typeof parsed === "object"
            ? (parsed as Record<string, unknown>)
            : {};
    } catch {
        return {};
    }
}

/** Normalises a Vercel/Connect body, which may arrive parsed or as a string. */
export function asBody(value: unknown): Record<string, unknown> {
    if (typeof value === "string") return safeParse(value);
    return value && typeof value === "object"
        ? (value as Record<string, unknown>)
        : {};
}
