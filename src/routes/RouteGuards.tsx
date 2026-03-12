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
        return <Navigate to="/home" replace state={{ from: location }} />;
    }

    return <>{children}</>;
}

export function HomeRouter() {
    const { loading } = useAccount();

    if (loading) {
        return (
            <p className="px-6 py-6 text-sm text-slate-600">
                Loading account…
            </p>
        );
    }

    return <Navigate to="/dashboard" replace />;
}

export function BusinessRoute({ children }: { children: ReactNode }) {
    return (
        <RequireAuth>
            <RequireBusiness>{children}</RequireBusiness>
        </RequireAuth>
    );
}
