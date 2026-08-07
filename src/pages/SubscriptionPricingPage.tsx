// src/pages/SubscriptionPricingPage.tsx
//
// Where an owner sees what they are on and changes it.
//
// Everything on this page that costs money happens on Stripe: the plan buttons
// redirect to hosted Checkout and "Manage billing" redirects to the Customer
// Portal. That is deliberate - it means cancellation, plan switches, invoices
// and card updates all exist without this app holding a single card number or
// building a single billing form.

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { useAccount } from "../account/AccountContext";
import { resolvePlan } from "../account/entitlements";
import {
    DEFAULT_BILLING_INTERVAL,
    formatPrice,
    getPlan,
    isBillingInterval,
    priceFor,
    TRIAL_DAYS,
    type BillingInterval,
    type PlanId,
} from "../config/plans";
import {
    CapabilityMatrix,
    PlanCards,
} from "../components/onboarding/PlanCards";
import { usePlanCatalog } from "../hooks/usePlanCatalog";
import { openBillingPortal, startCheckout } from "../services/subscription";

/** Reads as a date an owner would recognise, not an ISO string. */
function formatDate(value: { toDate: () => Date } | null | undefined): string {
    if (!value) return "";
    return value.toDate().toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

/**
 * "Renews annually on 5 August 2027", or just the date when the cadence is
 * unknown. Named rather than inlined so the "unknown interval" case cannot leave
 * a stray double space in the sentence.
 */
function renewalLine(
    interval: BillingInterval | null,
    date: string,
): string {
    const cadence =
        interval === "annual" ? "annually " : interval === "monthly" ? "monthly " : "";
    return `Renews ${cadence}on ${date}.`;
}

export function SubscriptionPricingPage() {
    const { accountId, account, loading } = useAccount();
    const { plans, loading: pricesLoading } = usePlanCatalog();
    const [searchParams, setSearchParams] = useSearchParams();

    const [busyPlan, setBusyPlan] = useState<PlanId | null>(null);
    const [portalBusy, setPortalBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // The interval on screen, in precedence order: whatever the owner last
    // clicked, else an explicit `?interval=` carried over from /get-started,
    // else what they are actually billed on, else monthly.
    //
    // Derived rather than held in state and synced, because the account arrives
    // asynchronously: state seeded at mount would be seeded from an account that
    // is not loaded yet, and an effect that corrected it afterwards would fight
    // the owner's own clicks.
    const requestedInterval = searchParams.get("interval");
    const [chosenInterval, setChosenInterval] = useState<BillingInterval | null>(
        null,
    );

    const currentPlan = useMemo(() => resolvePlan(account), [account]);
    const subscription = account?.subscription ?? null;

    // Only claimed once Stripe has actually said so, and only while the
    // subscription is live. `resolvePlan` drops a canceled or past-due account
    // to the floor plan, so carrying the dead subscription's interval through
    // would price that row at an annual figure for a plan they are no longer
    // on, at a cadence they are no longer billed at.
    const subscriptionIsLive =
        subscription?.status === "trial" || subscription?.status === "active";
    const currentInterval =
        subscriptionIsLive ? (subscription?.interval ?? null) : null;

    const interval: BillingInterval =
        chosenInterval ??
        (isBillingInterval(requestedInterval) ? requestedInterval : null) ??
        currentInterval ??
        DEFAULT_BILLING_INTERVAL;

    const checkoutResult = searchParams.get("checkout");

    // Checkout returns here with a query flag. Clear it once read, so a refresh
    // or a shared link does not keep re-announcing a purchase that already
    // happened.
    useEffect(() => {
        if (!checkoutResult) return;
        const timer = setTimeout(() => {
            searchParams.delete("checkout");
            searchParams.delete("session_id");
            setSearchParams(searchParams, { replace: true });
        }, 8000);
        return () => clearTimeout(timer);
    }, [checkoutResult, searchParams, setSearchParams]);

    const handleChoose = async (planId: PlanId) => {
        if (!accountId) return;
        setError(null);
        setBusyPlan(planId);
        try {
            await startCheckout(accountId, planId, interval);
            // No success path to handle: startCheckout navigates away.
        } catch (caught) {
            setBusyPlan(null);
            setError(
                caught instanceof Error
                    ? caught.message
                    : "Could not open checkout.",
            );
        }
    };

    const handleManageBilling = async () => {
        if (!accountId) return;
        setError(null);
        setPortalBusy(true);
        try {
            await openBillingPortal(accountId);
        } catch (caught) {
            setPortalBusy(false);
            setError(
                caught instanceof Error
                    ? caught.message
                    : "Could not open billing settings.",
            );
        }
    };

    if (loading) {
        return (
            <p className="px-6 py-6 text-sm text-slate-600">Loading your plan...</p>
        );
    }

    const plan = getPlan(currentPlan);

    // What to price the current plan at. An account with no subscription is on
    // the trial and has agreed to nothing, so it reads at the monthly rate -
    // which is also the rate the toggle below opens on.
    const billedInterval = currentInterval ?? DEFAULT_BILLING_INTERVAL;

    // The live entry for the plan they are on, which can legitimately be absent:
    // a plan withdrawn from sale in Stripe keeps its existing subscribers, so an
    // owner can be paying for something no longer on the page. Their
    // entitlements are unaffected - `resolvePlan` reads the subscription, not
    // the catalog - so the only thing missing is the headline price, and
    // printing a stale one would be worse than printing none.
    const livePlan = plans.find((p) => p.id === currentPlan) ?? null;
    const livePrice = livePlan ? priceFor(livePlan, billedInterval) : null;

    return (
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
            <header className="py-8">
                <h1
                    className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                >
                    Plan and billing
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Change plan, update your card, or download invoices.
                </p>
            </header>

            {checkoutResult === "success" && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <div className="text-sm text-emerald-900">
                        <p className="font-semibold">You are all set.</p>
                        <p className="mt-0.5 text-emerald-800">
                            Stripe confirms subscriptions in the background, so if
                            the plan below still looks unchanged, give it a few
                            seconds and refresh.
                        </p>
                    </div>
                </div>
            )}

            {checkoutResult === "cancelled" && (
                <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                    Checkout was cancelled. Nothing has been charged and your plan
                    is unchanged.
                </div>
            )}

            {error && (
                <div
                    role="alert"
                    className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
                >
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    <p className="text-sm text-red-900">{error}</p>
                </div>
            )}

            {/* Current state, stated plainly. An owner should be able to answer
                "what am I paying and when" without opening Stripe. */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            Current plan
                        </p>
                        <p
                            className="mt-1 text-xl font-semibold text-gray-900"
                            style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                            {livePlan?.name ?? plan.name}
                            {!pricesLoading && livePrice !== null && (
                                <span className="ml-2 text-sm font-normal text-gray-500">
                                    {formatPrice(livePrice)}
                                    {billedInterval === "annual" ? "/yr" : "/mo"}
                                </span>
                            )}
                        </p>

                        {!subscription && (
                            <p className="mt-1.5 text-sm text-gray-500">
                                You are on the {TRIAL_DAYS}-day trial. Pick a plan
                                below whenever you are ready - no card is needed
                                until you do.
                            </p>
                        )}

                        {subscription?.status === "trial" && (
                            <p className="mt-1.5 text-sm text-gray-500">
                                Trial ends {formatDate(subscription.trialEndsAt)}.
                            </p>
                        )}

                        {subscription?.status === "active" &&
                            (subscription.cancelAtPeriodEnd ? (
                                <p className="mt-1.5 text-sm text-amber-700">
                                    Cancels on{" "}
                                    {formatDate(subscription.currentPeriodEnd)}. You
                                    keep everything until then.
                                </p>
                            ) : (
                                <p className="mt-1.5 text-sm text-gray-500">
                                    {renewalLine(
                                        currentInterval,
                                        formatDate(subscription.currentPeriodEnd),
                                    )}
                                </p>
                            ))}

                        {subscription?.status === "past_due" && (
                            <p className="mt-1.5 text-sm text-red-700">
                                Your last payment did not go through. Update your
                                card to restore your full plan.
                            </p>
                        )}

                        {subscription?.status === "canceled" && (
                            <p className="mt-1.5 text-sm text-gray-500">
                                Your subscription has ended. Your data is safe
                                and your day-to-day tools stay available - pick a
                                plan below to restore anything you were paying
                                for on top.
                            </p>
                        )}
                    </div>

                    {/* Only offered once Stripe knows this business. Before the
                        first checkout the portal has nothing to show, and the
                        endpoint would refuse. */}
                    {account?.stripeCustomerId && (
                        <button
                            type="button"
                            onClick={handleManageBilling}
                            disabled={portalBusy}
                            className="flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {portalBusy ? (
                                <Loader2
                                    aria-hidden="true"
                                    className="h-4 w-4 animate-spin"
                                />
                            ) : (
                                <CreditCard aria-hidden="true" className="h-4 w-4" />
                            )}
                            {portalBusy ? "Opening..." : "Manage billing"}
                        </button>
                    )}
                </div>
            </section>

            <div className="mt-8">
                <PlanCards
                    signedIn
                    plans={plans}
                    pricesLoading={pricesLoading}
                    currentPlan={currentPlan}
                    currentInterval={currentInterval}
                    onChoose={handleChoose}
                    busyPlan={busyPlan}
                    interval={interval}
                    onIntervalChange={setChosenInterval}
                />
            </div>

            <div className="mt-8">
                <h2 className="mb-3 text-sm font-semibold text-gray-900">
                    What each plan includes
                </h2>
                <CapabilityMatrix
                    plans={plans}
                    interval={interval}
                    pricesLoading={pricesLoading}
                />
            </div>
        </div>
    );
}
