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
    TAX_YEAR,
    type FilingStatus,
    type TaxProfile,
} from "../../analysis/tax";

interface Props {
    open: boolean;
    initial: TaxProfile | null;
    saving: boolean;
    onClose: () => void;
    onSave: (profile: TaxProfile) => void;
}

export function TaxProfileDialog({
    open,
    initial,
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
}: Omit<Props, "open">) {
    const [filingStatus, setFilingStatus] = useState<FilingStatus>(
        initial?.filingStatus ?? DEFAULT_TAX_PROFILE.filingStatus,
    );
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
        onSave({
            filingStatus,
            stateEffectiveRatePct: parsedRate,
            otherHouseholdIncome: parsedOther,
        });
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

                    <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                        Estimates federal self-employment tax, income tax and the QBI
                        deduction using tax year {TAX_YEAR} figures, for a sole
                        proprietor or single-member LLC. It is a set-aside guide, not
                        tax advice, and it does not replace your accountant.
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
