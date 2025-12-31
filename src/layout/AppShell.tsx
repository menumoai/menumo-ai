// src/layout/AppShell.tsx
import type { ReactNode } from "react";
import { MainHeader } from "./MainHeader";

export function AppShell({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
            <MainHeader />
            <main className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
                {children}
            </main>
        </div>
    );
}
