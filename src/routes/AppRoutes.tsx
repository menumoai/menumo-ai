import { Routes, Route } from "react-router-dom";
import { LandingPage } from "../pages/LandingPage";
import { AuthPage } from "../pages/AuthPage";
import { MenuPage } from "../pages/MenuPage";
import { OrdersPage } from "../pages/OrdersPage";
import { CreateOrderPage } from "../pages/CreateOrderPage";
import { DashboardPage } from "../pages/DashboardPage";
import { OrderDetailPage } from "../pages/OrderDetailPage";
import { BrowseTrucksPage } from "../pages/BrowseTrucksPage";
import ExpensesPage from "../pages/ExpensesPage";
import { DevConsole } from "../pages/DevConsole";
import { BusinessRoute } from "./RouteGuards";

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
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
                path="/dev"
                element={
                    <BusinessRoute>
                        <DevConsole />
                    </BusinessRoute>
                }
            />

            <Route path="*" element={<LandingPage />} />
        </Routes>
    );
}
