// src/pages/NotFoundPage.tsx
//
// The catch-all route used to render the marketing landing page, so a
// signed-in user with a typo URL got the sales pitch with no explanation of
// what went wrong. A wrong address should say it is a wrong address, and
// offer the way back.

import { Link, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useAccount } from "../account/AccountContext";

export function NotFoundPage() {
    const { pathname } = useLocation();
    const { user } = useAuth();
    const { account } = useAccount();
    const signedIn = Boolean(user && account);

    return (
        <div
            className={
                signedIn
                    ? "p-4 sm:p-6 lg:p-8"
                    : "flex min-h-screen items-center justify-center bg-[#FBF8F3] p-6"
            }
        >
            <div className="mx-auto w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50">
                    <Compass className="h-6 w-6 text-[#4A7C70]" />
                </div>

                <h1
                    className="text-2xl font-semibold text-gray-900"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                >
                    There&rsquo;s nothing at this address
                </h1>

                <p className="mt-2 text-sm text-gray-600">
                    <code className="rounded bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500">
                        {pathname}
                    </code>{" "}
                    doesn&rsquo;t match any page. The link may be old, or the
                    address mistyped.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {signedIn ? (
                        <Link
                            to="/dashboard"
                            className="rounded-full bg-gradient-to-r from-[#5B9A8B] to-[#4A7C70] px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
                        >
                            Back to your dashboard
                        </Link>
                    ) : (
                        <>
                            <Link
                                to="/"
                                className="rounded-full border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                                Go to the home page
                            </Link>
                            <Link
                                to="/get-started"
                                className="rounded-full bg-gradient-to-r from-[#5B9A8B] to-[#4A7C70] px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
                            >
                                See what Menumo does
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default NotFoundPage;
