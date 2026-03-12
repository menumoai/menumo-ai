import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
} from "firebase/auth";
import { Truck, Sparkles, CheckCircle2 } from "lucide-react";

import { auth, googleProvider } from "../firebaseClient";
import { createBusinessAccount } from "../services/accounts";
import { createAccountUser } from "../services/users";
import { getUserProfile, upsertUserProfile } from "../services/profile";

import { EmailPasswordFields } from "../components/auth/EmailPasswordFields";
import { GoogleSignInButton } from "../components/auth/GoogleSignInButton";
import { AuthStatusText } from "../components/auth/AuthStatusText";

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

            if (!user) {
                setStatus("No user returned from Google.");
                return;
            }

            const uid = user.uid;
            const existingProfile = await getUserProfile(uid);

            if (!existingProfile) {
                const accountId = uid;

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
                    id: uid,
                    email: user.email ?? "",
                    firstName: user.displayName ?? "Owner",
                    role: "owner",
                });

                await upsertUserProfile({
                    uid,
                    kind: "business_owner",
                    primaryAccountId: accountId,
                });
            }

            setStatus("Google sign-in successful ✅");
            navigate("/dashboard", { replace: true });
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
                if (!firstName.trim()) {
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
                const uid = user.uid;
                const accountId = uid;

                await createBusinessAccount({
                    id: accountId,
                    name: `${firstName}'s Truck`,
                    legalName: `${firstName} Demo LLC`,
                    email,
                });

                await createAccountUser({
                    accountId,
                    id: uid,
                    email,
                    firstName: firstName || "Owner",
                    role: "owner",
                });

                await upsertUserProfile({
                    uid,
                    kind: "business_owner",
                    primaryAccountId: accountId,
                });

                setStatus("Signup successful ✅");
                navigate("/dashboard", { replace: true });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                setStatus("Login successful ✅");
                navigate("/dashboard", { replace: true });
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

    const title = mode === "signup" ? "Create your account" : "Welcome back";
    const subtitle =
        mode === "signup"
            ? "Start using Menumo to manage your food truck."
            : "Log in to manage your truck.";

    return (
        <div className="min-h-screen bg-[#FBF8F3]">
            <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
                <div className="flex items-center px-6 py-10 sm:px-10 lg:px-14">
                    <div className="w-full max-w-xl">
                        <div className="mb-8 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 shadow-lg">
                                <Truck className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1
                                    className="text-3xl font-bold text-gray-900"
                                    style={{ fontFamily: "Poppins, sans-serif" }}
                                >
                                    Menumo
                                </h1>
                                <p className="text-sm text-gray-500">
                                    Food truck operations made simple
                                </p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
                                <Sparkles className="h-4 w-4" />
                                Smart ordering + menu management
                            </div>

                            <h2
                                className="mb-3 text-4xl font-bold leading-tight text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                {title}
                            </h2>

                            <p className="max-w-lg text-base text-gray-600">{subtitle}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                                    <CheckCircle2 className="h-4 w-4 text-green-700" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        For food truck owners
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Manage your menu, track orders, and monitor revenue and expenses.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                                    <CheckCircle2 className="h-4 w-4 text-purple-700" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        Built to scale with you
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Start simple, then grow into analytics, staff workflows, and smarter operations.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
                    <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-xl">
                        <div className="mb-6">
                            <div className="mb-2 text-sm font-medium uppercase tracking-wide text-teal-700">
                                {mode === "signup" ? "Get Started" : "Sign In"}
                            </div>
                            <h3
                                className="text-2xl font-bold text-gray-900"
                                style={{ fontFamily: "Poppins, sans-serif" }}
                            >
                                {title}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === "signup" && (
                                <div className="space-y-1">
                                    <label className="block text-xs font-medium text-gray-600">
                                        First name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="First name"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                    />
                                </div>
                            )}

                            <EmailPasswordFields
                                email={email}
                                password={password}
                                mode={mode}
                                onEmailChange={setEmail}
                                onPasswordChange={setPassword}
                            />

                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#5B9A8B] to-[#4A7C70] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading
                                    ? "Working..."
                                    : mode === "signup"
                                        ? "Create account"
                                        : "Log in"}
                            </button>
                        </form>

                        <div className="my-5 flex items-center gap-3">
                            <div className="h-px flex-1 bg-gray-200" />
                            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                Or continue with
                            </span>
                            <div className="h-px flex-1 bg-gray-200" />
                        </div>

                        <GoogleSignInButton
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                        />

                        <button
                            type="button"
                            onClick={toggleMode}
                            className="mt-4 w-full text-center text-sm font-medium text-teal-700 hover:text-teal-800"
                        >
                            {mode === "signup"
                                ? "Already have an account? Log in"
                                : "Need an account? Sign up"}
                        </button>

                        <div className="mt-4">
                            <AuthStatusText status={status} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
