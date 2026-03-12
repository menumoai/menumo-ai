import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button.tsx";
import { useAuth } from "../auth/AuthContext";
import { useAccount } from "../account/AccountContext";
import {
    Truck,
    ChefHat,
    Calendar,
    DollarSign,
    Users,
    BarChart3,
    Home,
    Menu,
    X,
    Bell,
    Settings,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    TrendingUp,
    Clock,
    Cloud,
    CheckCircle2,
    Sparkles,
    LogOut,
    ChevronDown,
    HelpCircle,
    UtensilsCrossed,
    MapPin,
} from "lucide-react";

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
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

    const { user } = useAuth();
    const { account } = useAccount();

    const notifications = [
        {
            id: 1,
            type: "warning",
            icon: AlertTriangle,
            iconColor: "text-orange-600",
            bgColor: "bg-orange-50",
            title: "Low Stock Alert",
            message: "Carnitas down to 15 lbs. Reorder recommended for weekend rush.",
            time: "5 min ago",
            unread: true,
        },
        {
            id: 2,
            type: "insight",
            icon: TrendingUp,
            iconColor: "text-teal-600",
            bgColor: "bg-teal-50",
            title: "Pricing Opportunity",
            message: "AI suggests raising Carne Asada Burrito price to $12.50 based on demand.",
            time: "15 min ago",
            unread: true,
        },
        {
            id: 3,
            type: "prep",
            icon: ChefHat,
            iconColor: "text-purple-600",
            bgColor: "bg-purple-50",
            title: "Tomorrow's Prep Plan Ready",
            message: "Prep 40% more al pastor - high demand expected due to 75°F weather.",
            time: "1 hour ago",
            unread: true,
        },
        {
            id: 4,
            type: "weather",
            icon: Cloud,
            iconColor: "text-blue-600",
            bgColor: "bg-blue-50",
            title: "Weather Impact Alert",
            message: "Rain forecasted for Thursday. Expect 25% drop in foot traffic at usual spot.",
            time: "2 hours ago",
            unread: false,
        },
        {
            id: 5,
            type: "peak",
            icon: Clock,
            iconColor: "text-red-600",
            bgColor: "bg-red-50",
            title: "Rush Hour Incoming",
            message: "Peak period predicted at 12:30-1:15 PM. Prep extra quesadillas.",
            time: "3 hours ago",
            unread: false,
        },
        {
            id: 6,
            type: "success",
            icon: Sparkles,
            iconColor: "text-green-600",
            bgColor: "bg-green-50",
            title: "Waste Reduction Win!",
            message: "You reduced food waste by 22% this week. Keep it up!",
            time: "1 day ago",
            unread: false,
        },
        {
            id: 7,
            type: "customer",
            icon: Users,
            iconColor: "text-indigo-600",
            bgColor: "bg-indigo-50",
            title: "Customer Behavior Insight",
            message: "18 returning customers this week ordered vegetarian options. Consider expanding menu.",
            time: "2 days ago",
            unread: false,
        },
        {
            id: 8,
            type: "warning",
            icon: AlertTriangle,
            iconColor: "text-orange-600",
            bgColor: "bg-orange-50",
            title: "Menu Item Running Low",
            message: "Only 8 quesadillas worth of cheese remaining.",
            time: "2 days ago",
            unread: false,
        },
        {
            id: 9,
            type: "insight",
            icon: DollarSign,
            iconColor: "text-teal-600",
            bgColor: "bg-teal-50",
            title: "Revenue Milestone",
            message: "Congrats! You hit $5,000 in weekly revenue for the first time.",
            time: "3 days ago",
            unread: false,
        },
        {
            id: 10,
            type: "peak",
            icon: Calendar,
            iconColor: "text-purple-600",
            bgColor: "bg-purple-50",
            title: "Event Opportunity",
            message: "Street fair scheduled near your usual spot this Saturday. Book early!",
            time: "3 days ago",
            unread: false,
        },
    ];

    const unreadCount = notifications.filter((n) => n.unread).length;

    const handleNotificationClick = () => {
        setIsNotificationsOpen(false);
        navigate("/dashboard");
    };

    const navItems = [
        { path: "/dashboard", label: "Dashboard", icon: Home },
        { path: "/orders", label: "Orders", icon: UtensilsCrossed },
        { path: "/menu", label: "Menu", icon: ChefHat },
        { path: "/expenses", label: "Expenses", icon: DollarSign },
        { path: "/locations", label: "Locations", icon: MapPin },
        { path: "/dev", label: "Dev Console", icon: BarChart3 },
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
                                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                            >
                                <Menu className="h-5 w-5" />
                            </Button>

                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-teal-700">
                                    <Truck className="h-5 w-5 text-white" />
                                </div>

                                <span
                                    className="text-xl font-bold text-gray-900"
                                    style={{ fontFamily: "Poppins, sans-serif" }}
                                >
                                    Menumo
                                </span>

                                <div className="group relative ml-2">
                                    <div className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2 py-0.5">
                                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500"></div>
                                        <span className="hidden text-[10px] font-medium uppercase tracking-wide text-green-700 sm:inline">
                                            Online
                                        </span>
                                    </div>

                                    <div className="absolute left-0 top-full z-50 mt-2 hidden w-48 group-hover:block">
                                        <div className="rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
                                            <div className="mb-1 flex items-center gap-2">
                                                <CheckCircle2 className="h-3 w-3 text-green-400" />
                                                <span className="font-semibold">POS Connected</span>
                                            </div>
                                            <p className="text-gray-300">Data syncing in real-time</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative"
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            >
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>
                                )}
                            </Button>

                            <button
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
                <aside
                    className={`hidden min-h-[calc(100vh-4rem)] border-r border-gray-200 bg-white transition-all duration-300 lg:block ${isSidebarOpen ? "w-64" : "w-20"
                        }`}
                >
                    <div className="flex justify-end border-b border-gray-200 p-2">
                        <Button
                            variant="ghost"
                            size="icon"
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
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-teal-700">
                                        <Truck className="h-5 w-5 text-white" />
                                    </div>
                                    <span
                                        className="text-xl font-bold text-gray-900"
                                        style={{ fontFamily: "Poppins, sans-serif" }}
                                    >
                                        Menumo
                                    </span>
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
                            </nav>
                        </aside>
                    </>
                )}

                <main className="flex-1 overflow-x-hidden">{children}</main>
            </div>

            {isNotificationsOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsNotificationsOpen(false)}
                    />

                    <div className="absolute right-4 top-16 z-50 flex max-h-[calc(100vh-6rem)] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-200 p-4">
                            <div>
                                <h3
                                    className="text-lg font-bold text-gray-900"
                                    style={{ fontFamily: "Poppins, sans-serif" }}
                                >
                                    Notifications
                                </h3>
                                {unreadCount > 0 && (
                                    <p className="text-sm text-gray-500">{unreadCount} unread</p>
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsNotificationsOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {notifications.slice(0, 10).map((notification) => {
                                const Icon = notification.icon;

                                return (
                                    <button
                                        key={notification.id}
                                        onClick={handleNotificationClick}
                                        className={`w-full border-b border-gray-100 p-4 text-left transition-colors hover:bg-gray-50 ${notification.unread ? "bg-blue-50/30" : ""
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <div
                                                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${notification.bgColor}`}
                                            >
                                                <Icon className={`h-5 w-5 ${notification.iconColor}`} />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="mb-1 flex items-start justify-between gap-2">
                                                    <h4 className="text-sm font-semibold text-gray-900">
                                                        {notification.title}
                                                    </h4>
                                                    {notification.unread && (
                                                        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-teal-600"></span>
                                                    )}
                                                </div>

                                                <p className="mb-2 line-clamp-2 text-sm text-gray-600">
                                                    {notification.message}
                                                </p>

                                                <span className="text-xs text-gray-500">
                                                    {notification.time}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="border-t border-gray-200 bg-gray-50 p-3">
                            <Button
                                variant="ghost"
                                className="w-full text-sm font-medium text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                                onClick={() => {
                                    setIsNotificationsOpen(false);
                                    navigate("/dashboard");
                                }}
                            >
                                View All Notifications
                            </Button>
                        </div>
                    </div>
                </>
            )}

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
                            <button
                                onClick={() => {
                                    setIsAccountMenuOpen(false);
                                    navigate("/dashboard");
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                            >
                                <Settings className="h-5 w-5 text-gray-600" />
                                <div>
                                    <div className="text-sm font-medium text-gray-900">
                                        Settings
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Account, business & preferences
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setIsAccountMenuOpen(false);
                                    navigate("/dashboard");
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
