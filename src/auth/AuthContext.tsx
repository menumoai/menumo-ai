// src/auth/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";

import { auth } from "../firebaseClient";
import { getUserProfile } from "../services/profile";
import type { AppUserProfile } from "../models/profile";

type AuthContextValue = {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    profile: AppUserProfile | null;
    profileLoading: boolean;
    isCustomer: boolean;
    isBusinessOwner: boolean;
    isStaff: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const [profile, setProfile] = useState<AppUserProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!isMounted) return;

            setLoading(true);
            setUser(u);

            if (!u) {
                setProfile(null);
                setProfileLoading(false);
                setLoading(false);
                return;
            }

            setProfileLoading(true);

            try {
                const prof = await getUserProfile(u.uid);

                if (!isMounted) return;
                setProfile(prof);
            } catch (err) {
                console.error("Error loading user profile", err);

                if (!isMounted) return;
                setProfile(null);
            } finally {
                if (!isMounted) return;
                setProfileLoading(false);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            unsub();
        };
    }, []);

    const logout = async () => {
        setLoading(true);
        try {
            await signOut(auth);
            setUser(null);
            setProfile(null);
        } finally {
            setProfileLoading(false);
            setLoading(false);
        }
    };

    const isCustomer = profile?.kind === "customer";
    const isBusinessOwner = profile?.kind === "business_owner";
    const isStaff = profile?.kind === "staff";

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                logout,
                profile,
                profileLoading,
                isCustomer,
                isBusinessOwner,
                isStaff,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return ctx;
}
