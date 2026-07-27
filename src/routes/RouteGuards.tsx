import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useAccount } from "../account/AccountContext";
import { ENFORCE_INTERNAL_ONLY } from "../config/access";

export function RequireAuth({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
                <p className="text-sm text-slate-500">Checking auth…</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace state={{ from: location }} />;
    }

    return <>{children}</>;
}

export function RequireBusiness({ children }: { children: ReactNode }) {
    const { account, loading } = useAccount();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
                <p className="text-sm text-slate-500">Loading account…</p>
            </div>
        );
    }

    if (!account) {
        return <Navigate to="/auth" replace state={{ from: location }} />;
    }

    return <>{children}</>;
}

export function BusinessRoute({ children }: { children: ReactNode }) {
    return (
        <RequireAuth>
            <RequireBusiness>{children}</RequireBusiness>
        </RequireAuth>
    );
}

/**
 * Menumo staff only, for internal tooling like the Dev Console.
 *
 * This is a convenience guard, not a security boundary. The Firebase SDK ships
 * in the browser, so anyone determined can call the same service functions from
 * devtools regardless of what this component renders. The only real enforcement
 * is a Firestore rule restricting the writes themselves. Treat this as the
 * thing that stops a customer wandering in, not the thing that stops an
 * attacker.
 *
 * Renders nothing on failure rather than redirecting, so the existence of the
 * route is not confirmed to a curious user.
 */
export function RequireInternal({ children }: { children: ReactNode }) {
    const { isInternal, loading, profileLoading } = useAuth();

    // Temporarily open while nobody can be granted isInternal. See the note in
    // src/config/access.ts - this is the only line that needs changing back.
    if (!ENFORCE_INTERNAL_ONLY) {
        return <>{children}</>;
    }

    if (loading || profileLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
                <p className="text-sm text-slate-500">Checking access…</p>
            </div>
        );
    }

    if (!isInternal) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}

/** Signed in, has an account, and is Menumo staff. */
export function InternalRoute({ children }: { children: ReactNode }) {
    return (
        <BusinessRoute>
            <RequireInternal>{children}</RequireInternal>
        </BusinessRoute>
    );
}
