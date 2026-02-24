import { Navigate, useLocation } from "react-router-dom";
import { isAdmin } from "./lib/auth";

/**
 * ==========================================
 * RequireAuth Component
 * ==========================================
 *
 * Purpose:
 * - Protects routes that require authentication
 * - Redirects unauthenticated users to login page
 * - Preserves intended destination for post-login redirect
 *
 * Usage:
 * Wrap protected routes like:
 *
 * <RequireAuth>
 *   <ProtectedPage />
 * </RequireAuth>
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {

  // Current route location (used for redirect after login)
  const loc = useLocation();

  /**
   * If user is not authenticated:
   * - Redirect to admin login page
   * - Save attempted path in state ("from")
   *   so login flow can redirect back after success.
   */
  if (!isAdmin()) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: loc.pathname }}
      />
    );
  }

  // User authenticated → render protected content
  return <>{children}</>;
}