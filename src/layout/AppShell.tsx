// src/layout/AppShell.tsx
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { DashboardLayout } from "./DashboardLayout";

const PUBLIC_PATHS = ["/", "/auth"];

export function AppShell({ children }: { children: ReactNode }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const isPublicPage = PUBLIC_PATHS.includes(location.pathname);

    const handleNavigateBack = async () => {
        await logout();
        navigate("/auth");
    };

    if (isPublicPage) {
        return <>{children}</>;
    }

    return (
        <DashboardLayout onNavigateBack={handleNavigateBack}>
            {children}
        </DashboardLayout>
    );
}
