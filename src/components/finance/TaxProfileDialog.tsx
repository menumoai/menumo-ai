// src/components/finance/TaxProfileDialog.tsx
//
// Collects the three inputs the tax estimate cannot derive from Firestore.
// Everything else on /finance comes from the account's own orders and expenses;
// these are the facts only the owner knows.

import { useState } from "react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import {
    DEFAULT_TAX_PROFILE,
    FILING_STATUS_LABELS,
    type TaxFigures,
    type FilingStatus,
    type TaxProfile,
} from "../../analysis/tax";

interface Props {
    open: boolean;
    initial: TaxProfile | null;
    /** Figures currently driving the estimate: the owner's, or our defaults. */
    figures: TaxFigures;
    /** True once a person has recorded that they checked the figures. */
    verified: boolean;
    saving: boolean;
    onClose: () => void;
    /** `figures` is null when the owner did not confirm them this time. */
    onSave: (profile: TaxProfile, figures: TaxFigures | null) => void;
}

export function TaxProfileDialog({
    open,
    initial,
    figures,
    verified,
    saving,
    onClose,
    onSave,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="sm:max-w-lg">
                {/* Keyed so reopening remounts the form against the saved
                    profile. Resetting via an effect would mean a setState
                    inside useEffect, which is exactly the cascading-render
                    pattern react-hooks warns about. */}
                <TaxProfileForm
                    key={open ? JSON.stringify(initial ?? "new") : "closed"}
                    initial={initial}
                    saving={saving}
                    onClose={onClose}
                    onSave={onSave}
                    figures={figures}
                    verified={verified}
                />
            </DialogContent>
        </Dialog>
    );
}

