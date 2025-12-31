// src/routes/RouteGuards.tsx
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useAccount } from "../account/AccountContext";

// Only allow signed-in users
export function RequireAuth({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-100">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Checking auth…
                </p>
            </div>
        );
    }

    if (!user) {
        return (
            <Navigate
                to="/auth"
                replace
                state={{ from: location }}
            />
        );
    }

    return <>{children}</>;
}

// Only allow users with a business account
export function RequireBusiness({ children }: { children: ReactNode }) {
    const { account, loading } = useAccount();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-100">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Loading account…
                </p>
            </div>
        );
    }

    if (!account) {
        // Logged-in but no business account → treat as customer
        return (
            <Navigate
                to="/order-form"
                replace
                state={{ from: location }}
            />
        );
    }

    return <>{children}</>;
}

// Decide where "/" sends you based on role
export function HomeRouter() {
    const { loading, isBusiness } = useAccount();

    if (loading) {
        return (
            <p className="px-6 py-6 text-sm text-slate-600 dark:text-slate-300">
                Loading account…
            </p>
        );
    }

    if (isBusiness) {
        return <Navigate to="/dashboard" replace />;
    }

    // customer default for now
    return <Navigate to="/order-form" replace />;
}

// Small helper: RequireAuth + RequireBusiness combined
export function BusinessRoute({ children }: { children: ReactNode }) {
    return (
        <RequireAuth>
            <RequireBusiness>{children}</RequireBusiness>
        </RequireAuth>
    );
}
