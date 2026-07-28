// src/components/finance/Contractor1099Panel.tsx
//
// Tracks non-employee payments and generates the recipient copy of a 1099-NEC.
//
// TWO CONSTRAINTS SHAPE THIS, BOTH NON-NEGOTIABLE:
//
// 1. Copy A - the red-ink federal copy - cannot be produced here. The IRS will
//    not accept a Copy A printed from a generic template; it must be an official
//    scannable form or an e-filing (FIRE / IRIS). Anyone filing a printout risks
//    a penalty per form. So this generates Copy B, the recipient's copy, which
//    is explicitly allowed to be a substitute, and shows the exact figures to
//    carry into whatever e-file route the owner uses.
//
// 2. TINs are never stored. See the note in models/contractorPayment.ts: this
//    repo has no Firestore security rules yet, so a persisted SSN would be
//    readable by any authenticated client. The number is typed in, used to
//    render the document, and dropped when the dialog closes.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { AlertCircle, FileText, Plus, Trash2, Users } from "lucide-react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import type { BusinessAccount } from "../../models/account";
import {
    FORM_1099_THRESHOLD_CENTS,
    summarizeContractorYear,
    type ContractorPayment,
    type ContractorYearTotal,
} from "../../models/contractorPayment";
import {
    createContractorPayment,
    deleteContractorPayment,
    listContractorPayments,
} from "../../services/contractorPayment";

function money(cents: number): string {
    return (cents / 100).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
    });
}

interface Props {
    accountId: string | null;
    account: BusinessAccount | null;
    taxYear: number;
}

