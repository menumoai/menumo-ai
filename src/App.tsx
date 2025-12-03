// src/App.tsx
import type { ReactNode } from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Link,
    NavLink,
    Navigate,
    useLocation,
} from "react-router-dom";

import { DevConsole } from "./pages/DevConsole";
import { MenuPage } from "./pages/MenuPage";
import { OrdersPage } from "./pages/OrdersPage";
import { CreateOrderPage } from "./pages/CreateOrderPage";
import { AuthPage } from "./pages/AuthPage";
import { CustomerOrderFormPage } from "./pages/CustomerOrderFormPage";
import { DashboardPage } from "./pages/DashboardPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { AccountProvider } from "./account/AccountContext";
import { ThemeToggle } from "./components/ThemeToggle";

function RequireAuth({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-100">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Checking auth…
                </p>
            </div>
        );
    }

    if (!user) {
        return (
            <Navigate
                to="/auth"
                replace
                state={{ from: location }}
            />
        );
    }

    return <>{children}</>;
}

function Shell() {
    const { user, logout, loading } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
            {/* Header */}
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
                        <NavLink
                            to="/menu"
                            className={({ isActive }) =>
                                [
                                    "transition-colors",
                                    isActive
                                        ? "font-semibold text-indigo-600 dark:text-indigo-400"
                                        : "text-slate-700 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400",
                                ].join(" ")
                            }
                        >
                            Menu
                        </NavLink>

                        <NavLink
                            to="/orders"
                            className={({ isActive }) =>
                                [
                                    "transition-colors",
                                    isActive
                                        ? "font-semibold text-indigo-600 dark:text-indigo-400"
                                        : "text-slate-700 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400",
                                ].join(" ")
                            }
                        >
                            Orders
                        </NavLink>

                        <NavLink
                            to="/dashboard"
                            className={({ isActive }) =>
                                [
                                    "transition-colors",
                                    isActive
                                        ? "font-semibold text-indigo-600 dark:text-indigo-400"
                                        : "text-slate-700 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400",
                                ].join(" ")
                            }
                        >
                            Dashboard
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

                        <NavLink
                            to={user ? `/order-form?account=${user.uid}` : "/order-form"}
                            className={({ isActive }) =>
                                [
                                    "transition-colors",
                                    isActive
                                        ? "font-semibold text-emerald-600 dark:text-emerald-400"
                                        : "text-slate-700 hover:text-emerald-600 dark:text-slate-200 dark:hover:text-emerald-400",
                                ].join(" ")
                            }
                        >
                            Customer Form
                        </NavLink>

                        <span className="ml-2 hidden text-xs text-slate-500 dark:text-slate-400 sm:inline">
                            {loading
                                ? "Checking..."
                                : user
                                    ? `Signed in as ${user.email ?? user.uid}`
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

            {/* Main content */}
            <main className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
                <Routes>
                    <Route
                        path="/"
                        element={
                            <RequireAuth>
                                <DashboardPage />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/menu"
                        element={
                            <RequireAuth>
                                <MenuPage />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/orders"
                        element={
                            <RequireAuth>
                                <OrdersPage />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/orders/:orderId"
                        element={
                            <RequireAuth>
                                <OrderDetailPage />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/orders/new"
                        element={
                            <RequireAuth>
                                <CreateOrderPage />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <RequireAuth>
                                <DashboardPage />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/dev"
                        element={
                            <RequireAuth>
                                <DevConsole />
                            </RequireAuth>
                        }
                    />
                    <Route path="/auth" element={<AuthPage />} />
                    {/* customer-facing, no auth required */}
                    <Route path="/order-form" element={<CustomerOrderFormPage />} />
                </Routes>
            </main>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <AccountProvider>
                <BrowserRouter>
                    <Shell />
                </BrowserRouter>
            </AccountProvider>
        </AuthProvider>
    );
}

export default App;
