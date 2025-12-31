// src/layout/PageHeader.tsx
import type { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    subtitle?: ReactNode;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
    return (
        <div className="mb-4">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                {title}
            </h1>
            {subtitle && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {subtitle}
                </p>
            )}
        </div>
    );
}

