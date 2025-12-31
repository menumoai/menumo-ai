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

import { AuthCard } from "../components/auth/AuthCard";
import { UserKindSelector } from "../components/auth/UserKindSelector";
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
            const existingProfile = await getUserProfile(uid);

            if (!existingProfile) {
                // First-time Google user
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
                    // Customer Google signup → no business account
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
                // Existing profile
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

    const title = mode === "signup" ? "Sign up" : "Log in";

    return (
        <AuthCard
            title={title}
            description={
                <>
                    Use Menumo as a{" "}
                    <span className="font-medium">customer</span> to browse trucks
                    and place orders, or as a{" "}
                    <span className="font-medium">food truck owner</span> to manage
                    your own menu and orders.
                </>
            }
        >
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

                        <UserKindSelector value={userKind} onChange={setUserKind} />
                    </>
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
                <GoogleSignInButton onClick={handleGoogleSignIn} disabled={loading} />
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

            <AuthStatusText status={status} />
        </AuthCard>
    );
}
