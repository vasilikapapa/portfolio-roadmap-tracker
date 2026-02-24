import { Navigate } from "react-router-dom";

/**
 * HomeRedirect
 *
 * Purpose:
 * - Redirects users from the root route ("/") to the correct page
 *   depending on authentication status.
 *
 * Behavior:
 * - If authenticated → redirect to "/projects"
 * - If not authenticated → redirect to "/admin/login"
 *
 * `replace` ensures the redirect does not stay in browser history,
 * preventing users from navigating back to the redirect page.
 */
export default function HomeRedirect() {
  return <Navigate to="/projects" replace />;
}