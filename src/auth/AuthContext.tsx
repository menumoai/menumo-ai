// src/auth/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getUserProfile } from "../services/profile";
import type { AppUserProfile } from "../models/profile";
import { auth } from "../firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";

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
    const [profileLoading, setProfileLoading] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            setLoading(false);

            if (!u) {
                setProfile(null);
                return;
            }

            setProfileLoading(true);
            try {
                const prof = await getUserProfile(u.uid);
                setProfile(prof);
            } catch (err) {
                console.error("Error loading user profile", err);
                setProfile(null);
            } finally {
                setProfileLoading(false);
            }
        });

        return () => unsub();
    }, []);

    const logout = async () => {
        await auth.signOut();
        setUser(null);
        setProfile(null);
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
