// src/components/onboarding/PlanCards.tsx
//
// Plan cards plus the full entitlement matrix.
//
// Both take the catalog from their caller rather than importing PLANS, so the
// cards and the table always show the same plans at the same prices - including
// when Stripe says a plan has been withdrawn. The capability rows still come
// from code, because those describe what a plan entitles you to rather than
// what it costs.

import { Check, Loader2, Minus } from "lucide-react";
import {
    ANNUAL_MONTHS_FREE,
    CAPABILITY_MATRIX,
    DEFAULT_BILLING_INTERVAL,
    PLANS,
    PLAN_ORDER,
    TRIAL_DAYS,
    TRIAL_PLAN,
    annualSavings,
    formatPrice,
    monthlyEquivalent,
    priceFor,
    type BillingInterval,
    type CatalogPlan,
    type PlanId,
} from "../../config/plans";

interface Props {
    /** The plans on sale, in ladder order. From `usePlanCatalog`. */
    plans: readonly CatalogPlan[];
    /**
     * True while the live prices are still in flight. The cards render their
     * full shape from fallback copy meanwhile, but hold the price back rather
     * than printing a number they may be about to revise.
     */
    pricesLoading?: boolean;
    /** Signed in: the plan the account is actually on. */
    currentPlan?: PlanId | null;
    /**
     * Signed in: the interval that plan is billed on. Null when Stripe has no
     * opinion yet - a trial before any checkout - in which case whichever
     * interval is on screen counts as the current one.
     */
    currentInterval?: BillingInterval | null;
    /**
     * Signed out this starts a trial; signed in it starts checkout. Either way
     * the card only reports which plan was picked - what that means is the
     * caller's business.
     */
    onChoose: (planId: PlanId) => void;
    signedIn?: boolean;
    /**
     * The interval on screen, owned by the page rather than by this component.
     * The capability matrix below the cards prints prices too, so a toggle that
     * lived in here could only ever move one of the two - and a table reading
     * "$50" under cards reading "$500/yr" is the kind of disagreement that makes
     * an owner distrust the whole page.
     */
    interval: BillingInterval;
    onIntervalChange: (next: BillingInterval) => void;
    /**
     * The plan being sent to Stripe right now. Checkout is a full page
     * navigation, so there is a visible gap between the click and the redirect;
     * without this the card looks inert and invites a second click.
     */
    busyPlan?: PlanId | null;
}

/** Whether moving to `target` from `current` is a step up the price ladder. */
function isUpgrade(current: PlanId | null | undefined, target: PlanId): boolean {
    if (!current) return true;
    return PLAN_ORDER.indexOf(target) > PLAN_ORDER.indexOf(current);
}

/**
 * The monthly/annual switch.
 *
 * Two buttons rather than a checkbox styled as a switch, because "which of these
 * two" is what is being asked and `aria-pressed` states it without the reader
 * having to infer that unchecked means monthly.
 */
