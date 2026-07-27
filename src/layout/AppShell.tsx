// src/layout/AppShell.tsx
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useAccount } from "../account/AccountContext";
import { AiCompanion } from "../components/ai/AiCompanion";
import { DashboardLayout } from "./DashboardLayout";

const PUBLIC_PATHS = ["/", "/auth"];

/**
 * Routes that a visitor can open without an account but that belong inside the
 * app once there is one. /get-started is the brief: landing chrome for a
 * prospect, dashboard chrome for a customer, same route either way.
 */
const AUTH_AWARE_PATHS = ["/get-started"];

export function AppShell({ children }: { children: ReactNode }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user, loading: authLoading } = useAuth();
    const { account, loading: accountLoading } = useAccount();

    const isPublicPage = PUBLIC_PATHS.includes(location.pathname);
    const isAuthAware = AUTH_AWARE_PATHS.includes(location.pathname);
    const signedIn = Boolean(user && account);

    // On a hard refresh of an auth-aware route, auth and the account resolve
    // asynchronously. Deciding the shell before they land renders the landing
    // nav and then swaps the whole page to the dashboard chrome a moment later.
    // Only a signed-in user can be waiting on an account, so a genuine visitor
    // still gets the public page immediately.
    const shellUndecided = isAuthAware && (authLoading || (Boolean(user) && accountLoading));

    const handleNavigateBack = async () => {
        await logout();
        navigate("/auth");
    };

    if (shellUndecided) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#FBF8F3]" />
        );
    }

    if (isPublicPage || (isAuthAware && !signedIn)) {
        return <>{children}</>;
    }

    return (
        <DashboardLayout onNavigateBack={handleNavigateBack}>
            {children}
            <AiCompanion />
        </DashboardLayout>
    );
}
