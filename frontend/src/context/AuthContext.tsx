import React from "react";
import { getToken, setToken, clearToken } from "../lib/auth";

/**
 * AuthContext
 *
 * This keeps auth state inside React.
 * It allows any component to know:
 * - Is admin logged in?
 * - What is the token?
 * - How to login/logout?
 */

type AuthContextType = {
  token: string | null;
  isAdmin: boolean;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage
  const [token, setTokenState] = React.useState<string | null>(getToken());

  /** Login: save token to storage + state */
  const login = (newToken: string) => {
    setToken(newToken);
    setTokenState(newToken);
  };

  /** Logout: clear token */
  const logout = () => {
    clearToken();
    setTokenState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAdmin: Boolean(token),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Custom hook to use auth anywhere */
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}