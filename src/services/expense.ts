// src/services/expense.ts
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit as fsLimit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
    type Unsubscribe,
} from "firebase/firestore";

import { db } from "../firebaseClient";
import type {
    CreateExpenseInput,
    Expense,
    ExpenseQueryArgs,
} from "../models/expense";

function expensesCol(accountId: string) {
    return collection(db, "accounts", accountId, "expenses");
}

function toExpense(id: string, data: any): Expense {
    return {
        id,
        amountCents: Number(data.amountCents ?? 0),
        currency: (data.currency ?? "USD") as "USD",
        date: (data.date as Timestamp) ?? Timestamp.fromDate(new Date()),

        category: data.category ?? "Other",
        vendorName: data.vendorName ?? "",
        note: data.note ?? "",

        paymentMethod: data.paymentMethod,
        taxCents: data.taxCents != null ? Number(data.taxCents) : undefined,

        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId,
    };
}

function buildExpensesQuery(accountId: string, args?: ExpenseQueryArgs) {
    const col = expensesCol(accountId);
    const clauses: any[] = [];

    // Firestore: if you use range filters, you typically must orderBy the same field.
    // We'll always orderBy date desc anyway.
    if (args?.start) {
        clauses.push(where("date", ">=", Timestamp.fromDate(args.start)));
    }
    if (args?.end) {
        clauses.push(where("date", "<=", Timestamp.fromDate(args.end)));
    }
    if (args?.category && args.category !== "all") {
        clauses.push(where("category", "==", args.category));
    }

    clauses.push(orderBy("date", "desc"));

    if (args?.limit && args.limit > 0) {
        clauses.push(fsLimit(args.limit));
    }

    return query(col, ...clauses);
}

export async function createExpense(
    accountId: string,
    input: CreateExpenseInput,
    userId: string,
) {
    const col = expensesCol(accountId);

    const payload = {
        ...input,
        currency: input.currency ?? "USD",
        vendorName: input.vendorName ?? "",
        note: input.note ?? "",
        createdByUserId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(col, payload);
    return ref.id;
}

export async function updateExpense(
    accountId: string,
    expenseId: string,
    patch: Partial<CreateExpenseInput>,
) {
    const ref = doc(db, "accounts", accountId, "expenses", expenseId);

    await updateDoc(ref, {
        ...patch,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteExpense(accountId: string, expenseId: string) {
    const ref = doc(db, "accounts", accountId, "expenses", expenseId);
    await deleteDoc(ref);
}

export async function listExpenses(
    accountId: string,
    args?: ExpenseQueryArgs,
): Promise<Expense[]> {
    const q = buildExpensesQuery(accountId, args);
    const snap = await getDocs(q);
    return snap.docs.map((d) => toExpense(d.id, d.data()));
}

export function subscribeExpenses(
    accountId: string,
    args: ExpenseQueryArgs | undefined,
    onData: (expenses: Expense[]) => void,
    onError?: (err: unknown) => void,
): Unsubscribe {
    const q = buildExpensesQuery(accountId, args);

    return onSnapshot(
        q,
        (snap) => {
            const rows = snap.docs.map((d) => toExpense(d.id, d.data()));
            onData(rows);
        },
        (err) => onError?.(err),
    );
}
