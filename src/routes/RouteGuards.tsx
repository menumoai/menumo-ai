import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useAccount } from "../account/AccountContext";

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
