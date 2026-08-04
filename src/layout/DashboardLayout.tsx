import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button.tsx";
import { useAuth } from "../auth/AuthContext";
import { useAccount } from "../account/AccountContext";
import {
    ChefHat,
    DollarSign,
    Receipt,
    BarChart3,
    Home,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    LogOut,
    ChevronDown,
    HelpCircle,
    UtensilsCrossed,
    MapPin,
    Boxes,
    Rocket,
    CreditCard,
} from "lucide-react";
import { useOnboardingProgress } from "../hooks/useOnboardingProgress";
import { ENFORCE_INTERNAL_ONLY } from "../config/access";

interface DashboardLayoutProps {
    children: React.ReactNode;
    onNavigateBack: () => void;
}

export function DashboardLayout({
    children,
    onNavigateBack,
}: DashboardLayoutProps) {
    const navigate = useNavigate();

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

    const { user, isInternal } = useAuth();
    const { account, accountId } = useAccount();

    // Real connectivity, not decoration. The previous pill was hardcoded
    // "Online" with a tooltip claiming "POS Connected - data syncing in
    // real-time"; POS integration sits in our own roadmap's not-started column.
    // Food trucks genuinely lose signal at pitches, so this indicator earns its
    // place only by telling the truth.
    const [isOnline, setIsOnline] = useState(() => navigator.onLine);

    useEffect(() => {
        const goOnline = () => setIsOnline(true);
        const goOffline = () => setIsOnline(false);
        window.addEventListener("online", goOnline);
        window.addEventListener("offline", goOffline);
        return () => {
            window.removeEventListener("online", goOnline);
            window.removeEventListener("offline", goOffline);
        };
    }, []);

    // Only query progress while setup is unfinished. Once the account carries
    // `onboardingCompletedAt` this passes null, the hook makes no reads at all,
    // and the nav item disappears.
    const onboardingDone = Boolean(account?.onboardingCompletedAt);
    const { completed, total, allDone } = useOnboardingProgress(
        onboardingDone ? null : accountId,
    );
    const showGetStarted = !onboardingDone && !allDone;

    const navItems = [
        { path: "/dashboard", label: "Dashboard", icon: Home },
        { path: "/analytics/revenue", label: "Analytics", icon: BarChart3 },
        { path: "/finance", label: "Finances and Taxes", icon: Receipt },
        { path: "/orders", label: "Orders", icon: UtensilsCrossed },
        { path: "/menu", label: "Menu", icon: ChefHat },
        { path: "/inventory", label: "Inventory", icon: Boxes },
        { path: "/expenses", label: "Expenses", icon: DollarSign },
        { path: "/locations", label: "Locations", icon: MapPin },
        { path: "/billing", label: "Plan and Billing", icon: CreditCard },
        // Internal tooling. Hidden from customers entirely rather than shown
        // and then blocked - a menu item you cannot use is just confusing.
        // Temporarily visible to everyone while isInternal cannot be granted;
        // see src/config/access.ts.
        ...(!ENFORCE_INTERNAL_ONLY || isInternal
            ? [{ path: "/dev", label: "Dev Console", icon: BarChart3 }]
            : []),
    ];

    return (
        <div className="min-h-screen bg-[#FBF8F3]">
            <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden"
                                aria-label="Open navigation menu"
                                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                            >
                                <Menu className="h-5 w-5" />
                            </Button>

                            <div className="flex items-center gap-2">
                                <img
                                    src="/menumo-logo.png"
                                    alt="Menumo"
                                    className="h-10 w-10 rounded-lg object-cover"
                                />

                                <div
                                    className={`ml-2 flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${isOnline
                                        ? "border-green-200 bg-green-50"
                                        : "border-amber-200 bg-amber-50"
                                        }`}
                                    title={isOnline
                                        ? "Connected - changes save to the cloud"
                                        : "Offline - changes will not save until you reconnect"}
                                >
                                    <div className={`h-1.5 w-1.5 rounded-full ${isOnline ? "animate-pulse bg-green-500" : "bg-amber-500"}`}></div>
                                    <span className={`hidden text-[10px] font-medium uppercase tracking-wide sm:inline ${isOnline ? "text-green-700" : "text-amber-700"}`}>
                                        {isOnline ? "Online" : "Offline"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* The notification bell is deliberately absent. It showed
                                ten fabricated alerts ("Carnitas down to 15 lbs",
                                "You hit $5,000 weekly revenue!") with an unread badge,
                                and tapping one just went to the dashboard. Alerts are
                                in the catalog as planned; restore the bell when there
                                is something real to ring it for. */}
                            <button
                                aria-label="Account menu"
                                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                                className="hidden items-center gap-2 rounded-lg border-l border-gray-200 px-2 py-1.5 pl-3 transition-colors hover:bg-gray-50 sm:flex"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-500 text-sm font-semibold text-white">
                                    {account?.name?.slice(0, 2).toUpperCase() ?? "U"}
                                </div>

                                <div className="hidden text-left md:block">
                                    <div className="text-sm font-medium text-gray-900">
                                        {account?.name ?? "Your Business"}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {user?.email ?? ""}
                                    </div>
                                </div>

                                <ChevronDown className="hidden h-4 w-4 text-gray-500 md:block" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="relative flex">
                {/* Sticky under the 4rem header so nav is always reachable
                    without scrolling back up. `self-start` matters: this is a
                    flex child, and the default `align-items: stretch` would
                    make it full-height, leaving sticky nothing to move within.
                    Its own overflow-y keeps a long nav usable on short screens. */}
                <aside
                    className={`sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 self-start overflow-y-auto border-r border-gray-200 bg-white transition-all duration-300 lg:block ${isSidebarOpen ? "w-64" : "w-20"
                        }`}
                >
                    <div className="flex justify-end border-b border-gray-200 p-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            {isSidebarOpen ? (
                                <ChevronLeft className="h-5 w-5" />
                            ) : (
                                <ChevronRight className="h-5 w-5" />
                            )}
                        </Button>
                    </div>

                    <nav className="space-y-1 p-4">
                        {navItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all ${isActive
                                            ? "bg-teal-50 font-medium text-teal-700"
                                            : "text-gray-700 hover:bg-gray-50"
                                        } ${!isSidebarOpen ? "justify-center" : ""}`
                                    }
                                    title={!isSidebarOpen ? item.label : undefined}
                                >
                                    <Icon className="h-5 w-5 flex-shrink-0" />
                                    {isSidebarOpen && <span>{item.label}</span>}
                                </NavLink>
                            );
                        })}

                        {showGetStarted && (
                            <NavLink
                                to="/get-started"
                                className={({ isActive }) =>
                                    `mt-2 flex w-full items-center gap-3 rounded-lg border border-dashed border-teal-300 px-3 py-2 text-left transition-all ${isActive
                                        ? "bg-teal-50 font-medium text-teal-700"
                                        : "text-teal-700 hover:bg-teal-50"
                                    } ${!isSidebarOpen ? "justify-center" : ""}`
                                }
                                title={
                                    !isSidebarOpen
                                        ? `Get started (${completed}/${total})`
                                        : undefined
                                }
                            >
                                <Rocket className="h-5 w-5 flex-shrink-0" />
                                {isSidebarOpen && (
                                    <>
                                        <span>Get started</span>
                                        <span className="ml-auto rounded-full bg-teal-100 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums">
                                            {completed}/{total}
                                        </span>
                                    </>
                                )}
                            </NavLink>
                        )}
                    </nav>
                </aside>

                {isMobileSidebarOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
                            onClick={() => setIsMobileSidebarOpen(false)}
                        />

                        <aside className="fixed bottom-0 left-0 top-0 z-50 w-64 bg-white shadow-xl lg:hidden">
                            <div className="flex items-center justify-between border-b border-gray-200 p-4">
                                <div className="flex items-center">
                                    <img
                                        src="/menumo-logo.png"
                                        alt="Menumo"
                                        className="h-10 w-10 rounded-lg object-cover"
                                    />
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsMobileSidebarOpen(false)}
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            <nav className="space-y-1 p-4">
                                {navItems.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsMobileSidebarOpen(false)}
                                            className={({ isActive }) =>
                                                `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${isActive
                                                    ? "bg-teal-50 font-medium text-teal-700"
                                                    : "text-gray-700 hover:bg-gray-50"
                                                }`
                                            }
                                        >
                                            <Icon className="h-5 w-5" />
                                            {item.label}
                                        </NavLink>
                                    );
                                })}

                                {showGetStarted && (
                                    <NavLink
                                        to="/get-started"
                                        onClick={() => setIsMobileSidebarOpen(false)}
                                        className={({ isActive }) =>
                                            `mt-2 flex w-full items-center gap-3 rounded-lg border border-dashed border-teal-300 px-3 py-2 text-left ${isActive
                                                ? "bg-teal-50 font-medium text-teal-700"
                                                : "text-teal-700 hover:bg-teal-50"
                                            }`
                                        }
                                    >
                                        <Rocket className="h-5 w-5" />
                                        <span>Get started</span>
                                        <span className="ml-auto rounded-full bg-teal-100 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums">
                                            {completed}/{total}
                                        </span>
                                    </NavLink>
                                )}
                            </nav>
                        </aside>
                    </>
                )}

                <main className="flex-1 overflow-x-hidden">{children}</main>
            </div>

            {isAccountMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsAccountMenuOpen(false)}
                    />

                    <div className="absolute right-4 top-16 z-50 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                        <div className="bg-gradient-to-br from-gray-50 to-white p-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-500 text-lg font-semibold text-white">
                                    {account?.name?.slice(0, 2).toUpperCase() ?? "U"}
                                </div>

                                <div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {account?.name ?? "Your Business"}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {user?.email ?? ""}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="py-2">
                            {/* Settings is deliberately absent: SettingsPage.tsx is
                                a zero-byte file and the old button silently dropped
                                people on the dashboard, which reads as broken. Restore
                                the item when there is a page to open. */}
                            <button
                                onClick={() => {
                                    setIsAccountMenuOpen(false);
                                    navigate("/get-started");
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                            >
                                <HelpCircle className="h-5 w-5 text-gray-600" />
                                <div>
                                    <div className="text-sm font-medium text-gray-900">Help</div>
                                    <div className="text-xs text-gray-500">
                                        Resources & support
                                    </div>
                                </div>
                            </button>
                        </div>

                        <div className="border-t border-gray-200">
                            <button
                                onClick={() => {
                                    setIsAccountMenuOpen(false);
                                    onNavigateBack();
                                }}
                                className="group w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-red-50"
                            >
                                <LogOut className="h-5 w-5 text-gray-600 group-hover:text-red-600" />
                                <div className="text-sm font-medium text-gray-900 group-hover:text-red-600">
                                    Log Out
                                </div>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
