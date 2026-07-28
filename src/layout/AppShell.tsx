// src/layout/AppShell.tsx
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useAccount } from "../account/AccountContext";
import { AiCompanion } from "../components/ai/AiCompanion";
import { DashboardLayout } from "./DashboardLayout";

const PUBLIC_PATHS = ["/", "/auth"];

export function AppShell({ children }: { children: ReactNode }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user, loading: authLoading } = useAuth();
    const { account, loading: accountLoading } = useAccount();

    const isPublicPage = PUBLIC_PATHS.includes(location.pathname);
    const signedIn = Boolean(user && account);

    // Chrome for every non-public path is decided by auth state, not by a
    // path whitelist. This is what lets one route serve two audiences
    // (/get-started renders as a public brief or an in-app page), and it keeps
    // the 404 honest: previously an unknown URL was always wrapped in
    // dashboard chrome, even for signed-out visitors, because only "/" and
    // "/auth" ever rendered bare. Route guards still handle their own
    // redirects; this only chooses the frame around them.
    //
    // On a hard refresh, auth and the account resolve asynchronously. Deciding
    // the shell before they land renders one chrome and then swaps the whole
    // page to the other a moment later, so hold while genuinely unknown. Only
    // a signed-in user can be waiting on an account, so a visitor still gets
    // the public page immediately.
    const shellUndecided =
        !isPublicPage && (authLoading || (Boolean(user) && accountLoading));

    const handleNavigateBack = async () => {
        await logout();
        navigate("/auth");
    };

    if (shellUndecided) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#FBF8F3]" />
        );
    }

    if (isPublicPage || !signedIn) {
        return <>{children}</>;
    }

    return (
        <DashboardLayout onNavigateBack={handleNavigateBack}>
            {children}
            <AiCompanion />
        </DashboardLayout>
    );
}
