import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
    AlertTriangle,
    Brain,
    ChevronDown,
    Loader2,
    RefreshCw,
    Sparkles,
    X,
} from "lucide-react";

import { useAccount } from "../../account/AccountContext";
import { useAnalyticsSnapshot } from "../../hooks/useAnalyticsSnapshot";
import { computeRevenueAnalytics } from "../../analysis/revenue";
import {
    buildCompanionSummary,
    fetchCompanionSuggestions,
} from "./companionClient";
import type {
    CompanionCategory,
    CompanionSuggestion,
    CompanionUrgency,
} from "./companionClient";

interface ToastMessage {
    id: string;
    message: string;
    type: "success" | "info";
}

const urgencyBadgeClass: Record<CompanionUrgency, string> = {
    now: "bg-rose-100 text-rose-700 border border-rose-200",
    soon: "bg-amber-100 text-amber-700 border border-amber-200",
    idea: "bg-violet-100 text-violet-700 border border-violet-200",
};

const urgencyLabel: Record<CompanionUrgency, string> = {
    now: "Act now",
    soon: "This week",
    idea: "Idea",
};

const categoryLabel: Record<CompanionCategory, string> = {
    revenue: "Revenue",
    menu: "Menu",
    orders: "Orders",
    expenses: "Expenses",
    locations: "Locations",
    operations: "Ops",
};

function getContextKey(pathname: string) {
    if (pathname.startsWith("/dashboard")) return "dashboard";
    if (pathname.startsWith("/orders")) return "orders";
    if (pathname.startsWith("/menu")) return "menu";
    if (pathname.startsWith("/expenses")) return "expenses";
    if (pathname.startsWith("/analytics")) return "analytics";
    if (pathname.startsWith("/locations")) return "locations";
    if (pathname.startsWith("/dev")) return "dev";
    return "default";
}

