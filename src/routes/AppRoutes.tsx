import { Routes, Route } from "react-router-dom";
import { LandingPage } from "../pages/LandingPage";
import { AuthPage } from "../pages/AuthPage";
import { GetStartedPage } from "../pages/GetStartedPage";
import { MenuPage } from "../pages/MenuPage";
import InventoryPage from "../pages/InventoryPage";
import { OrdersPage } from "../pages/OrdersPage";
import { CreateOrderPage } from "../pages/CreateOrderPage";
import { DashboardPage } from "../pages/DashboardPage";
import { AnalyticsRevenuePage } from "../pages/AnalyticsRevenuePage";
import FinanceTaxesPage from "../pages/FinanceTaxesPage";
import { OrderDetailPage } from "../pages/OrderDetailPage";
import { BrowseTrucksPage } from "../pages/BrowseTrucksPage";
import ExpensesPage from "../pages/ExpensesPage";
import { DevConsole } from "../pages/DevConsole";
import { BusinessRoute, InternalRoute } from "./RouteGuards";

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            {/* Public on purpose: this is the brief a prospect reads before
                signing up. It renders a personalized checklist once there is
                an account, but it never requires one. */}
            <Route path="/get-started" element={<GetStartedPage />} />
            <Route
                path="/locations"
                element={
                    <BusinessRoute>
                        <BrowseTrucksPage />
                    </BusinessRoute>
                }
            />
            <Route
                path="/menu"
                element={
                    <BusinessRoute>
                        <MenuPage />
                    </BusinessRoute>
                }
            />
            <Route
                path="/inventory"
                element={
                    <BusinessRoute>
                        <InventoryPage />
                    </BusinessRoute>
                }
            />
            <Route
                path="/expenses"
                element={
                    <BusinessRoute>
                        <ExpensesPage />
                    </BusinessRoute>
                }
            />
            <Route
                path="/orders"
                element={
                    <BusinessRoute>
                        <OrdersPage />
                    </BusinessRoute>
                }
            />
            <Route
                path="/orders/:orderId"
                element={
                    <BusinessRoute>
                        <OrderDetailPage />
                    </BusinessRoute>
                }
            />
            <Route
                path="/orders/new"
                element={
                    <BusinessRoute>
                        <CreateOrderPage />
                    </BusinessRoute>
                }
            />
            <Route
                path="/dashboard"
                element={
                    <BusinessRoute>
                        <DashboardPage />
                    </BusinessRoute>
                }
            />
            <Route
                path="/analytics/revenue"
                element={
                    <BusinessRoute>
                        <AnalyticsRevenuePage />
                    </BusinessRoute>
                }
            />
            <Route
                path="/finance"
                element={
                    <BusinessRoute>
                        <FinanceTaxesPage />
                    </BusinessRoute>
                }
            />
            <Route
                path="/dev"
                element={
                    /* Staff only. The console seeds and overwrites data, so it
                       must never be reachable by a customer. */
                    <InternalRoute>
                        <DevConsole />
                    </InternalRoute>
                }
            />

            <Route path="*" element={<LandingPage />} />
        </Routes>
    );
}
