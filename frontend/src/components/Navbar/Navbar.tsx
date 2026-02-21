import { Link, NavLink, useNavigate } from "react-router-dom";
import { clearToken, isAuthed } from "../../lib/auth";
import "./navbar.css";

/**
 * Navbar Component
 *
 * Purpose:
 * - Displays main navigation links across the app
 * - Shows different options depending on authentication status
 * - Handles logout functionality
 *
 * Behavior:
 * - If authenticated:
 *    • Shows Projects + Admin links
 *    • Shows Logout button
 * - If not authenticated:
 *    • Shows Login link only
 */
export default function Navbar() {
  const nav = useNavigate();

  // Check if user is authenticated (based on stored token)
  const authed = isAuthed();

  /**
   * Logout handler:
   * - Clears stored authentication token
   * - Redirects user to login page
   * - replace:true prevents going back to protected pages
   */
  function logout() {
    clearToken();
    nav("/admin/login", { replace: true });
  }

  return (
    <header className="navWrap">
      <div className="navInner">

        {/* Brand logo/title — redirects depending on auth status */}
        <Link className="brand" to={authed ? "/projects" : "/admin/login"}>
          Portfolio Tracker
        </Link>

        <nav className="navLinks">

          {/* Authenticated navigation */}
          {authed && (
            <>
              {/* Main projects page */}
              <NavLink
                to="/projects"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Projects
              </NavLink>

              {/* Admin dashboard (optional/admin-only area) */}
              <NavLink
                to="/admin"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Admin
              </NavLink>

              {/* Logout button */}
              <button type="button" className="navBtn" onClick={logout}>
                Logout
              </button>
            </>
          )}

          {/* Guest navigation */}
          {!authed && (
            <NavLink
              to="/admin/login"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}