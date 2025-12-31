// src/components/auth/AuthStatusText.tsx
interface AuthStatusTextProps {
    status: string;
}

export function AuthStatusText({ status }: AuthStatusTextProps) {
    return (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Status:</span> {status || "—"}
        </p>
    );
}
