// src/analysis/tax.ts
//
// Estimated US federal tax for a pass-through food business, computed from the
// account's own P&L rather than a flat percentage.
//
// This replaces `netProfit * 0.25`, which was ported from profitpilot's fixtures
// and had no basis beyond being a round number.
//
// WHAT THIS IS
//   A quarterly set-aside estimate for a sole proprietor / single-member LLC
//   whose business income flows onto a personal return. It computes:
//     - self-employment tax (exact; the rules are simple and stable)
//     - federal income tax on business income, via brackets
//     - the QBI deduction, which materially affects this audience
//     - state tax, from an effective rate the owner supplies
//
// WHAT THIS IS NOT
//   Tax advice, or a filing figure. It ignores credits, depreciation elections,
//   multi-state apportionment, S-corp reasonable-compensation splits, and much
//   else. It is deliberately conservative and must be presented as an estimate.
//
// !! CONSTANTS NEED VERIFICATION BEFORE ANYONE RELIES ON THIS !!
//   The TY2025 figures below are transcribed from memory, not from a live IRS
//   feed. Every one must be checked against IRS Rev. Proc. 2024-40 and Schedule
//   SE before this drives a number an owner acts on. They are isolated in a
//   single dated table so that check is a contained job, and so the annual
//   update is one edit.

export type FilingStatus = "single" | "married_joint" | "head_of_household";

export interface TaxProfile {
    filingStatus: FilingStatus;
    /**
     * Combined state + local income tax as an effective percentage of business
     * profit. Supplied by the owner because a credible 50-state table (with
     * brackets, local add-ons and no-income-tax states) is a data set we do not
     * have and must not invent. 0 is correct for TX, FL, WA and similar.
     */
    stateEffectiveRatePct: number;
    /**
     * Other household income already taxed elsewhere - a W-2 job, a spouse's
     * salary. Business profit stacks on top of this, so leaving it out
     * understates the marginal rate, often badly.
     */
    otherHouseholdIncome: number;
}

export const DEFAULT_TAX_PROFILE: TaxProfile = {
    filingStatus: "single",
    stateEffectiveRatePct: 0,
    otherHouseholdIncome: 0,
};

export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
    single: "Single",
    married_joint: "Married, filing jointly",
    head_of_household: "Head of household",
};

// ─── TY2025 constants · VERIFY AGAINST IRS BEFORE RELYING ON THESE ──────────

export const TAX_YEAR = 2025;

/**
 * The statutory figures the estimate depends on.
 *
 * These ship as defaults so the page works out of the box, but they are treated
 * as UNVERIFIED until a human confirms them: the values below were transcribed
 * by hand, not pulled from an IRS feed, and a wrong digit in a tax calculator is
 * worse than no calculator. The owner (or their accountant) can see every figure
 * in use and correct it, which puts the numbers in the hands of the person who
 * can actually check them against Rev. Proc. 2024-40 and Schedule SE.
 */
export interface TaxFigures {
    taxYear: number;
    standardDeduction: number;
    brackets: Bracket[];
    ssWageBase: number;
    qbiThreshold: number;
    addlMedicareThreshold: number;
}

/** Shipped defaults for a filing status. Starting point, not gospel. */
export function defaultTaxFigures(filingStatus: FilingStatus): TaxFigures {
    return {
        taxYear: TAX_YEAR,
        standardDeduction: STANDARD_DEDUCTION[filingStatus],
        brackets: BRACKETS[filingStatus].map((b) => ({ ...b })),
        ssWageBase: SS_WAGE_BASE,
        qbiThreshold: QBI_THRESHOLD[filingStatus],
        addlMedicareThreshold: ADDL_MEDICARE_THRESHOLD[filingStatus],
    };
}

/** Social Security wage base. Above this, only Medicare applies. */
const SS_WAGE_BASE = 176_100;
const SS_RATE = 0.124;
const MEDICARE_RATE = 0.029;
/** Schedule SE taxes 92.35% of net profit. */
const SE_TAXABLE_SHARE = 0.9235;
/** Additional Medicare Tax over the threshold. */
const ADDL_MEDICARE_RATE = 0.009;
const ADDL_MEDICARE_THRESHOLD: Record<FilingStatus, number> = {
    single: 200_000,
    married_joint: 250_000,
    head_of_household: 200_000,
};

const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
    single: 15_000,
    married_joint: 30_000,
    head_of_household: 22_500,
};

export interface Bracket {
    upTo: number;
    rate: number;
}

const BRACKETS: Record<FilingStatus, Bracket[]> = {
    single: [
        { upTo: 11_925, rate: 0.1 },
        { upTo: 48_475, rate: 0.12 },
        { upTo: 103_350, rate: 0.22 },
        { upTo: 197_300, rate: 0.24 },
        { upTo: 250_525, rate: 0.32 },
        { upTo: 626_350, rate: 0.35 },
        { upTo: Infinity, rate: 0.37 },
    ],
    married_joint: [
        { upTo: 23_850, rate: 0.1 },
        { upTo: 96_950, rate: 0.12 },
        { upTo: 206_700, rate: 0.22 },
        { upTo: 394_600, rate: 0.24 },
        { upTo: 501_050, rate: 0.32 },
        { upTo: 751_600, rate: 0.35 },
        { upTo: Infinity, rate: 0.37 },
    ],
    head_of_household: [
        { upTo: 17_000, rate: 0.1 },
        { upTo: 64_850, rate: 0.12 },
        { upTo: 103_350, rate: 0.22 },
        { upTo: 197_300, rate: 0.24 },
        { upTo: 250_500, rate: 0.32 },
        { upTo: 626_350, rate: 0.35 },
        { upTo: Infinity, rate: 0.37 },
    ],
};

