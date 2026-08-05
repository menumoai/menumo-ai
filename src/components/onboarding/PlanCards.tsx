// src/components/onboarding/PlanCards.tsx
//
// Plan cards plus the full entitlement matrix. Both read src/config/plans.ts, so
// the cards and the table can never disagree with each other or with the gates.

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
    type Plan,
    type PlanId,
} from "../../config/plans";

interface Props {
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
 * The second line is always rendered, empty when monthly, so switching interval
 * does not change the height of the block and shunt every card's button down.
 */
function PriceBlock({ plan, interval }: { plan: Plan; interval: BillingInterval }) {
    const annual = interval === "annual";

    return (
        <>
            <p className="mt-1.5">
                <span
                    className="text-3xl font-semibold tracking-tight text-gray-900"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                >
                    {formatPrice(priceFor(plan, interval))}
                </span>
                <span className="text-sm text-gray-500">
                    {annual ? "/yr" : "/mo"}
                </span>
            </p>

            <p className="mt-1 min-h-[20px] text-xs text-gray-500">
                {annual && (
                    <>
                        {formatPrice(monthlyEquivalent(plan))}/mo equivalent
                        <span className="ml-1.5 font-semibold text-[#4A7C70]">
                            Save {formatPrice(annualSavings(plan))}
                        </span>
                    </>
                )}
            </p>
        </>
    );
}

export function PlanCards({
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {PLANS.map((plan) => {
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

                            <PriceBlock plan={plan} interval={interval} />

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
                                    disabled={busyPlan !== null}
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
                                    {!signedIn
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
    interval = DEFAULT_BILLING_INTERVAL,
}: {
    /** Which price to print in the header. The rows themselves never differ:
     *  paying yearly buys the same plan, not a different one. */
    interval?: BillingInterval;
} = {}) {
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
                        {PLANS.map((p) => (
                            <th
                                key={p.id}
                                scope="col"
                                className="border-b border-gray-200 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-500"
                            >
                                {p.name}
                                <span className="ml-1 font-mono normal-case tabular-nums text-gray-400">
                                    {formatPrice(priceFor(p, interval))}
                                    {interval === "annual" ? "/yr" : "/mo"}
                                </span>
                            </th>
                        ))}
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
                            {PLANS.map((p) => {
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
