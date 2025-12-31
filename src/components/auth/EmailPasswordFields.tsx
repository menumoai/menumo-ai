// src/components/auth/EmailPasswordFields.tsx
interface EmailPasswordFieldsProps {
    email: string;
    password: string;
    mode: "login" | "signup";
    onEmailChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
}

export function EmailPasswordFields({
    email,
    password,
    mode,
    onEmailChange,
    onPasswordChange,
}: EmailPasswordFieldsProps) {
    return (
        <>
            <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Email
                </label>
                <input
                    type="email"
                    placeholder="Email (demo-only is fine)"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    autoComplete="email"
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-indigo-500/0 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                />
            </div>

            <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Password
                </label>
                <input
                    type="password"
                    placeholder="Password (demo only)"
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-indigo-500/0 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                />
            </div>
        </>
    );
}
