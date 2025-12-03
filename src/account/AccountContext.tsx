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
// adjust this import name if your model is named differently
import type { BusinessAccount } from "../models/account";

type AccountContextValue = {
    accountId: string | null;
    account: BusinessAccount | null;
    loading: boolean;
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

    return (
        <AccountContext.Provider
            value={{
                accountId,
                account,
                loading: authLoading || accountLoading,
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

