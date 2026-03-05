import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * RequireAdminAuth
 *
 * If not ADMIN -> redirect to /auth-gate
 * so user can choose admin login or demo/test mode.
 */
export default function RequireAdminAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin } = useAuth();
  const loc = useLocation();

  if (!isAdmin) {
    return (
      <Navigate
        to="/auth-gate"
        replace
        state={{ next: loc.pathname }}
      />
    );
  }

  return <>{children}</>;
}