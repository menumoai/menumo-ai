import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
} from "react-router-dom";

import { DevConsole } from "./pages/DevConsole";
import { MenuPage } from "./pages/MenuPage";
import { OrdersPage } from "./pages/OrdersPage";
import { CreateOrderPage } from "./pages/CreateOrderPage";
import { AuthPage } from "./pages/AuthPage";
import { CustomerOrderFormPage } from "./pages/CustomerOrderFormPage"; // we'll create this in the next step

import { AuthProvider, useAuth } from "./auth/AuthContext";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p style={{ padding: "1.5rem" }}>Checking auth...</p>;
  }

  if (!user) {
    return (
      <div style={{ padding: "1.5rem" }}>
        <h2>Sign in required</h2>
        <p>
          This area is for staff only. Please{" "}
          <Link to="/auth">log in or sign up</Link> to continue.
        </p>
      </div>
    );
  }

  return children;
}

function Shell() {
  const { user, logout, loading } = useAuth();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <header
        style={{
          padding: "0.75rem 1.5rem",
          borderBottom: "1px solid #eee",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          <h1 style={{ margin: 0, fontSize: "1.25rem" }}>Menumo AI</h1>
        </Link>

        <nav
          style={{
            display: "flex",
            gap: "1rem",
            fontSize: "0.95rem",
            alignItems: "center",
          }}
        >
          <NavLink
            to="/menu"
            style={({ isActive }) => ({
              textDecoration: "none",
              color: isActive ? "#2563eb" : "#333",
              fontWeight: isActive ? 600 : 400,
            })}
          >
            Menu
          </NavLink>
          <NavLink
            to="/orders"
            style={({ isActive }) => ({
              textDecoration: "none",
              color: isActive ? "#2563eb" : "#333",
              fontWeight: isActive ? 600 : 400,
            })}
          >
            Orders
          </NavLink>
          <NavLink
            to="/dev"
            style={({ isActive }) => ({
              textDecoration: "none",
              color: isActive ? "#2563eb" : "#666",
              fontWeight: isActive ? 600 : 400,
            })}
          >
            Dev Console
          </NavLink>
          <NavLink
            to="/order-form"
            style={({ isActive }) => ({
              textDecoration: "none",
              color: isActive ? "#16a34a" : "#333",
              fontWeight: isActive ? 600 : 400,
            })}
          >
            Customer Form
          </NavLink>

          <span style={{ marginLeft: "1rem", fontSize: "0.85rem", color: "#555" }}>
            {loading
              ? "Checking..."
              : user
              ? `Signed in as ${user.email ?? user.uid}`
              : "Not signed in"}
          </span>

          {user ? (
            <button
              onClick={() => logout()}
              style={{ marginLeft: "0.5rem", fontSize: "0.85rem" }}
            >
              Logout
            </button>
          ) : (
            <Link to="/auth" style={{ marginLeft: "0.5rem", fontSize: "0.85rem" }}>
              Auth
            </Link>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<RequireAuth><MenuPage /></RequireAuth>} />
          <Route path="/menu" element={<RequireAuth><MenuPage /></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
          <Route path="/orders/new" element={<RequireAuth><CreateOrderPage /></RequireAuth>} />
          <Route path="/dev" element={<RequireAuth><DevConsole /></RequireAuth>} />
          <Route path="/auth" element={<AuthPage />} />
          {/* Customer-facing form – no auth required */}
          <Route path="/order-form" element={<CustomerOrderFormPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
