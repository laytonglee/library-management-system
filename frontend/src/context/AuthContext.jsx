import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import * as authService from "@/services/authService";
import { hasPermission, getPermissionsForRole } from "@/constants/permissions";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // On mount, try to restore session from cookie via /auth/me
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const { data } = await authService.getMe();
        if (!cancelled) {
          setUser(data.data.user);
        }
      } catch {
        // No valid session — user stays null
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await authService.login(credentials);
    setUser(data.data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Clear state even if API fails
    }
    setUser(null);
    navigate("/login");
  }, [navigate]);

  // Derive the role string once (e.g. "student", "admin")
  const role = user?.role?.name ?? null;

  const checkPermission = useCallback(
    (permission) => (role ? hasPermission(role, permission) : false),
    [role],
  );

  const checkRole = useCallback(
    (...roles) => (role ? roles.includes(role) : false),
    [role],
  );

  const permissions = useMemo(
    () => (role ? getPermissionsForRole(role) : []),
    [role],
  );

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    role,
    permissions,
    hasPermission: checkPermission,
    hasRole: checkRole,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
