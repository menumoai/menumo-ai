// src/models/contractorPayment.ts
import type { Timestamp } from "firebase/firestore";

/**
 * A payment to a non-employee, tracked so the owner can see who crosses the
 * 1099-NEC filing threshold at year end.
 *
 * DELIBERATELY ABSENT: the contractor's TIN / SSN.
 *
 * A 1099 needs one, but this repo currently ships no Firestore security rules
 * (firebase.json configures storage.rules only), so every authenticated client
 * can read every document. Persisting Social Security numbers into that is not
 * a trade worth making for the convenience of not retyping once a year. The
 * number is collected in the form, used to render the document, and discarded.
 *
 * Revisit once rules exist AND the field is encrypted or held server-side. Until
 * then, treat "we do not store it" as a feature.
 */
export interface ContractorPayment {
    id: string;
    accountId: string;

    /** Legal name as it should appear on the 1099. */
    contractorName: string;
    /** Optional business name, if they trade under one. */
    businessName?: string;

    amountCents: number;
    currency: "USD";
    paidAt: Timestamp;

    /** What the work was, for the owner's own records. */
    description?: string;

    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    createdByUserId?: string;
}

export type CreateContractorPaymentInput = Omit<
    ContractorPayment,
    "id" | "createdAt" | "updatedAt"
>;

/**
 * A 1099-NEC is required when total nonemployee compensation to one payee
 * reaches this in a calendar year.
 */
export const FORM_1099_THRESHOLD_CENTS = 60_000;

/** Rolled-up totals per contractor for a tax year. */
export interface ContractorYearTotal {
    contractorName: string;
    businessName?: string;
    totalCents: number;
    paymentCount: number;
    /** True once the year total reaches the filing threshold. */
    requiresForm1099: boolean;
}

export function summarizeContractorYear(
    payments: ContractorPayment[],
    year: number,
): ContractorYearTotal[] {
    const byName = new Map<string, ContractorYearTotal>();

    for (const payment of payments) {
        const paidAt =
            payment.paidAt && typeof payment.paidAt.toDate === "function"
                ? payment.paidAt.toDate()
                : new Date(0);
        if (paidAt.getFullYear() !== year) continue;

        const key = payment.contractorName.trim().toLowerCase();
        const existing = byName.get(key);

        if (existing) {
            existing.totalCents += payment.amountCents;
            existing.paymentCount += 1;
            existing.requiresForm1099 =
                existing.totalCents >= FORM_1099_THRESHOLD_CENTS;
        } else {
            byName.set(key, {
                contractorName: payment.contractorName.trim(),
                businessName: payment.businessName,
                totalCents: payment.amountCents,
                paymentCount: 1,
                requiresForm1099:
                    payment.amountCents >= FORM_1099_THRESHOLD_CENTS,
            });
        }
    }

    return [...byName.values()].sort((a, b) => b.totalCents - a.totalCents);
}
