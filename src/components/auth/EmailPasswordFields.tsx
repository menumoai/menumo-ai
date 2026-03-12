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
            <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-600">
                    Email
                </label>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    autoComplete="email"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
            </div>

            <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-600">
                    Password
                </label>
                <input
                    type="password"
                    placeholder={mode === "login" ? "Enter your password" : "Create a password"}
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
            </div>
        </>
    );
}
