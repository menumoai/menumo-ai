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

                const cred = await createUserWithEmailAndPassword(auth, email, password);
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
            }
            else {
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
        <div style={{ padding: "1.5rem", maxWidth: 400, margin: "0 auto" }}>
            <h1>{mode === "signup" ? "Sign up" : "Log in"}</h1>
            <p style={{ color: "#555" }}>
                When you sign up, we’ll create an account tied to your login so you can manage
                your own menu and orders.
            </p>

            <form
                onSubmit={handleSubmit}
                style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}
            >
                {mode === "signup" && (
                    <input
                        type="text"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                )}
                <input
                    type="email"
                    placeholder="Email (demo-only is fine)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                />
                <input
                    type="password"
                    placeholder="Password (demo only)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Working..." : mode === "signup" ? "Sign up" : "Log in"}
                </button>
            </form>
            <div style={{ marginTop: "1rem" }}>
                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    style={{ width: "100%" }}
                >
                    Continue with Google
                </button>
            </div>

            <button
                type="button"
                onClick={toggleMode}
                style={{ marginTop: "0.75rem" }}
            >
                {mode === "signup"
                    ? "Already have an account? Log in"
                    : "Need an account? Sign up"}
            </button>

            <p style={{ marginTop: "0.75rem", color: "#555" }}>
                <strong>Status:</strong> {status}
            </p>
        </div>
    );
}

