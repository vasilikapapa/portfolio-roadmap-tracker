import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./navbar.css";

/**
 * Navbar Component
 *
 * Behavior:
 * - Always shows Projects link
 * - Shows ONE auth button:
 *    • Login (if not admin)
 *    • Logout (if admin)
 * - Title changes if logged in:
 *    • "Portfolio Tracker – Admin"
 */
export default function Navbar() {
  const nav = useNavigate();
  const { isAdmin, logout } = useAuth();

  /**
   * Auth button handler:
   * - If admin → logout and return to projects
   * - If not admin → go to login page
   */
  function handleAuthClick() {
    if (isAdmin) {
      logout();
      nav("/projects", { replace: true });
    } else {
      nav("/admin/login");
    }
  }

  return (
    <header className="navWrap">
      <div className="navInner">

        {/* Brand / Title */}
        <Link className="brand" to="/projects">
          {isAdmin ? "Portfolio Tracker – Admin" : "Portfolio Tracker"}
        </Link>

        <nav className="navLinks">
          {/* Always visible */}
          <NavLink
            to="/projects"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Projects
          </NavLink>

          {/* Single Auth Button */}
          <button
            type="button"
            className="navBtn"
            onClick={handleAuthClick}
          >
            {isAdmin ? "Logout" : "Login"}
          </button>
        </nav>
      </div>
    </header>
  );
}