export function Contractor1099Panel({ accountId, account, taxYear }: Props) {
    const [payments, setPayments] = useState<ContractorPayment[]>([]);
    const [loading, setLoading] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [formTarget, setFormTarget] = useState<ContractorYearTotal | null>(null);

    const reload = useCallback(async () => {
        if (!accountId) return;
        setLoading(true);
        try {
            setPayments(await listContractorPayments(accountId));
        } catch (err) {
            console.error("Failed to load contractor payments", err);
        } finally {
            setLoading(false);
        }
    }, [accountId]);

    useEffect(() => {
        void reload();
    }, [reload]);

    const totals = useMemo(
        () => summarizeContractorYear(payments, taxYear),
        [payments, taxYear],
    );

    const needsFiling = totals.filter((t) => t.requiresForm1099);

    return (
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h3
                        className="flex items-center gap-2 text-xl font-bold text-gray-900"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                        <Users className="h-5 w-5 text-teal-600" />
                        Contractors &amp; 1099s
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {taxYear} payments to non-employees. A 1099-NEC is required
                        once you pay someone {money(FORM_1099_THRESHOLD_CENTS)} or
                        more in a year.
                    </p>
                </div>

                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setAddOpen(true)}
                    disabled={!accountId}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Log a payment
                </Button>
            </div>

            {loading && payments.length === 0 ? (
                <p className="text-sm text-gray-500">Loading contractors…</p>
            ) : totals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-5 text-sm text-gray-500">
                    No contractor payments logged for {taxYear}. Log them here and we
                    will tell you who needs a 1099 and prepare their copy.
                </div>
            ) : (
                <>
                    {needsFiling.length > 0 && (
                        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                            <span>
                                <span className="font-semibold">
                                    {needsFiling.length} contractor
                                    {needsFiling.length === 1 ? "" : "s"} need a
                                    1099-NEC for {taxYear}.
                                </span>{" "}
                                Copy A must be e-filed or submitted on an official IRS
                                form - it cannot be printed from here. Generate the
                                recipient copy below and use those figures to file.
                            </span>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                                    <th className="py-2 pr-4 font-semibold">
                                        Contractor
                                    </th>
                                    <th className="py-2 pr-4 text-right font-semibold">
                                        {taxYear} total
                                    </th>
                                    <th className="py-2 pr-4 text-center font-semibold">
                                        Payments
                                    </th>
                                    <th className="py-2 text-right font-semibold">
                                        1099-NEC
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {totals.map((row) => (
                                    <tr
                                        key={row.contractorName}
                                        className="border-b border-gray-100 last:border-0"
                                    >
                                        <td className="py-3 pr-4">
                                            <div className="font-medium text-gray-900">
                                                {row.contractorName}
                                            </div>
                                            {row.businessName && (
                                                <div className="text-xs text-gray-500">
                                                    {row.businessName}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 pr-4 text-right font-medium tabular-nums text-gray-900">
                                            {money(row.totalCents)}
                                        </td>
                                        <td className="py-3 pr-4 text-center tabular-nums text-gray-500">
                                            {row.paymentCount}
                                        </td>
                                        <td className="py-3 text-right">
                                            {row.requiresForm1099 ? (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => setFormTarget(row)}
                                                >
                                                    <FileText className="mr-2 h-3 w-3" />
                                                    Generate
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-gray-400">
                                                    Under threshold
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <AddPaymentDialog
                open={addOpen}
                accountId={accountId}
                onClose={() => setAddOpen(false)}
                onSaved={() => {
                    setAddOpen(false);
                    void reload();
                }}
            />

            <Generate1099Dialog
                target={formTarget}
                account={account}
                taxYear={taxYear}
                onClose={() => setFormTarget(null)}
            />

            {payments.length > 0 && (
                <PaymentLog
                    payments={payments}
                    taxYear={taxYear}
                    accountId={accountId}
                    onDeleted={reload}
                />
            )}
        </section>
    );
}

function PaymentLog({
    payments,
    taxYear,
    accountId,
    onDeleted,
}: {
    payments: ContractorPayment[];
    taxYear: number;
    accountId: string | null;
    onDeleted: () => void;
}) {
    const [expanded, setExpanded] = useState(false);

    const rows = payments
        .filter((p) => p.paidAt?.toDate?.().getFullYear() === taxYear)
        .sort(
            (a, b) =>
                (b.paidAt?.toDate?.().getTime() ?? 0) -
                (a.paidAt?.toDate?.().getTime() ?? 0),
        );

    if (rows.length === 0) return null;

    return (
        <div className="mt-5 border-t border-gray-100 pt-4">
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-sm font-medium text-teal-700 hover:underline"
            >
                {expanded ? "Hide" : "Show"} individual payments ({rows.length})
            </button>

            {expanded && (
                <ul className="mt-3 space-y-2">
                    {rows.map((p) => (
                        <li
                            key={p.id}
                            className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm"
                        >
                            <span className="flex-1 text-gray-900">
                                {p.contractorName}
                                {p.description && (
                                    <span className="text-gray-500">
                                        {" "}
                                        · {p.description}
                                    </span>
                                )}
                            </span>
                            <span className="tabular-nums text-gray-600">
                                {p.paidAt?.toDate?.().toLocaleDateString()}
                            </span>
                            <span className="font-medium tabular-nums text-gray-900">
                                {money(p.amountCents)}
                            </span>
                            <button
                                type="button"
                                aria-label={`Delete payment to ${p.contractorName}`}
                                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                onClick={async () => {
                                    if (!accountId) return;
                                    try {
                                        await deleteContractorPayment(accountId, p.id);
                                        onDeleted();
                                    } catch (err) {
                                        console.error("Delete failed", err);
                                    }
                                }}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function AddPaymentDialog({
    open,
    accountId,
    onClose,
    onSaved,
}: {
    open: boolean;
    accountId: string | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="sm:max-w-md">
                <AddPaymentForm
                    key={open ? "open" : "closed"}
                    accountId={accountId}
                    onClose={onClose}
                    onSaved={onSaved}
                />
            </DialogContent>
        </Dialog>
    );
}

function AddPaymentForm({
    accountId,
    onClose,
    onSaved,
}: {
    accountId: string | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [name, setName] = useState("");
    const [business, setBusiness] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(() =>
        new Date().toISOString().slice(0, 10),
    );
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const parsedAmount = Number(amount);
    const valid =
        name.trim().length > 0 &&
        amount.trim() !== "" &&
        Number.isFinite(parsedAmount) &&
        parsedAmount > 0 &&
        date !== "";

    async function handleSave() {
        if (!accountId) return;
        if (!valid) {
            setError("Enter a name, a positive amount and a date.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await createContractorPayment({
                accountId,
                contractorName: name.trim(),
                businessName: business.trim() || undefined,
                amountCents: Math.round(parsedAmount * 100),
                currency: "USD",
                paidAt: Timestamp.fromDate(new Date(`${date}T12:00:00`)),
                description: description.trim() || undefined,
            });
            onSaved();
        } catch (err) {
            console.error("Failed to save contractor payment", err);
            setError("Could not save that payment.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle>Log a contractor payment</DialogTitle>
                <DialogDescription>
                    Someone you paid who is not on payroll. We total these per year
                    and flag who needs a 1099-NEC.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
                <Field label="Contractor name" htmlFor="c-name" required>
                    <input
                        id="c-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jordan Reyes"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                </Field>

                <Field label="Business name (optional)" htmlFor="c-biz">
                    <input
                        id="c-biz"
                        value={business}
                        onChange={(e) => setBusiness(e.target.value)}
                        placeholder="Reyes Catering LLC"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                    <Field label="Amount" htmlFor="c-amount" required>
                        <input
                            id="c-amount"
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tabular-nums"
                        />
                    </Field>
                    <Field label="Date paid" htmlFor="c-date" required>
                        <input
                            id="c-date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                    </Field>
                </div>

                <Field label="What for (optional)" htmlFor="c-desc">
                    <input
                        id="c-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Weekend service help"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                </Field>

                <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                    We do not ask for their Social Security or tax ID here. That is
                    collected only when you generate the form, and it is never saved.
                </p>

                {error && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                    </p>
                )}
            </div>

            <DialogFooter>
                <Button variant="secondary" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button onClick={handleSave} disabled={!valid || saving}>
                    {saving ? "Saving…" : "Save payment"}
                </Button>
            </DialogFooter>
        </>
    );
}

function Field({
    label,
    htmlFor,
    required,
    children,
}: {
    label: string;
    htmlFor: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label
                htmlFor={htmlFor}
                className="mb-1 block text-sm font-medium text-gray-900"
            >
                {label}
                {required && <span className="ml-0.5 text-red-600">*</span>}
            </label>
            {children}
        </div>
    );
}

function Generate1099Dialog({
    target,
    account,
    taxYear,
    onClose,
}: {
    target: ContractorYearTotal | null;
    account: BusinessAccount | null;
    taxYear: number;
    onClose: () => void;
}) {
    return (
        <Dialog open={Boolean(target)} onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="sm:max-w-lg">
                {target && (
                    <Generate1099Form
                        key={target.contractorName}
                        target={target}
                        account={account}
                        taxYear={taxYear}
                        onClose={onClose}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

function Generate1099Form({
    target,
    account,
    taxYear,
    onClose,
}: {
    target: ContractorYearTotal;
    account: BusinessAccount | null;
    taxYear: number;
    onClose: () => void;
}) {
    const [payerTin, setPayerTin] = useState("");
    const [recipientTin, setRecipientTin] = useState("");
    const [recipientAddress, setRecipientAddress] = useState("");

    const payerName = account?.legalName || account?.name || "";
    const payerAddress = [
        account?.address1,
        account?.address2,
        [account?.city, account?.state, account?.postalCode]
            .filter(Boolean)
            .join(", "),
    ]
        .filter(Boolean)
        .join("\n");

    const ready =
        payerName.trim() !== "" &&
        payerTin.trim() !== "" &&
        recipientTin.trim() !== "" &&
        recipientAddress.trim() !== "";

    function handlePrint() {
        const win = window.open("", "_blank", "width=820,height=1000");
        if (!win) return;
        win.document.write(
            renderCopyB({
                taxYear,
                payerName,
                payerAddress,
                payerTin: payerTin.trim(),
                recipientName: target.contractorName,
                recipientBusiness: target.businessName,
                recipientAddress: recipientAddress.trim(),
                recipientTin: recipientTin.trim(),
                amountCents: target.totalCents,
            }),
        );
        win.document.close();
        win.focus();
        win.print();
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle>1099-NEC for {target.contractorName}</DialogTitle>
                <DialogDescription>
                    {money(target.totalCents)} in {taxYear}. These details are used to
                    render the form and are never saved.
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    <span className="font-semibold">
                        This produces Copy B, for the contractor.
                    </span>{" "}
                    The federal Copy A cannot be printed from here - the IRS only
                    accepts its own scannable form or an e-filing. Use the figures
                    below when you file.
                </div>

                <Field label="Your business name" htmlFor="p-name">
                    <input
                        id="p-name"
                        value={payerName}
                        readOnly
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                    />
                </Field>

                <Field label="Your EIN or SSN" htmlFor="p-tin" required>
                    <input
                        id="p-tin"
                        value={payerTin}
                        onChange={(e) => setPayerTin(e.target.value)}
                        placeholder="12-3456789"
                        autoComplete="off"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                </Field>

                <Field label="Contractor TIN or SSN" htmlFor="r-tin" required>
                    <input
                        id="r-tin"
                        value={recipientTin}
                        onChange={(e) => setRecipientTin(e.target.value)}
                        placeholder="123-45-6789"
                        autoComplete="off"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                </Field>

                <Field label="Contractor address" htmlFor="r-addr" required>
                    <textarea
                        id="r-addr"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        rows={3}
                        placeholder={"221 Baker St\nAustin, TX 78701"}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                </Field>

                {!payerAddress && (
                    <p className="text-xs text-amber-700">
                        Your business address is not set on the account, so it will be
                        blank on the form.
                    </p>
                )}
            </div>

            <DialogFooter>
                <Button variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button onClick={handlePrint} disabled={!ready}>
                    <FileText className="mr-2 h-4 w-4" />
                    Print Copy B
                </Button>
            </DialogFooter>
        </>
    );
}

/** Standalone printable document. Escaped, since these are free-text fields. */
function renderCopyB(f: {
    taxYear: number;
    payerName: string;
    payerAddress: string;
    payerTin: string;
    recipientName: string;
    recipientBusiness?: string;
    recipientAddress: string;
    recipientTin: string;
    amountCents: number;
}): string {
    const esc = (v: string) =>
        v.replace(/[&<>"']/g, (c) =>
            c === "&"
                ? "&amp;"
                : c === "<"
                  ? "&lt;"
                  : c === ">"
                    ? "&gt;"
                    : c === '"'
                      ? "&quot;"
                      : "&#39;",
        );
    const nl = (v: string) => esc(v).replace(/\n/g, "<br>");

    return `<!doctype html><html><head><meta charset="utf-8">
<title>1099-NEC Copy B ${f.taxYear} - ${esc(f.recipientName)}</title>
<style>
  body{font-family:Georgia,'Times New Roman',serif;margin:32px;color:#111;font-size:13px}
  .doc{max-width:720px;margin:0 auto;border:2px solid #111}
  .hd{display:flex;justify-content:space-between;border-bottom:2px solid #111;padding:10px 14px}
  .hd h1{font-size:17px;margin:0}
  .yr{font-size:22px;font-weight:700}
  .grid{display:grid;grid-template-columns:1fr 1fr}
  .cell{border-right:1px solid #111;border-bottom:1px solid #111;padding:10px 14px;min-height:64px}
  .cell:last-child{border-right:none}
  .lbl{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#444;margin-bottom:4px}
  .val{font-size:14px}
  .box1{border-bottom:1px solid #111;padding:12px 14px;display:flex;justify-content:space-between;align-items:center}
  .amt{font-size:24px;font-weight:700;font-variant-numeric:tabular-nums}
  .note{padding:12px 14px;font-size:10px;color:#333;line-height:1.5}
  @media print{body{margin:0}.noprint{display:none}}
</style></head><body>
<div class="doc">
  <div class="hd">
    <div><h1>Form 1099-NEC</h1><div style="font-size:11px">Nonemployee Compensation &middot; Copy B, for recipient</div></div>
    <div class="yr">${f.taxYear}</div>
  </div>
  <div class="grid">
    <div class="cell"><div class="lbl">Payer name and address</div>
      <div class="val">${esc(f.payerName)}<br>${nl(f.payerAddress)}</div></div>
    <div class="cell"><div class="lbl">Recipient name and address</div>
      <div class="val">${esc(f.recipientName)}${f.recipientBusiness ? `<br>${esc(f.recipientBusiness)}` : ""}<br>${nl(f.recipientAddress)}</div></div>
    <div class="cell"><div class="lbl">Payer TIN</div><div class="val">${esc(f.payerTin)}</div></div>
    <div class="cell"><div class="lbl">Recipient TIN</div><div class="val">${esc(f.recipientTin)}</div></div>
  </div>
  <div class="box1"><div><div class="lbl">Box 1 &mdash; Nonemployee compensation</div></div>
    <div class="amt">${(f.amountCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}</div></div>
  <div class="note">
    This is the recipient copy. It reports payments made to you that were not wages.
    If you have not paid enough tax on this income you may owe self-employment and
    income tax on it.<br><br>
    <strong>To the payer:</strong> this document does not satisfy your federal filing
    obligation. Copy A must be e-filed, or submitted on the official scannable IRS
    form. Prepared by Menumo from your own records; check every figure before filing.
  </div>
</div>
<div class="noprint" style="text-align:center;margin-top:18px">
  <button onclick="window.print()" style="padding:8px 16px;font-size:14px">Print</button>
</div>
</body></html>`;
}
