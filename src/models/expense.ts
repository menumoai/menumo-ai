// src/models/expense.ts
import type { Timestamp } from "firebase/firestore";

export type ExpenseCategory =
    | "Food"
    | "Supplies"
    | "Fuel"
    | "Labor"
    | "Equipment"
    | "Maintenance"
    | "Rent"
    | "Marketing"
    | "Utilities"
    | "Software"
    | "Insurance"
    | "Taxes"
    | "Other";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
    "Food",
    "Supplies",
    "Fuel",
    "Labor",
    "Equipment",
    "Maintenance",
    "Rent",
    "Marketing",
    "Utilities",
    "Software",
    "Insurance",
    "Taxes",
    "Other",
];

export type Expense = {
    id: string;

    // Core
    amountCents: number;
    currency: "USD";
    date: Timestamp;

    // Dimensions
    category: ExpenseCategory;
    vendorName?: string;
    note?: string;

    // Optional bookkeeping
    paymentMethod?: "cash" | "card" | "other";
    taxCents?: number;

    // Metadata
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    createdByUserId?: string;
};

export type CreateExpenseInput = Omit<
    Expense,
    "id" | "createdAt" | "updatedAt"
>;

export type ExpenseQueryArgs = {
    start?: Date; // inclusive
    end?: Date;   // inclusive
    category?: ExpenseCategory | "all";
    limit?: number;
};
