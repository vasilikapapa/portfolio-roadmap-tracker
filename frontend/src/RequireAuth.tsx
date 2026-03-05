import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

/**
 * RequireAuth
 *
 * Protects routes by role.
 *
 * Behavior:
 * - ADMIN routes → redirect to /admin/login
 * - DEMO routes → redirect to /projects (public site)
 */
export default function RequireAuth({
  allow,
  children,
}: {
  allow: Array<"ADMIN" | "DEMO">;
  children: React.ReactNode;
}) {
  const { isAdmin, isDemo } = useAuth();

  const roleOk =
    (allow.includes("ADMIN") && isAdmin) ||
    (allow.includes("DEMO") && isDemo);

  if (roleOk) return <>{children}</>;

  // DEMO routes → send user to public projects
  if (allow.includes("DEMO")) {
    return <Navigate to="/projects" replace />;
  }

  // ADMIN routes → login
  return <Navigate to="/admin/login" replace />;
}