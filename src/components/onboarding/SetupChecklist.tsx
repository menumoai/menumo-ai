// src/components/onboarding/SetupChecklist.tsx
//
// Two modes off one component, which is the whole trick of this page:
//   preview - what a visitor sees before signing up, with time estimates
//   live    - the same list after signup, ticked from real account data
// The promise and the delivery are literally the same component.

import { Link } from "react-router-dom";
import { Check, HelpCircle } from "lucide-react";
import type { OnboardingStep } from "../../hooks/useOnboardingProgress";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../ui/popover";

/**
 * "What does this mean?" for a single step.
 *
 * Built on Popover rather than Tooltip on purpose: Radix tooltips do not open on
 * touch, and a food-truck owner is usually on a phone. Click/tap works on every
 * input, and the trigger is a real button so keyboard and screen readers get it
 * too. Only rendered while a step is open - once it is done, the explanation is
 * noise and the row should stay quiet.
 */
function StepHelp({ title, help }: { title: string; help: string }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label={`What does "${title}" mean?`}
                    className="shrink-0 rounded-full p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-[#4A7C70] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4A7C70]"
                >
                    <HelpCircle className="h-4 w-4" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="start"
                className="w-[min(20rem,calc(100vw-2rem))] text-sm leading-relaxed"
            >
                <p className="mb-1 font-semibold text-gray-900">{title}</p>
                <p className="text-gray-600">{help}</p>
            </PopoverContent>
        </Popover>
    );
}

interface Props {
    steps: readonly OnboardingStep[];
    /** Preview mode renders time estimates and no ticks or links. */
    preview?: boolean;
    completed?: number;
}

export function SetupChecklist({ steps, preview = false, completed = 0 }: Props) {
    const total = steps.length;
    const nextId = steps.find((s) => !s.done)?.id;
    const pct = total ? Math.round((completed / total) * 100) : 0;

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-4">
                {preview ? (
                    <>
                        <h3 className="font-semibold text-gray-900">
                            Setting up takes about ten minutes
                        </h3>
                        <p className="mt-0.5 text-sm text-gray-500">
                            These five steps become your checklist as soon as you sign up.
                        </p>
                    </>
                ) : (
                    <>
                        <h3 className="font-semibold text-gray-900">Your setup</h3>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {completed} of {total} done
                            {completed < total && " · pick up where you left off"}
                        </p>
                        <div
                            className="mt-2.5 h-1.5 w-full max-w-[260px] overflow-hidden rounded-full bg-gray-200"
                            role="progressbar"
                            aria-valuenow={completed}
                            aria-valuemin={0}
                            aria-valuemax={total}
                            aria-label="Setup progress"
                        >
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-[#5B9A8B] to-[#4A7C70] transition-all duration-500"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </>
                )}
            </div>

            <ol className="divide-y divide-gray-200">
                {steps.map((step, i) => {
                    const isNext = !preview && step.id === nextId;

                    return (
                        <li key={step.id} className="flex items-center gap-3 px-5 py-3">
                            <span
                                aria-hidden="true"
                                className={[
                                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                                    step.done
                                        ? "border-[#4A7C70] bg-[#4A7C70] text-white"
                                        : isNext
                                          ? "border-[#D94C3D] bg-white text-[#D94C3D]"
                                          : "border-gray-300 bg-white text-gray-500",
                                ].join(" ")}
                            >
                                {step.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                            </span>

                            <div className="min-w-0 flex-1">
                                <p
                                    className={[
                                        "flex items-center gap-1.5 text-sm font-semibold",
                                        step.done
                                            ? "text-gray-400 line-through"
                                            : "text-gray-900",
                                    ].join(" ")}
                                >
                                    {step.title}
                                    {/* Explanation disappears once the step is
                                        done - they already know what it meant. */}
                                    {!step.done && (
                                        <StepHelp
                                            title={step.title}
                                            help={step.help}
                                        />
                                    )}
                                </p>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    {step.done ? step.doneBlurb : step.blurb}
                                </p>
                            </div>

                            {preview ? (
                                <span className="shrink-0 rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-500">
                                    {step.estimate}
                                </span>
                            ) : (
                                <Link
                                    to={step.route}
                                    className={[
                                        "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                                        isNext
                                            ? "bg-[#D94C3D] text-white hover:opacity-90"
                                            : "border border-gray-200 text-[#4A7C70] hover:bg-gray-50",
                                    ].join(" ")}
                                >
                                    {step.done ? "Review" : isNext ? "Start" : "Open"}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
