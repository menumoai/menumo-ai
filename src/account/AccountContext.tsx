// src/account/AccountContext.tsx
import React, { createContext, useContext } from "react";
import { useAuth } from "../auth/AuthContext";

type AccountContextValue = {
    accountId: string | null;
    loading: boolean;
};

const AccountContext = createContext<AccountContextValue | undefined>(undefined);

export function AccountProvider({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    // For now: each user "owns" an account whose id = user.uid
    const accountId = user?.uid ?? null;

    return (
        <AccountContext.Provider value={{ accountId, loading }}>
            {children}
        </AccountContext.Provider>
    );
}

export function useAccount() {
    const ctx = useContext(AccountContext);
    if (!ctx) {
        throw new Error("useAccount must be used within an AccountProvider");
    }
    return ctx;
}
