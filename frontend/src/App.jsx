import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { PERMISSIONS } from "./constants/permissions";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout";

// Public pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Authenticated pages
import Dashboard from "./pages/Dashboard";
import SearchPage from "./pages/SearchPage";
import BookDetailPage from "./pages/BookDetailPage";
import CheckoutPage from "./pages/CheckoutPage";
import ReturnPage from "./pages/ReturnPage";
import OverduePage from "./pages/OverduePage";
import HistoryPage from "./pages/HistoryPage";
import CatalogPage from "./pages/CatalogPage";
import UsersPage from "./pages/UsersPage";
import ReportsPage from "./pages/ReportsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import SettingsPage from "./pages/SettingsPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/**
 * Wraps a route element and checks if the current user has the required
 * permission. Renders <UnauthorizedPage /> inside the layout if not.
 *
 * Usage: <Route path="/users" element={<RoleRoute permission={PERMISSIONS.MANAGE_USERS}><UsersPage /></RoleRoute>} />
 */
function RoleRoute({ permission, children }) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <UnauthorizedPage />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      {/* ── Public routes ── */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* ── Authenticated routes (inside sidebar layout) ── */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* General — all authenticated users */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
        <Route path="/history" element={<HistoryPage />} />

        {/* Circulation — librarian & admin */}
        <Route
          path="/checkout"
          element={
            <RoleRoute permission={PERMISSIONS.CHECKOUT_BOOK}>
              <CheckoutPage />
            </RoleRoute>
          }
        />
        <Route
          path="/return"
          element={
            <RoleRoute permission={PERMISSIONS.RETURN_BOOK}>
              <ReturnPage />
            </RoleRoute>
          }
        />
        <Route
          path="/overdue"
          element={
            <RoleRoute permission={PERMISSIONS.VIEW_OVERDUE}>
              <OverduePage />
            </RoleRoute>
          }
        />

        {/* Management — librarian (catalog) & admin (catalog + users) */}
        <Route
          path="/catalog"
          element={
            <RoleRoute permission={PERMISSIONS.MANAGE_CATALOG}>
              <CatalogPage />
            </RoleRoute>
          }
        />
        <Route
          path="/users"
          element={
            <RoleRoute permission={PERMISSIONS.MANAGE_USERS}>
              <UsersPage />
            </RoleRoute>
          }
        />

        {/* Analytics — librarian & admin */}
        <Route
          path="/reports"
          element={
            <RoleRoute permission={PERMISSIONS.VIEW_REPORTS}>
              <ReportsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <RoleRoute permission={PERMISSIONS.VIEW_AUDIT_LOGS}>
              <AuditLogsPage />
            </RoleRoute>
          }
        />

        {/* Settings — admin only */}
        <Route
          path="/settings"
          element={
            <RoleRoute permission={PERMISSIONS.MANAGE_SETTINGS}>
              <SettingsPage />
            </RoleRoute>
          }
        />

        {/* Unauthorized fallback inside layout */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      {/* ── Default: redirect to login ── */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
