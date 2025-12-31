import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import { AccountProvider } from "./account/AccountContext";
import { AppShell } from "./layout/AppShell";

import { AppRoutes } from "./routes/AppRoutes";

function App() {
    return (
        <AuthProvider>
            <AccountProvider>
                <BrowserRouter>
                    <AppShell>
                        <AppRoutes />
                    </AppShell>
                </BrowserRouter>
            </AccountProvider>
        </AuthProvider>
    );
}

export default App;