/** Qualified Business Income deduction: 20%, below the phase-in threshold. */
const QBI_RATE = 0.2;
const QBI_THRESHOLD: Record<FilingStatus, number> = {
    single: 197_300,
    married_joint: 394_600,
    head_of_household: 197_300,
};

// ─── engine ────────────────────────────────────────────────────────────────

export interface TaxEstimate {
    /** Self-employment tax (Social Security + Medicare). */
    selfEmploymentTax: number;
    /** Federal income tax attributable to the business profit. */
    federalIncomeTax: number;
    /** State + local, from the owner's supplied effective rate. */
    stateTax: number;
    total: number;
    /** Total as a percentage of net profit, for display. */
    effectiveRatePct: number;
    /** QBI deduction applied, surfaced because owners ask about it. */
    qbiDeduction: number;
    /** Half of SE tax, deductible from AGI. */
    deductibleSeTax: number;
}

const ZERO_ESTIMATE: TaxEstimate = {
    selfEmploymentTax: 0,
    federalIncomeTax: 0,
    stateTax: 0,
    total: 0,
    effectiveRatePct: 0,
    qbiDeduction: 0,
    deductibleSeTax: 0,
};

function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

/** Progressive tax on `amount`, given a bracket table. */
function taxFromBrackets(amount: number, brackets: Bracket[]): number {
    if (amount <= 0) return 0;

    let tax = 0;
    let lower = 0;

    for (const bracket of brackets) {
        if (amount <= lower) break;
        const taxableHere = Math.min(amount, bracket.upTo) - lower;
        tax += taxableHere * bracket.rate;
        lower = bracket.upTo;
    }

    return tax;
}

function computeSelfEmploymentTax(
    netProfit: number,
    profile: TaxProfile,
    figures: TaxFigures,
): { seTax: number; deductible: number } {
    if (netProfit <= 0) return { seTax: 0, deductible: 0 };

    const seBase = netProfit * SE_TAXABLE_SHARE;

    const socialSecurity = Math.min(seBase, figures.ssWageBase) * SS_RATE;
    const medicare = seBase * MEDICARE_RATE;

    // Additional Medicare applies to combined earnings over the threshold.
    const combined = seBase + profile.otherHouseholdIncome;
    const threshold = figures.addlMedicareThreshold;
    const additionalMedicare =
        combined > threshold
            ? Math.min(seBase, combined - threshold) * ADDL_MEDICARE_RATE
            : 0;

    const seTax = socialSecurity + medicare + additionalMedicare;

    // Half of the base SE tax is deductible from AGI. The additional Medicare
    // portion is not.
    const deductible = (socialSecurity + medicare) / 2;

    return { seTax, deductible };
}

/**
 * Estimates tax on business profit, stacked on top of any other household
 * income so the marginal rate is right.
 *
 * The federal figure is computed as the *difference* between tax on total
 * income and tax on other income alone, which isolates what the business
 * actually adds rather than taxing it as if it were the only income.
 */
export function estimateTax(
    netProfit: number,
    profile: TaxProfile = DEFAULT_TAX_PROFILE,
    figures: TaxFigures = defaultTaxFigures(profile.filingStatus),
): TaxEstimate {
    if (netProfit <= 0) return ZERO_ESTIMATE;

    const { seTax, deductible } = computeSelfEmploymentTax(
        netProfit,
        profile,
        figures,
    );

    const brackets = figures.brackets;
    const standardDeduction = figures.standardDeduction;
    const other = Math.max(0, profile.otherHouseholdIncome);

    // QBI: 20% of business income, only below the phase-in threshold. Above it
    // the rules turn on wages and property and we do not model them, so we drop
    // the deduction rather than overstate it.
    const businessAgi = netProfit - deductible;
    const qbiEligible =
        businessAgi + other <= figures.qbiThreshold;

    // The deduction is the LESSER of 20% of qualified business income and 20%
    // of taxable income figured before it (IRC 199A(a)). Missing that second
    // limb overstates the deduction, which understates the set-aside - the
    // wrong direction to be wrong in for money someone is reserving for a bill.
    // Net capital gain also reduces the limit; we do not model investments, so
    // taxable income before QBI is the right base here.
    const taxableBeforeQbi = Math.max(
        0,
        other + businessAgi - standardDeduction,
    );
    const qbiDeduction = qbiEligible
        ? Math.min(
              Math.max(0, businessAgi) * QBI_RATE,
              taxableBeforeQbi * QBI_RATE,
          )
        : 0;

    const taxableWithBusiness = Math.max(
        0,
        other + businessAgi - standardDeduction - qbiDeduction,
    );
    const taxableWithoutBusiness = Math.max(0, other - standardDeduction);

    const federalIncomeTax = Math.max(
        0,
        taxFromBrackets(taxableWithBusiness, brackets) -
            taxFromBrackets(taxableWithoutBusiness, brackets),
    );

    const stateTax =
        netProfit * (Math.max(0, profile.stateEffectiveRatePct) / 100);

    const total = seTax + federalIncomeTax + stateTax;

    return {
        selfEmploymentTax: round2(seTax),
        federalIncomeTax: round2(federalIncomeTax),
        stateTax: round2(stateTax),
        total: round2(total),
        effectiveRatePct: round2((total / netProfit) * 100),
        qbiDeduction: round2(qbiDeduction),
        deductibleSeTax: round2(deductible),
    };
}

/** True when the owner has not supplied enough for a meaningful estimate. */
export function isTaxProfileConfigured(
    profile: TaxProfile | null | undefined,
): profile is TaxProfile {
    return Boolean(profile && profile.filingStatus);
}
