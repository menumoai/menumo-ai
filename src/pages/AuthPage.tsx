import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../firebaseClient";
import { createBusinessAccount } from "../services/accounts";
import { createAccountUser } from "../services/users";

export function AuthPage() {
    const [mode, setMode] = useState<"login" | "signup">("signup");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleGoogleSignIn = async () => {
        setStatus("");
        setLoading(true);

        try {
            const cred = await signInWithPopup(auth, googleProvider);
            const user = cred.user;

            const accountId = user.uid;

            await createBusinessAccount({
                id: accountId,
                name: user.displayName
                    ? `${user.displayName}'s Truck`
                    : "Demo Taco Truck",
                legalName: "Demo Taco Truck LLC",
                email: user.email ?? undefined,
            });

            await createAccountUser({
                accountId,
                id: user.uid,
                email: user.email ?? "",
                firstName: user.displayName ?? "Owner",
                role: "owner",
            });

            setStatus("Google sign-in successful ✅");
            navigate("/menu");
        } catch (err: any) {
            console.error(err);
            setStatus(err.message ?? "Google sign-in error");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStatus("");
        setLoading(true);

        try {
            if (mode === "signup") {
                if (!firstName) {
                    setStatus("First name is required for signup");
                    setLoading(false);
                    return;
                }

                const cred = await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );
                const user = cred.user;

                const accountId = user.uid;

                await createBusinessAccount({
                    id: accountId,
                    name: `${firstName}'s Truck`,
                    legalName: `${firstName} Demo LLC`,
                    email,
                });

                await createAccountUser({
                    accountId,
                    id: user.uid,
                    email,
                    firstName,
                    role: "owner",
                });

                setStatus("Signup successful ✅");
                navigate("/menu");
            } else {
                // LOGIN
                await signInWithEmailAndPassword(auth, email, password);
                setStatus("Login successful ✅");
                navigate("/menu");
            }
        } catch (err: any) {
            console.error(err);
            setStatus(err.message ?? "Auth error");
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setMode((m) => (m === "signup" ? "login" : "signup"));
        setStatus("");
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    {mode === "signup" ? "Sign up" : "Log in"}
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    When you sign up, we’ll create an account tied to your login so you
                    can manage your own menu and orders.
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-4 space-y-3"
                >
                    {mode === "signup" && (
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                                First name
                            </label>
                            <input
                                type="text"
                                placeholder="First name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-indigo-500/0 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                            />
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder="Email (demo-only is fine)"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-indigo-500/0 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-1 inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                    >
                        {loading
                            ? "Working..."
                            : mode === "signup"
                                ? "Sign up"
                                : "Log in"}
                    </button>
                </form>

                <div className="mt-4">
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
                    >
                        Continue with Google
                    </button>
                </div>

                <button
                    type="button"
                    onClick={toggleMode}
                    className="mt-3 w-full text-center text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                    {mode === "signup"
                        ? "Already have an account? Log in"
                        : "Need an account? Sign up"}
                </button>

                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold">Status:</span> {status || "—"}
                </p>
            </div>
        </div>
    );
}
