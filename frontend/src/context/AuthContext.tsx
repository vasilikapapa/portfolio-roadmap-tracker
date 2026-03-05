import React from "react";
import { clearAuth, getRole, getToken, setAuth, type AuthRole } from "../lib/auth";

/**
 * AuthContext
 *
 * Tracks:
 * - access token
 * - role (ADMIN vs DEMO)
 *
 * NOTE:
 * - ADMIN: protected real CRUD
 * - DEMO: protected demo CRUD (sandbox)
 */
type AuthContextType = {
  token: string | null;
  role: AuthRole | null;

  isAdmin: boolean;
  isDemo: boolean;

  loginAsAdmin: (token: string) => void;
  loginAsDemo: (token: string) => void;
  logout: () => void;
};

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Init from storage
  const [token, setTokenState] = React.useState<string | null>(getToken());
  const [role, setRoleState] = React.useState<AuthRole | null>(getRole());

  function login(role: AuthRole, token: string) {
    setAuth(token, role);
    setTokenState(token);
    setRoleState(role);
  }

  function logout() {
    clearAuth();
    setTokenState(null);
    setRoleState(null);
  }

  const value: AuthContextType = {
    token,
    role,

    isAdmin: role === "ADMIN" && Boolean(token),
    isDemo: role === "DEMO" && Boolean(token),

    loginAsAdmin: (t) => login("ADMIN", t),
    loginAsDemo: (t) => login("DEMO", t),
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}