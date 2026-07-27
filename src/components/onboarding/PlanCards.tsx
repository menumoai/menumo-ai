// src/components/onboarding/PlanCards.tsx
//
// Plan cards plus the full entitlement matrix. Both read src/config/plans.ts, so
// the cards and the table can never disagree with each other or with the gates.

import { Check, Minus } from "lucide-react";
import {
    CAPABILITY_MATRIX,
    PLANS,
    TRIAL_DAYS,
    TRIAL_PLAN,
    type PlanId,
} from "../../config/plans";

interface Props {
    /** Signed in: the plan the account is actually on. */
    currentPlan?: PlanId | null;
    /** Signed out: every button starts the same trial. */
    onChoose: (planId: PlanId) => void;
    signedIn?: boolean;
}

export function PlanCards({ currentPlan, onChoose, signedIn = false }: Props) {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {PLANS.map((plan) => {
                const highlighted = signedIn
                    ? plan.id === currentPlan
                    : plan.id === TRIAL_PLAN;

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

                        <p className="mt-1.5">
                            <span
                                className="text-3xl font-semibold tracking-tight text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                ${plan.priceMonthly}
                            </span>
                            <span className="text-sm text-gray-500">/mo</span>
                        </p>

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

                        <button
                            type="button"
                            onClick={() => onChoose(plan.id)}
                            className={[
                                "mt-5 w-full rounded-full px-4 py-2.5 text-sm font-semibold transition",
                                highlighted
                                    ? "bg-gradient-to-r from-[#D94C3D] to-[#E67E50] text-white hover:opacity-95"
                                    : "border border-gray-300 text-gray-700 hover:bg-gray-50",
                            ].join(" ")}
                        >
                            {signedIn
                                ? plan.id === currentPlan
                                    ? `Keep ${plan.name}`
                                    : `Switch to ${plan.name}`
                                : "Start free trial"}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

export function CapabilityMatrix() {
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
                                    ${p.priceMonthly}
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
