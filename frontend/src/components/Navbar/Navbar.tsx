import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AccessChoiceModal from "../AccessChoiceModal";
import "./navbar.css";

/**
 * Navbar
 *
 * - Always: Projects
 * - One auth button:
 *   - Login (if logged out) -> opens AccessChoiceModal (Admin or Demo)
 *   - Logout (if logged in) -> clears auth and goes to /projects
 *
 * - Title changes:
 *   - Portfolio Tracker
 *   - Portfolio Tracker – Admin (ADMIN)
 *   - Portfolio Tracker – Demo (DEMO)
 *
 * - Removes "Admin" link from navbar (you asked this)
 */
export default function Navbar() {
  const nav = useNavigate();
  const location = useLocation();
  const { isAdmin, isDemo, logout } = useAuth();

  // Access choice modal
  const [choiceOpen, setChoiceOpen] = useState(false);

  const title = isAdmin
    ? "Portfolio Tracker – Admin"
    : isDemo
    ? "Portfolio Tracker – Demo"
    : "Portfolio Tracker";

  /**
   * Where should we return after login?
   * - From navbar login, we return to whatever page user is currently on.
   * - Example: /projects/my-app  OR /demo/projects/x (if they were already browsing)
   */
  function getNextPath() {
    return location.pathname + location.search;
  }

  function handleAuthClick() {
    // Logged in -> Logout and return to public projects
    if (isAdmin || isDemo) {
      logout();
      nav("/projects", { replace: true });
      return;
    }

    // Logged out -> show choice modal (Admin or Demo)
    setChoiceOpen(true);
  }

  function goAdminLogin() {
    const next = getNextPath();
    setChoiceOpen(false);
    nav(`/admin/login?next=${encodeURIComponent(next)}`);
  }

  function goDemoLogin() {
    const next = getNextPath();
    setChoiceOpen(false);
    nav(`/demo/login?next=${encodeURIComponent(next)}`);
  }

  return (
    <header className="navWrap">
      <div className="navInner">
        <Link className="brand" to="/projects">
          {title}
        </Link>

        <nav className="navLinks">
          <NavLink
            to="/projects"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Projects
          </NavLink>

          <button type="button" className="navBtn" onClick={handleAuthClick}>
            {isAdmin || isDemo ? "Logout" : "Login"}
          </button>
        </nav>
      </div>

      {/* Access choice modal (Admin vs Demo) */}
      <AccessChoiceModal
        open={choiceOpen}
        onClose={() => setChoiceOpen(false)}
        onAdmin={goAdminLogin}
        onDemo={goDemoLogin}
      />
    </header>
  );
}