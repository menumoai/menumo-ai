// src/components/auth/AuthCard.tsx
import type { ReactNode } from "react";

interface AuthCardProps {
    title: string;
    description: ReactNode;
    children: ReactNode;
}

export function AuthCard({ title, description, children }: AuthCardProps) {
    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    {title}
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {description}
                </p>

                {children}
            </div>
        </div>
    );
}
