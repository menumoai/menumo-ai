// src/account/AccountContext.tsx
import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";
import type { ReactNode } from "react";
import { doc, onSnapshot } from "firebase/firestore";

import { db } from "../firebaseClient";
import { useAuth } from "../auth/AuthContext";
import type { BusinessAccount } from "../models/account";
import type { AppUserRole } from "../models/user";

type AccountContextValue = {
    accountId: string | null;
    account: BusinessAccount | null;
    loading: boolean;
    role: AppUserRole | null;
    isBusiness: boolean;
};

const AccountContext = createContext<AccountContextValue | undefined>(
    undefined,
);

export function AccountProvider({ children }: { children: ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const [account, setAccount] = useState<BusinessAccount | null>(null);
    const [accountLoading, setAccountLoading] = useState(true);

    const accountId = user?.uid ?? null;

    useEffect(() => {
        // No user → no account
        if (!user) {
            setAccount(null);
            setAccountLoading(false);
            return;
        }

        setAccountLoading(true);

        const ref = doc(db, "accounts", user.uid);

        const unsub = onSnapshot(
            ref,
            (snap) => {
                if (snap.exists()) {
                    setAccount({ id: snap.id, ...(snap.data() as any) });
                } else {
                    setAccount(null);
                }
                setAccountLoading(false);
            },
            (err) => {
                console.error("Error listening to account doc:", err);
                setAccount(null);
                setAccountLoading(false);
            },
        );

        return () => unsub();
    }, [user?.uid]);

    // derive role + isBusiness
    const isBusiness = !!account;
    const role: AppUserRole | null = !user
        ? null
        : isBusiness
            ? "owner" // later we can read real AccountUser.role
            : "customer";

    return (
        <AccountContext.Provider
            value={{
                accountId,
                account,
                loading: authLoading || accountLoading,
                role,
                isBusiness,
            }}
        >
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
