// src/layout/MainHeader.tsx
import { Link, NavLink } from "react-router-dom";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth } from "../auth/AuthContext";
import { useAccount } from "../account/AccountContext";

export function MainHeader() {
    const { user, logout, loading } = useAuth();
    const { isBusiness, role } = useAccount();

    const navLinkClass = (isActive: boolean, activeClass: string) =>
        [
            "transition-colors",
            isActive
                ? activeClass
                : "text-slate-700 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400",
        ].join(" ");

    return (
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
                <Link
                    to="/"
                    className="flex items-center gap-2 text-slate-900 no-underline dark:text-slate-50"
                >
                    <h1 className="text-lg font-semibold tracking-tight">
                        Menumo AI
                    </h1>
                </Link>

                <nav className="flex items-center gap-4 text-sm">
                    {/* Business nav */}
                    {isBusiness && (
                        <>
                            <NavLink
                                to="/menu"
                                className={({ isActive }) =>
                                    navLinkClass(
                                        isActive,
                                        "font-semibold text-indigo-600 dark:text-indigo-400"
                                    )
                                }
                            >
                                Menu
                            </NavLink>

                            <NavLink
                                to="/orders"
                                className={({ isActive }) =>
                                    navLinkClass(
                                        isActive,
                                        "font-semibold text-indigo-600 dark:text-indigo-400"
                                    )
                                }
                            >
                                Orders
                            </NavLink>

                            <NavLink
                                to="/dashboard"
                                className={({ isActive }) =>
                                    navLinkClass(
                                        isActive,
                                        "font-semibold text-indigo-600 dark:text-indigo-400"
                                    )
                                }
                            >
                                Dashboard
                            </NavLink>
                            <NavLink
                                to="/expenses"
                                className={({ isActive }) =>
                                    navLinkClass(
                                        isActive,
                                        "font-semibold text-indigo-600 dark:text-indigo-400"
                                    )
                                }
                            >
                                Expenses
                            </NavLink>
                            <NavLink
                                to="/dev"
                                className={({ isActive }) =>
                                    [
                                        "transition-colors",
                                        isActive
                                            ? "font-semibold text-indigo-600 dark:text-indigo-400"
                                            : "text-slate-500 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400",
                                    ].join(" ")
                                }
                            >
                                Dev Console
                            </NavLink>
                        </>
                    )}

                    {/* Customer entry point – always visible */}
                    <NavLink
                        to="/locations"
                        className={({ isActive }) =>
                            [
                                "transition-colors",
                                isActive
                                    ? "font-semibold text-emerald-600 dark:text-emerald-400"
                                    : "text-slate-700 hover:text-emerald-600 dark:text-slate-200 dark:hover:text-emerald-400",
                            ].join(" ")
                        }
                    >
                        Find Food Trucks
                    </NavLink>

                    <span className="ml-2 hidden text-xs text-slate-500 dark:text-slate-400 sm:inline">
                        {loading
                            ? "Checking..."
                            : user
                                ? `Signed in as ${user.email ?? user.uid}${role ? ` (${role})` : ""
                                }`
                                : "Not signed in"}
                    </span>

                    <ThemeToggle />

                    {user ? (
                        <button
                            onClick={() => logout()}
                            className="ml-1 inline-flex items-center rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                        >
                            Logout
                        </button>
                    ) : (
                        <Link
                            to="/auth"
                            className="ml-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                        >
                            Auth
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}
