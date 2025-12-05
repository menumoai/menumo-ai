// src/pages/AuthPage.tsx
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

import { getUserProfile, upsertUserProfile } from "../services/profile";
import type { AppUserKind } from "../models/profile";

export function AuthPage() {
    const [mode, setMode] = useState<"login" | "signup">("signup");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    // "business_owner" by default so current behavior mostly stays the same
    const [userKind, setUserKind] = useState<AppUserKind>("business_owner");

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

            // Do we already know what kind of user this is?
            const existingProfile = await getUserProfile(uid);

            if (!existingProfile) {
                // First-time Google user → decide based on the current userKind selection
                if (userKind === "business_owner") {
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
                } else {
                    // Google sign-in as customer → no business account
                    await upsertUserProfile({
                        uid,
                        kind: "customer",
                        primaryAccountId: null,
                    });
                }

                setStatus("Google sign-in successful ✅");
                if (userKind === "customer") {
                    navigate("/browse-trucks");
                } else {
                    navigate("/menu");
                }
            } else {
                // Existing user: just send them where their profile says to go
                setStatus("Google sign-in successful ✅");
                if (existingProfile.kind === "customer") {
                    navigate("/browse-trucks");
                } else {
                    navigate("/menu");
                }
            }
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
                if (!firstName && userKind === "business_owner") {
                    setStatus("First name is required for signup as a business owner");
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

                if (userKind === "business_owner") {
                    const accountId = uid;

                    await createBusinessAccount({
                        id: accountId,
                        name: firstName
                            ? `${firstName}'s Truck`
                            : "Demo Taco Truck",
                        legalName: firstName
                            ? `${firstName} Demo LLC`
                            : "Demo Taco Truck LLC",
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
                    navigate("/menu");
                } else {
                    // Customer signup → no business account
                    await upsertUserProfile({
                        uid,
                        kind: "customer",
                        primaryAccountId: null,
                    });

                    setStatus("Signup successful ✅");
                    navigate("/browse-trucks");
                }
            } else {
                // LOGIN
                const cred = await signInWithEmailAndPassword(auth, email, password);
                const user = cred.user;

                let destination: string = "/menu";
                try {
                    const profile = await getUserProfile(user.uid);
                    if (profile?.kind === "customer") {
                        destination = "/browse-trucks";
                    } else {
                        destination = "/menu";
                    }
                } catch (err) {
                    console.error("Error loading profile during login", err);
                    // fall back to /menu for now
                }

                setStatus("Login successful ✅");
                navigate(destination);
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
                    Use Menumo as a{" "}
                    <span className="font-medium">customer</span> to browse trucks
                    and place orders, or as a{" "}
                    <span className="font-medium">food truck owner</span> to manage
                    your own menu and orders.
                </p>

                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                    {mode === "signup" && (
                        <>
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

                            {/* Role selection */}
                            <fieldset className="mt-2 rounded-md border border-slate-200 px-3 py-2 text-xs dark:border-slate-700">
                                <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    I want to use Menumo as
                                </legend>
                                <div className="mt-1 flex flex-col gap-1">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="userKind"
                                            value="customer"
                                            checked={userKind === "customer"}
                                            onChange={() => setUserKind("customer")}
                                            className="h-3 w-3 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-slate-700 dark:text-slate-200">
                                            Customer – browse food trucks and place orders
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="userKind"
                                            value="business_owner"
                                            checked={userKind === "business_owner"}
                                            onChange={() => setUserKind("business_owner")}
                                            className="h-3 w-3 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-slate-700 dark:text-slate-200">
                                            Food truck owner – manage my truck’s menu and orders
                                        </span>
                                    </label>
                                </div>
                            </fieldset>
                        </>
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