function IntervalToggle({
    interval,
    onChange,
}: {
    interval: BillingInterval;
    onChange: (next: BillingInterval) => void;
}) {
    return (
        <div className="mb-5 flex justify-center">
            <div
                role="group"
                aria-label="Billing interval"
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-1"
            >
                {(
                    [
                        ["monthly", "Monthly"],
                        ["annual", "Annual"],
                    ] as const
                ).map(([value, label]) => {
                    const active = interval === value;
                    return (
                        <button
                            key={value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => onChange(value)}
                            className={[
                                "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition",
                                active
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700",
                            ].join(" ")}
                        >
                            {label}
                            {value === "annual" && (
                                <span
                                    className={[
                                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                        active
                                            ? "bg-[#4A7C70] text-white"
                                            : "bg-teal-50 text-[#4A7C70]",
                                    ].join(" ")}
                                >
                                    {ANNUAL_MONTHS_FREE} months free
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * The headline price, and - annually - what it works out to per month.
 *
 * Both lines always occupy their height, whatever state they are in, so
 * switching interval or having prices arrive never shunts every card's button
 * down the page.
 */
function PriceBlock({
    plan,
    interval,
    loading,
}: {
    plan: CatalogPlan;
    interval: BillingInterval;
    loading: boolean;
}) {
    const annual = interval === "annual";
    const price = priceFor(plan, interval);
    const equivalent = monthlyEquivalent(plan);
    const saving = annualSavings(plan);

    if (loading) {
        return (
            <>
                <p className="mt-1.5 flex min-h-[40px] items-center">
                    <span
                        aria-hidden="true"
                        className="inline-block h-8 w-28 animate-pulse rounded bg-gray-200"
                    />
                    <span className="sr-only">Loading price</span>
                </p>
                <p className="mt-1 min-h-[20px]" />
            </>
        );
    }

    // This interval is not on sale. The other one may still be, so the card
    // says which rather than disappearing - a plan silently missing from the
    // grid reads as a bug to anyone who knows it exists.
    if (price === null) {
        return (
            <>
                <p className="mt-1.5 flex min-h-[40px] items-center text-sm font-medium text-gray-500">
                    Not sold {annual ? "annually" : "monthly"}
                </p>
                <p className="mt-1 min-h-[20px] text-xs text-gray-500">
                    {annual ? "Available monthly." : "Available annually."}
                </p>
            </>
        );
    }

    return (
        <>
            <p className="mt-1.5 flex min-h-[40px] items-baseline">
                <span
                    className="text-3xl font-semibold tracking-tight text-gray-900"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                >
                    {formatPrice(price)}
                </span>
                <span className="text-sm text-gray-500">
                    {annual ? "/yr" : "/mo"}
                </span>
            </p>

            <p className="mt-1 min-h-[20px] text-xs text-gray-500">
                {annual && equivalent !== null && (
                    <>
                        {formatPrice(equivalent)}/mo equivalent
                        {saving !== null && (
                            <span className="ml-1.5 font-semibold text-[#4A7C70]">
                                Save {formatPrice(saving)}
                            </span>
                        )}
                    </>
                )}
            </p>
        </>
    );
}

/**
 * Column count, so a withdrawn plan leaves two full-width cards rather than two
 * cards and a gap where the third used to be.
 */
function gridColumns(count: number): string {
    if (count <= 1) return "md:grid-cols-1";
    if (count === 2) return "md:grid-cols-2";
    return "md:grid-cols-3";
}

export function PlanCards({
    plans,
    pricesLoading = false,
    currentPlan,
    currentInterval = null,
    onChoose,
    signedIn = false,
    busyPlan = null,
    interval,
    onIntervalChange,
}: Props) {
    return (
        <>
            <IntervalToggle interval={interval} onChange={onIntervalChange} />

            <div className={`grid grid-cols-1 gap-4 ${gridColumns(plans.length)}`}>
                {plans.map((plan) => {
                    const highlighted = signedIn
                        ? plan.id === currentPlan
                        : plan.id === TRIAL_PLAN;

                    // The plan matches, but the interval on screen may not.
                    // Separating the two is what lets a monthly subscriber move
                    // to the annual price of the plan they are already on -
                    // treating "same plan" as "nothing to do" would make the
                    // annual toggle inert on the exact card most likely to
                    // convert.
                    const samePlan = signedIn && plan.id === currentPlan;
                    const sameInterval =
                        currentInterval == null || currentInterval === interval;

                    // Checkout resolves the price by lookup key and throws when
                    // there is no active one, so offering a button here for an
                    // interval Stripe does not sell would send the owner to an
                    // error rather than to a payment page.
                    const available = priceFor(plan, interval) !== null;

                    return (
                        <div
                            key={plan.id}
                            className={[
                                "relative rounded-2xl border bg-white p-5",
                                highlighted
                                    ? "border-[#4A7C70] ring-2 ring-teal-100"
                                    : "border-gray-200",
                            ].join(" ")}
                        >
                            {highlighted && (
                                <span className="absolute -top-2.5 left-5 rounded-full bg-[#4A7C70] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                    {signedIn ? "Your plan" : "Your trial starts here"}
                                </span>
                            )}

                            <h3
                                className="text-base font-semibold text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                {plan.name}
                            </h3>

                            <PriceBlock
                                plan={plan}
                                interval={interval}
                                loading={pricesLoading}
                            />

                            <p className="mt-1 min-h-[40px] text-sm text-gray-500">
                                {plan.tagline}
                            </p>

                            <ul className="mt-4 space-y-2">
                                {plan.highlights.map((h) => (
                                    <li
                                        key={h}
                                        className="flex gap-2 text-sm leading-snug text-gray-700"
                                    >
                                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4A7C70]" />
                                        {h}
                                    </li>
                                ))}
                            </ul>

                            {samePlan && sameInterval ? (
                                <p className="mt-5 border-t border-gray-100 pt-4 text-center text-sm font-medium text-[#4A7C70]">
                                    Your current plan
                                </p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => onChoose(plan.id)}
                                    disabled={
                                        busyPlan !== null ||
                                        pricesLoading ||
                                        !available
                                    }
                                    className={[
                                        "mt-5 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition",
                                        "disabled:cursor-not-allowed disabled:opacity-60",
                                        highlighted
                                            ? "bg-gradient-to-r from-[#D94C3D] to-[#E67E50] text-white hover:opacity-95"
                                            : "border border-gray-300 text-gray-700 hover:bg-gray-50",
                                    ].join(" ")}
                                >
                                    {busyPlan === plan.id && (
                                        <Loader2
                                            aria-hidden="true"
                                            className="h-3.5 w-3.5 animate-spin"
                                        />
                                    )}
                                    {!available
                                        ? `Not sold ${
                                              interval === "annual"
                                                  ? "annually"
                                                  : "monthly"
                                          }`
                                        : !signedIn
                                          ? "Start free trial"
                                          : busyPlan === plan.id
                                            ? "Opening checkout..."
                                            : samePlan
                                              ? `Switch to ${
                                                    interval === "annual"
                                                        ? "annual"
                                                        : "monthly"
                                                } billing`
                                              : isUpgrade(currentPlan, plan.id)
                                                ? `Upgrade to ${plan.name}`
                                                : `Switch to ${plan.name}`}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
}

export function CapabilityMatrix({
    plans,
    interval = DEFAULT_BILLING_INTERVAL,
    pricesLoading = false,
}: {
    /** The plans to column the table by. A withdrawn plan gets no column. */
    plans: readonly CatalogPlan[];
    /** Which price to print in the header. The rows themselves never differ:
     *  paying yearly buys the same plan, not a different one. */
    interval?: BillingInterval;
    pricesLoading?: boolean;
}) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full min-w-[560px] border-collapse text-sm">
                <caption className="sr-only">
                    What each Menumo plan includes
                </caption>
                <thead>
                    <tr className="bg-gray-50">
                        <th
                            scope="col"
                            className="border-b border-gray-200 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500"
                        >
                            Capability
                        </th>
                        {plans.map((p) => {
                            const price = priceFor(p, interval);
                            return (
                                <th
                                    key={p.id}
                                    scope="col"
                                    className="border-b border-gray-200 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-500"
                                >
                                    {p.name}
                                    {!pricesLoading && price !== null && (
                                        <span className="ml-1 font-mono normal-case tabular-nums text-gray-400">
                                            {formatPrice(price)}
                                            {interval === "annual" ? "/yr" : "/mo"}
                                        </span>
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {CAPABILITY_MATRIX.map((row) => (
                        <tr key={row.label} className="border-b border-gray-100 last:border-0">
                            <th
                                scope="row"
                                className="px-4 py-2.5 text-left font-medium text-gray-800"
                            >
                                {row.label}
                                {row.hint && (
                                    <span className="mt-0.5 block text-[11px] font-normal text-gray-500">
                                        {row.hint}
                                    </span>
                                )}
                            </th>
                            {plans.map((p) => {
                                const v = row.values[p.id];
                                return (
                                    <td
                                        key={p.id}
                                        className="px-4 py-2.5 text-center tabular-nums text-gray-600"
                                    >
                                        {v === true ? (
                                            <>
                                                <Check
                                                    aria-hidden="true"
                                                    className="mx-auto h-4 w-4 text-[#4A7C70]"
                                                />
                                                <span className="sr-only">Included</span>
                                            </>
                                        ) : v === false ? (
                                            <>
                                                <Minus
                                                    aria-hidden="true"
                                                    className="mx-auto h-4 w-4 text-gray-300"
                                                />
                                                <span className="sr-only">Not included</span>
                                            </>
                                        ) : (
                                            v
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export const TRIAL_BLURB = `${TRIAL_DAYS} days of ${
    PLANS.find((p) => p.id === TRIAL_PLAN)?.name ?? "Pro"
}. No card required.`;