function TaxProfileForm({
    initial,
    saving,
    onClose,
    onSave,
    figures,
    verified,
}: Omit<Props, "open">) {
    const [filingStatus, setFilingStatus] = useState<FilingStatus>(
        initial?.filingStatus ?? DEFAULT_TAX_PROFILE.filingStatus,
    );
    const [standardDeduction, setStandardDeduction] = useState(
        String(figures.standardDeduction),
    );
    const [ssWageBase, setSsWageBase] = useState(String(figures.ssWageBase));
    const [brackets, setBrackets] = useState(() =>
        figures.brackets.map((b) => ({ ...b })),
    );
    const [confirmed, setConfirmed] = useState(verified);

    const updateBracket = (index: number, raw: string) => {
        const parsed = Number.parseFloat(raw.replace(/[^0-9.]/g, ""));
        setBrackets((prev) =>
            prev.map((b, i) =>
                i === index && Number.isFinite(parsed) ? { ...b, upTo: parsed } : b,
            ),
        );
    };

    const [stateRate, setStateRate] = useState(
        String(initial?.stateEffectiveRatePct ?? ""),
    );
    const [otherIncome, setOtherIncome] = useState(
        String(initial?.otherHouseholdIncome ?? ""),
    );
    const [error, setError] = useState<string | null>(null);

    const parsedRate = stateRate.trim() === "" ? 0 : Number(stateRate);
    const parsedOther = otherIncome.trim() === "" ? 0 : Number(otherIncome);

    const rateValid =
        Number.isFinite(parsedRate) && parsedRate >= 0 && parsedRate <= 20;
    const otherValid = Number.isFinite(parsedOther) && parsedOther >= 0;
    const canSave = rateValid && otherValid && !saving;

    function handleSave() {
        if (!rateValid) {
            setError("State rate should be a percentage between 0 and 20.");
            return;
        }
        if (!otherValid) {
            setError("Other household income should be 0 or more.");
            return;
        }
        const parsedDeduction = Number.parseFloat(standardDeduction);
        const parsedWageBase = Number.parseFloat(ssWageBase);
        const nextFigures: TaxFigures | null = confirmed
            ? {
                  ...figures,
                  standardDeduction: Number.isFinite(parsedDeduction)
                      ? parsedDeduction
                      : figures.standardDeduction,
                  ssWageBase: Number.isFinite(parsedWageBase)
                      ? parsedWageBase
                      : figures.ssWageBase,
                  brackets,
              }
            : null;

        onSave({
            filingStatus,
            stateEffectiveRatePct: parsedRate,
            otherHouseholdIncome: parsedOther,
        }, nextFigures);
    }

    return (
        <>
                <DialogHeader>
                    <DialogTitle>Tax estimate settings</DialogTitle>
                    <DialogDescription>
                        Three things we cannot read from your sales. They change the
                        estimate a lot, so it is worth getting them roughly right.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div>
                        <label
                            htmlFor="filing-status"
                            className="block text-sm font-medium text-gray-900"
                        >
                            Filing status
                        </label>
                        <select
                            id="filing-status"
                            value={filingStatus}
                            onChange={(e) =>
                                setFilingStatus(e.target.value as FilingStatus)
                            }
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                            {(
                                Object.keys(FILING_STATUS_LABELS) as FilingStatus[]
                            ).map((status) => (
                                <option key={status} value={status}>
                                    {FILING_STATUS_LABELS[status]}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            Sets the brackets and standard deduction.
                        </p>
                    </div>

                    <div>
                        <label
                            htmlFor="state-rate"
                            className="block text-sm font-medium text-gray-900"
                        >
                            State + local income tax rate
                        </label>
                        <div className="mt-1 flex items-center gap-2">
                            <input
                                id="state-rate"
                                type="number"
                                min="0"
                                max="20"
                                step="0.1"
                                inputMode="decimal"
                                value={stateRate}
                                onChange={(e) => setStateRate(e.target.value)}
                                placeholder="0"
                                className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm tabular-nums"
                            />
                            <span className="text-sm text-gray-500">% of profit</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Enter 0 if your state has no income tax (Texas, Florida,
                            Washington, Nevada and others). We ask rather than guess,
                            because rates and local add-ons vary too much to assume.
                        </p>
                    </div>

                    <div>
                        <label
                            htmlFor="other-income"
                            className="block text-sm font-medium text-gray-900"
                        >
                            Other household income
                        </label>
                        <div className="mt-1 flex items-center gap-2">
                            <span className="text-sm text-gray-500">$</span>
                            <input
                                id="other-income"
                                type="number"
                                min="0"
                                step="1000"
                                inputMode="numeric"
                                value={otherIncome}
                                onChange={(e) => setOtherIncome(e.target.value)}
                                placeholder="0"
                                className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm tabular-nums"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            A day job, a spouse&rsquo;s salary. Truck profit stacks on
                            top, so leaving this out understates your rate.
                        </p>
                    </div>

                    {error && (
                        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </p>
                    )}

                    {/* The statutory figures, on show and editable. Menumo's
                        defaults were transcribed by hand, not taken from an IRS
                        feed, so the person who can actually check them needs to
                        see them and be able to correct them. Confirming stamps
                        verifiedAt, which is what clears the warning on the page. */}
                    <details className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                        <summary className="cursor-pointer text-xs font-semibold text-gray-700">
                            Tax year {figures.taxYear} figures{" "}
                            {verified ? (
                                <span className="font-normal text-teal-700">
                                    · confirmed
                                </span>
                            ) : (
                                <span className="font-normal text-amber-700">
                                    · not yet confirmed
                                </span>
                            )}
                        </summary>

                        <p className="mt-2 text-xs text-gray-600">
                            These drive the estimate. We ship standard federal
                            figures as a starting point, but we have not verified
                            them for your return. Check them against the IRS
                            tables for your filing status and correct anything
                            that is wrong.
                        </p>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <label className="text-xs font-medium text-gray-600">
                                Standard deduction
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={standardDeduction}
                                    onChange={(e) => setStandardDeduction(e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
                                />
                            </label>
                            <label className="text-xs font-medium text-gray-600">
                                Social Security wage base
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={ssWageBase}
                                    onChange={(e) => setSsWageBase(e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
                                />
                            </label>
                        </div>

                        <div className="mt-3">
                            <p className="text-xs font-medium text-gray-600">
                                Income tax brackets
                            </p>
                            <div className="mt-1 space-y-1">
                                {brackets.map((b, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="w-10 text-right font-mono text-xs tabular-nums text-gray-500">
                                            {Math.round(b.rate * 100)}%
                                        </span>
                                        <span className="text-xs text-gray-500">up to</span>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={
                                                Number.isFinite(b.upTo)
                                                    ? String(b.upTo)
                                                    : "no limit"
                                            }
                                            disabled={!Number.isFinite(b.upTo)}
                                            onChange={(e) => updateBracket(i, e.target.value)}
                                            className="w-32 rounded-lg border border-gray-300 px-2 py-1 text-xs tabular-nums text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <label className="mt-3 flex items-start gap-2 text-xs text-gray-700">
                            <input
                                type="checkbox"
                                checked={confirmed}
                                onChange={(e) => setConfirmed(e.target.checked)}
                                className="mt-0.5"
                            />
                            <span>
                                I have checked these figures against the IRS tables
                                for tax year {figures.taxYear}.
                            </span>
                        </label>
                    </details>

                    <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                        Estimates federal self-employment tax, income tax and the QBI
                        deduction for a sole proprietor or single-member LLC. It is a
                        set-aside guide, not tax advice, and it does not replace your
                        accountant.
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="secondary" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!canSave}>
                        {saving ? "Saving…" : "Save"}
                    </Button>
                </DialogFooter>
        </>
    );
}
