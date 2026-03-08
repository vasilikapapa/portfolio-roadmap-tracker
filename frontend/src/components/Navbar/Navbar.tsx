import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AccessChoiceModal from "../AccessChoiceModal";
import "./navbar.css";

/**
 * Navbar
 *
 * Features:
 * - Brand title changes depending on mode:
 *      Portfolio Tracker
 *      Portfolio Tracker – Admin
 *      Portfolio Tracker – Demo
 *
 * - "Projects" link destination:
 *      Public/Admin -> /projects
 *      Demo         -> /demo
 *
 * - Login button:
 *      Opens modal to choose Admin or Demo login
 *
 * - Logout button:
 *      Clears auth and returns to public projects
 */

export default function Navbar() {
  const nav = useNavigate();
  const location = useLocation();
  const { isAdmin, isDemo, logout } = useAuth();

  // Modal state for Admin vs Demo login choice
  const [choiceOpen, setChoiceOpen] = useState(false);

  /**
   * Navbar title changes based on current auth mode.
   */
  const title = isAdmin
    ? "Portfolio Tracker – Admin"
    : isDemo
    ? "Portfolio Tracker – Demo"
    : "Portfolio Tracker";

  /**
   * Determine where the Projects link should go.
   * Demo users should stay inside the sandbox.
   */
  const projectsPath = isDemo ? "/demo" : "/projects";

  /**
   * Determine return path after login.
   * Keeps the user on the same page after authentication.
   */
  function getNextPath() {
    return location.pathname + location.search;
  }

  /**
   * Auth button behavior:
   *
   * If logged in:
   *      logout and return to public projects
   *
   * If logged out:
   *      open login choice modal
   */
  function handleAuthClick() {
    if (isAdmin || isDemo) {
      logout();
      nav("/projects", { replace: true });
      return;
    }

    setChoiceOpen(true);
  }

  /**
   * Admin login flow
   *
   * Redirects to admin login with a return path.
   */
  function goAdminLogin() {
    const next = getNextPath();
    setChoiceOpen(false);
    nav(`/admin/login?next=${encodeURIComponent(next)}`);
  }

  /**
   * Demo login flow
   *
   * Converts public routes to sandbox routes:
   *
   * /projects              -> /demo
   * /projects/my-project   -> /demo/projects/my-project
   */
  function goDemoLogin() {
    const path = getNextPath();
    let next = "/demo";

    if (path === "/projects") {
      next = "/demo";
    } else if (path.startsWith("/projects/")) {
      next = `/demo${path}`;
    } else if (path.startsWith("/demo")) {
      next = path;
    }

    setChoiceOpen(false);
    nav(`/demo/login?next=${encodeURIComponent(next)}`);
  }

  return (
    <header className="navWrap">
      <div className="navInner">

        {/* Brand always links to correct home */}
        <Link className="brand" to={projectsPath}>
          {title}
        </Link>

        <nav className="navLinks">

          {/* Projects link adapts for demo mode */}
          <NavLink
            to={projectsPath}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Projects
          </NavLink>

          {/* Login / Logout button */}
          <button
            type="button"
            className="navBtn"
            onClick={handleAuthClick}
          >
            {isAdmin || isDemo ? "Logout" : "Login"}
          </button>

        </nav>
      </div>

      {/* Modal allowing user to choose Admin or Demo login */}
      <AccessChoiceModal
        open={choiceOpen}
        onClose={() => setChoiceOpen(false)}
        onAdmin={goAdminLogin}
        onDemo={goDemoLogin}
      />
    </header>
  );
}