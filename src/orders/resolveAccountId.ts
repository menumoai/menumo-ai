export function resolveAccountId(urlAccountId: string | null, contextAccountId?: string | null) {
    return urlAccountId ?? contextAccountId ?? null;
}