export function AiCompanion() {
    const location = useLocation();
    const { accountId } = useAccount();
    const [open, setOpen] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [appliedActions, setAppliedActions] = useState<Set<string>>(new Set());
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [suggestions, setSuggestions] = useState<CompanionSuggestion[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    // The context key the current result (success OR error) was resolved for,
    // so we can derive the loading flag without a synchronous setState.
    const [resolvedKey, setResolvedKey] = useState<string | null>(null);
    const [retryNonce, setRetryNonce] = useState(0);

    const contextKey = useMemo(
        () => getContextKey(location.pathname),
        [location.pathname],
    );

    // Only load the account's analytics once the panel is open, so we don't
    // fetch Firestore data (or spend tokens) on every authenticated page view.
    const { snapshot, loading: snapshotLoading } = useAnalyticsSnapshot(
        open ? accountId : null,
    );
    const hasData = snapshot.orders.length > 0;

    const summary = useMemo(
        () =>
            hasData
                ? buildCompanionSummary(computeRevenueAnalytics(snapshot))
                : null,
        [snapshot, hasData],
    );

    // Loading whenever the panel is open and we're still resolving insights for
    // the current route (snapshot loading, or the LLM request in flight).
    const loadingInsights =
        open &&
        ((snapshotLoading && accountId !== null) ||
            (summary !== null && resolvedKey !== contextKey));

    const unappliedCount = suggestions.filter(
        (suggestion) => !appliedActions.has(suggestion.id),
    ).length;

    // Fetch route-aware AI insights when the panel is open and we have data.
    // There is no static fallback — errors surface in the UI.
    useEffect(() => {
        if (!open || !summary) {
            return;
        }

        const controller = new AbortController();

        fetchCompanionSuggestions(contextKey, summary, controller.signal)
            .then((result) => {
                setSuggestions(result);
                setErrorMessage(null);
                setResolvedKey(contextKey);
            })
            .catch((error: unknown) => {
                if (
                    controller.signal.aborted ||
                    (error instanceof DOMException && error.name === "AbortError")
                ) {
                    return;
                }
                console.error("Failed to load AI companion insights", error);
                setSuggestions([]);
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Something went wrong generating insights.",
                );
                setResolvedKey(contextKey);
            });

        return () => controller.abort();
    }, [open, contextKey, summary, retryNonce]);

    useEffect(() => {
        if (toasts.length === 0) return;

        const timeoutId = window.setTimeout(() => {
            setToasts((current) => current.slice(1));
        }, 3500);

        return () => window.clearTimeout(timeoutId);
    }, [toasts]);

    function addToast(message: string, type: ToastMessage["type"]) {
        setToasts((current) => [
            ...current,
            { id: `${Date.now()}-${current.length}`, message, type },
        ]);
    }

    function retryInsights() {
        setErrorMessage(null);
        setResolvedKey(null);
        setRetryNonce((nonce) => nonce + 1);
    }

    function handleAction(suggestion: CompanionSuggestion) {
        setAppliedActions((current) => new Set(current).add(suggestion.id));
        setExpandedId(null);
        addToast(`Dismissed "${suggestion.title}".`, "info");
    }

    const showEmptyNoData =
        open && !loadingInsights && !errorMessage && summary === null;
    const showEmptyNoSuggestions =
        open &&
        !loadingInsights &&
        !errorMessage &&
        summary !== null &&
        suggestions.length === 0;

    return (
        <>
            <div className="pointer-events-none fixed right-4 top-20 z-[60] flex max-w-sm flex-col gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-lg ${
                            toast.type === "success"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-slate-200 bg-white text-slate-700"
                        }`}
                    >
                        <div className="flex items-start gap-2">
                            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{toast.message}</span>
                        </div>
                    </div>
                ))}
            </div>

            {!open && (
                <button
                    type="button"
                    onClick={() => {
                        setOpen(true);
                    }}
                    className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-xl transition hover:scale-[1.02] hover:shadow-2xl"
                >
                    <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                        <Brain className="h-5 w-5" />
                        {unappliedCount > 0 && (
                            <span
                                className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 animate-pulse items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white"
                            >
                                {unappliedCount}
                            </span>
                        )}
                    </span>
                    <span className="hidden sm:inline">AI Companion</span>
                    <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-white/90">
                        AI
                    </span>
                </button>
            )}

            {open && (
                <div className="fixed bottom-0 right-0 z-50 flex w-full flex-col overflow-hidden border border-slate-200 bg-white shadow-2xl sm:bottom-6 sm:right-6 sm:max-h-[calc(100vh-7rem)] sm:w-[420px] sm:rounded-3xl">
                    <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-4 text-white">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                                    <Brain className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white/80">
                                        AI Companion
                                    </h3>
                                    <p className="mt-1 text-lg font-semibold">
                                        {loadingInsights
                                            ? "Analyzing your data…"
                                            : errorMessage
                                              ? "Couldn't load insights"
                                              : suggestions.length > 0
                                                ? `${unappliedCount} live suggestion${
                                                      unappliedCount === 1 ? "" : "s"
                                                  }`
                                                : "No suggestions yet"}
                                    </p>
                                    <p className="mt-1 text-sm text-teal-50">
                                        Generated by Claude from your live orders,
                                        menu, and expenses.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                                aria-label="Close AI companion"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto p-4">
                        {loadingInsights && (
                            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 shadow-sm">
                                <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                                <span>Analyzing your latest data…</span>
                            </div>
                        )}

                        {!loadingInsights && errorMessage && (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold">
                                            Couldn&apos;t generate insights
                                        </p>
                                        <p className="mt-1 leading-6 text-rose-700">
                                            {errorMessage}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={retryInsights}
                                            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                            Try again
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showEmptyNoData && (
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-600 shadow-sm">
                                <Sparkles className="mx-auto mb-2 h-5 w-5 text-teal-600" />
                                <p className="font-semibold text-slate-800">
                                    No orders to analyze yet
                                </p>
                                <p className="mt-1 leading-6">
                                    Once this account has orders, the companion
                                    will generate live, data-backed suggestions.
                                </p>
                            </div>
                        )}

                        {showEmptyNoSuggestions && (
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-600 shadow-sm">
                                <p className="font-semibold text-slate-800">
                                    Nothing to flag right now
                                </p>
                                <p className="mt-1 leading-6">
                                    The data looks steady. Check back after more
                                    orders come in.
                                </p>
                                <button
                                    type="button"
                                    onClick={retryInsights}
                                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Refresh
                                </button>
                            </div>
                        )}

                        {!loadingInsights &&
                            !errorMessage &&
                            suggestions.map((suggestion) => {
                                const applied = appliedActions.has(suggestion.id);
                                const expanded = expandedId === suggestion.id;

                                return (
                                    <div
                                        key={suggestion.id}
                                        className={`rounded-2xl border transition ${
                                            applied
                                                ? "border-slate-200 bg-slate-50 opacity-75"
                                                : "border-slate-200 bg-white shadow-sm"
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setExpandedId((current) =>
                                                    current === suggestion.id ? null : suggestion.id,
                                                )
                                            }
                                            className="w-full px-4 py-4 text-left"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="text-2xl">{suggestion.icon}</div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${urgencyBadgeClass[suggestion.urgency]}`}
                                                        >
                                                            {urgencyLabel[suggestion.urgency]}
                                                        </span>
                                                        <span className="text-xs font-medium text-slate-500">
                                                            {categoryLabel[suggestion.category]}
                                                        </span>
                                                        <span className="ml-auto text-xs font-semibold text-teal-700">
                                                            {suggestion.projectedValue}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <div className="min-w-0 flex-1">
                                                            <h4 className="text-sm font-semibold text-slate-900">
                                                                {suggestion.title}
                                                            </h4>
                                                            <p className="mt-1 text-sm leading-6 text-slate-600">
                                                                {suggestion.description}
                                                            </p>
                                                        </div>
                                                        <ChevronDown
                                                            className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition ${
                                                                expanded ? "rotate-180" : ""
                                                            }`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </button>

                                        {expanded && (
                                            <div className="border-t border-slate-200 px-4 py-4">
                                                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                                    {suggestion.detail}
                                                </p>

                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {suggestion.actions.map((action) => (
                                                        <button
                                                            key={action.effect}
                                                            type="button"
                                                            onClick={() =>
                                                                handleAction(suggestion)
                                                            }
                                                            disabled={applied}
                                                            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                                                                action.style === "primary"
                                                                    ? "bg-teal-600 text-white hover:bg-teal-700 disabled:bg-slate-300"
                                                                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-400"
                                                            }`}
                                                        >
                                                            {applied && action.style === "primary"
                                                                ? "Applied"
                                                                : action.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}
        </>
    );
}
