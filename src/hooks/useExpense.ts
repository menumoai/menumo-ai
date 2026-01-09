// src/hooks/useExpenses.ts
import { useEffect, useMemo, useState } from "react";
import type { Expense, ExpenseCategory, ExpenseQueryArgs } from "../models/expense";
import { subscribeExpenses } from "../services/expense";
import { useAccount } from "../account/AccountContext";

type UseExpensesResult = {
    expenses: Expense[];
    totalExpenseCents: number;
    byCategory: { category: ExpenseCategory; totalCents: number }[];
    loading: boolean;
    error: string | null;
};

export function useExpenses(args?: ExpenseQueryArgs): UseExpensesResult {
    const { accountId } = useAccount();

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!accountId) {
            setExpenses([]);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        const unsub = subscribeExpenses(
            accountId,
            args,
            (rows) => {
                setExpenses(rows);
                setLoading(false);
            },
            (err) => {
                console.error("subscribeExpenses error:", err);
                setError("Failed to load expenses.");
                setLoading(false);
            },
        );

        return () => unsub();
        // NOTE: args is likely recreated often; stringify for stable deps.
        // If you later pass Date objects frequently, this is fine.
    }, [accountId, JSON.stringify(args ?? {})]);

    const totalExpenseCents = useMemo(() => {
        return expenses.reduce((sum, e) => sum + (e.amountCents || 0), 0);
    }, [expenses]);

    const byCategory = useMemo(() => {
        const map = new Map<ExpenseCategory, number>();

        for (const e of expenses) {
            const key = (e.category ?? "Other") as ExpenseCategory;
            map.set(key, (map.get(key) ?? 0) + (e.amountCents || 0));
        }

        return Array.from(map.entries())
            .map(([category, totalCents]) => ({ category, totalCents }))
            .sort((a, b) => b.totalCents - a.totalCents);
    }, [expenses]);

    return { expenses, totalExpenseCents, byCategory, loading, error };
}
