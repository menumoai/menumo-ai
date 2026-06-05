import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Brain, ChevronDown, Sparkles, X } from "lucide-react";

type CompanionActionStyle = "primary" | "secondary";
type CompanionCategory =
    | "revenue"
    | "menu"
    | "orders"
    | "expenses"
    | "locations"
    | "operations";
type CompanionUrgency = "now" | "soon" | "idea";

interface SuggestionAction {
    label: string;
    style: CompanionActionStyle;
    effect: string;
}

interface CompanionSuggestion {
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

interface ToastMessage {
    id: string;
    message: string;
    type: "success" | "info";
}

const DEMO_ENABLED =
    import.meta.env.DEV || import.meta.env.VITE_AI_COMPANION_DEMO === "true";

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

const suggestionsByContext: Record<string, CompanionSuggestion[]> = {
    dashboard: [
        {
            id: "dashboard-lunch-prep",
            icon: "🌮",
            title: "Lunch rush looks heavier than usual",
            description:
                "Demo forecast suggests prepping one extra birria pan before 11:30 so the line keeps moving through the noon peak.",
            detail:
                "This is a demo suggestion tied to the dashboard view. In a real version, it would look at order timing, item mix, and day-over-day lunch demand before recommending a prep move.",
            projectedValue: "+8 to 12 faster orders",
            category: "operations",
            urgency: "now",
            actions: [
                { label: "Mark as prep plan", style: "primary", effect: "prep_plan" },
                { label: "Dismiss", style: "secondary", effect: "dismiss" },
            ],
        },
        {
            id: "dashboard-price-nudge",
            icon: "💸",
            title: "Birria Taco can likely take a small price nudge",
            description:
                "Try a demo +$0.50 test on your strongest seller and watch whether the average ticket rises without changing conversion.",
            detail:
                "The real production version would pair revenue trends with item-level margin. For now this is a demo insight meant to show how the assistant could tee up invisible pricing nudges.",
            projectedValue: "+$90/week",
            category: "revenue",
            urgency: "soon",
            actions: [
                { label: "Save experiment note", style: "primary", effect: "save_note" },
                { label: "Show why", style: "secondary", effect: "show_why" },
            ],
        },
    ],
    orders: [
        {
            id: "orders-upsell",
            icon: "🧾",
            title: "Pickup orders are a good upsell window",
            description:
                "Demo pattern: attach chips + drink to orders above one entree and lift ticket size with a one-tap cashier script.",
            detail:
                "This prototype keeps the action local and illustrative. A real version would inspect order composition and identify the highest-converting add-on pairings for your truck.",
            projectedValue: "+$2.40 AOV",
            category: "orders",
            urgency: "soon",
            actions: [
                { label: "Save cashier prompt", style: "primary", effect: "save_prompt" },
                { label: "Dismiss", style: "secondary", effect: "dismiss" },
            ],
        },
        {
            id: "orders-batch-prep",
            icon: "⏱️",
            title: "Batch one high-volume item before the next wave",
            description:
                "Demo suggestion: pre-stage tortillas and consommé cups now so prep time stays tight when a cluster of pickup orders lands.",
            detail:
                "This is route-aware demo guidance for the orders workflow. A live version would watch recent cadence and prep-time data before nudging the team.",
            projectedValue: "-45 sec per order",
            category: "operations",
            urgency: "now",
            actions: [
                { label: "Mark ready", style: "primary", effect: "prep_ready" },
                { label: "Dismiss", style: "secondary", effect: "dismiss" },
            ],
        },
    ],
    menu: [
        {
            id: "menu-combo",
            icon: "🔥",
            title: "A simple combo could surface your best seller",
            description:
                "Bundle Birria Taco + Street Corn for a demo featured combo so the menu does more of the upsell work for you.",
            detail:
                "The prototype mirrors the light-touch combo idea from Profitpilot but reframes it for Menumo AI's menu workflow. No real menu changes happen yet.",
            projectedValue: "+$140/week",
            category: "menu",
            urgency: "idea",
            actions: [
                { label: "Save combo idea", style: "primary", effect: "save_combo" },
                { label: "Dismiss", style: "secondary", effect: "dismiss" },
            ],
        },
        {
            id: "menu-anchor-price",
            icon: "📋",
            title: "Feature one high-margin item near the top",
            description:
                "Move a strong-margin item into your top three menu slots and pair it with a subtle +$0.25 or +$0.50 test.",
            detail:
                "This suggestion stays within the 'small nudge' pattern from the original prototype. In production it would be backed by item-level contribution margin and conversion data.",
            projectedValue: "+3% item mix share",
            category: "revenue",
            urgency: "soon",
            actions: [
                { label: "Save display note", style: "primary", effect: "save_display" },
                { label: "Show why", style: "secondary", effect: "show_why" },
            ],
        },
    ],
    expenses: [
        {
            id: "expenses-packaging",
            icon: "📦",
            title: "Packaging costs deserve a quick audit",
            description:
                "Demo cue: if takeout volume is climbing, compare container spend against recent revenue growth before it quietly erodes margin.",
            detail:
                "This is intentionally plain-English and action-light. A real version would compare expense categories against order mix and surface outliers automatically.",
            projectedValue: "Protect 1 to 2 margin points",
            category: "expenses",
            urgency: "soon",
            actions: [
                { label: "Add audit reminder", style: "primary", effect: "add_reminder" },
                { label: "Dismiss", style: "secondary", effect: "dismiss" },
            ],
        },
        {
            id: "expenses-portioning",
            icon: "🥄",
            title: "Tighten portioning on one costly ingredient",
            description:
                "Pick one protein or topping this week and spot-check scoop consistency so food cost drift does not compound.",
            detail:
                "This mirrors the prototype's waste-conscious tone while keeping the suggestion relevant to Menumo AI's current expense tooling.",
            projectedValue: "Less waste",
            category: "operations",
            urgency: "idea",
            actions: [
                { label: "Save ops note", style: "primary", effect: "save_note" },
                { label: "Dismiss", style: "secondary", effect: "dismiss" },
            ],
        },
    ],
    analytics: [
        {
            id: "analytics-lunch-window",
            icon: "📈",
            title: "The strongest revenue window should shape staffing",
            description:
                "If lunch is carrying the week, shift setup earlier and get one more pair of hands ready right before the peak.",
            detail:
                "This is demo analysis surfaced on the analytics page. A real version would derive the recommendation from hourly revenue concentration and recent order throughput.",
            projectedValue: "+5 to 8 served orders",
            category: "revenue",
            urgency: "soon",
            actions: [
                { label: "Save staffing note", style: "primary", effect: "save_staffing" },
                { label: "Show why", style: "secondary", effect: "show_why" },
            ],
        },
        {
            id: "analytics-mix",
            icon: "⭐",
            title: "One side item could ride your hero item’s demand",
            description:
                "Attach your highest-margin side to the product already winning share instead of spreading promos across the full menu.",
            detail:
                "The assistant is using a focused, practical pattern here: find the winner, then piggyback on it. That makes the prototype feel specific without needing backend AI orchestration.",
            projectedValue: "+$60/week",
            category: "menu",
            urgency: "idea",
            actions: [
                { label: "Save pairing note", style: "primary", effect: "save_pairing" },
                { label: "Dismiss", style: "secondary", effect: "dismiss" },
            ],
        },
    ],
    locations: [
        {
            id: "locations-extend-shift",
            icon: "📍",
            title: "One stop may deserve a longer window",
            description:
                "If a spot consistently stays busy late, extend service by 30 to 45 minutes before adding a whole new location.",
            detail:
                "This keeps the prototype grounded in a truck operator decision: maximize the winner before splitting focus. A real model would compare foot-traffic and order density by location.",
            projectedValue: "+$110/shift",
            category: "locations",
            urgency: "idea",
            actions: [
                { label: "Save route note", style: "primary", effect: "save_route" },
                { label: "Dismiss", style: "secondary", effect: "dismiss" },
            ],
        },
    ],
    dev: [
        {
            id: "dev-seed-data",
            icon: "🛠️",
            title: "Seed a fuller demo account for better AI previews",
            description:
                "The companion works best with a realistic menu, several recent orders, and a few expense rows loaded into the demo account.",
            detail:
                "This dev-only suggestion acknowledges the current prototype setup and helps testers understand how to make the companion feel more alive during QA.",
            projectedValue: "Higher-fidelity demo",
            category: "operations",
            urgency: "now",
            actions: [
                { label: "Got it", style: "primary", effect: "acknowledge" },
                { label: "Dismiss", style: "secondary", effect: "dismiss" },
            ],
        },
    ],
    default: [
        {
            id: "default-context",
            icon: "✨",
            title: "This companion is route-aware and demo-backed",
            description:
                "Move through Menu, Orders, Dashboard, Expenses, Analytics, or Locations to see context-specific suggestions.",
            detail:
                "This first Menumo AI port intentionally keeps the prototype client-side. The next step would be replacing handwritten suggestions with heuristics or a real model pipeline.",
            projectedValue: "Prototype ready",
            category: "operations",
            urgency: "idea",
            actions: [
                { label: "Understood", style: "primary", effect: "acknowledge" },
                { label: "Dismiss", style: "secondary", effect: "dismiss" },
            ],
        },
    ],
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

function getSuccessMessage(effect: string) {
    const messages: Record<string, string> = {
        acknowledge: "Noted. The companion will stay tucked away until you need it.",
        add_reminder: "Audit reminder saved to your demo workflow.",
        prep_plan: "Prep plan note saved for the next rush.",
        prep_ready: "Prep checkpoint marked as ready.",
        save_combo: "Combo idea saved to the demo playbook.",
        save_display: "Menu display note saved.",
        save_note: "Ops note saved to the demo workflow.",
        save_pairing: "Pairing idea saved for review.",
        save_prompt: "Cashier prompt saved.",
        save_route: "Route note saved.",
        save_staffing: "Staffing note saved.",
        show_why: "This demo version does not expose the full reasoning trace yet.",
    };

    return messages[effect] ?? "Demo action saved.";
}

export function AiCompanion() {
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [appliedActions, setAppliedActions] = useState<Set<string>>(new Set());
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const suggestions = useMemo(() => {
        const contextKey = getContextKey(location.pathname);
        return suggestionsByContext[contextKey] ?? suggestionsByContext.default;
    }, [location.pathname]);

    const unappliedCount = suggestions.filter(
        (suggestion) => !appliedActions.has(suggestion.id),
    ).length;

    useEffect(() => {
        if (toasts.length === 0) return;

        const timeoutId = window.setTimeout(() => {
            setToasts((current) => current.slice(1));
        }, 3500);

        return () => window.clearTimeout(timeoutId);
    }, [toasts]);

    if (!DEMO_ENABLED) {
        return null;
    }

    function addToast(message: string, type: ToastMessage["type"]) {
        setToasts((current) => [
            ...current,
            { id: `${Date.now()}-${current.length}`, message, type },
        ]);
    }

    function handleAction(suggestion: CompanionSuggestion, effect: string) {
        if (effect === "dismiss") {
            setAppliedActions((current) => new Set(current).add(suggestion.id));
            addToast(`Dismissed "${suggestion.title}".`, "info");
            return;
        }

        if (effect === "show_why") {
            addToast(getSuccessMessage(effect), "info");
            return;
        }

        setAppliedActions((current) => new Set(current).add(suggestion.id));
        setExpandedId(null);
        addToast(getSuccessMessage(effect), "success");
    }

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
                        Demo
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
                                        {unappliedCount} route-aware demo suggestion
                                        {unappliedCount === 1 ? "" : "s"}
                                    </p>
                                    <p className="mt-1 text-sm text-teal-50">
                                        Visible in dev or when
                                        {" "}
                                        <code className="rounded bg-white/15 px-1.5 py-0.5 text-[11px]">
                                            VITE_AI_COMPANION_DEMO=true
                                        </code>
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

                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-600">
                        This first port keeps suggestions client-side and demo-backed while adapting the
                        Profitpilot prototype to Menumo AI&apos;s authenticated shell.
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto p-4">
                        {suggestions.map((suggestion) => {
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
                                                            handleAction(suggestion, action.effect)
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
