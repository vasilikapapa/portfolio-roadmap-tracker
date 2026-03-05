import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

/**
 * RequireDemoAuth
 *
 * - Allows only DEMO role into /demo routes
 * - Redirects to /demo/login otherwise
 */
export default function RequireDemoAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isDemo } = useAuth();
  const loc = useLocation();

  if (!isDemo) {
    return <Navigate to="/demo/login" replace state={{ from: loc.pathname }} />;
  }

  return <>{children}</>;
}