import React from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

/**
 * AdminLoginPage
 *
 * Everyone can view projects/tasks/updates.
 * Only admins can edit — admin mode is unlocked by storing a JWT token.
 *
 * Goal:
 * - If user clicks "Login" from Navbar -> redirect to /projects after login
 * - If user clicks "Edit" (or any protected admin action) -> redirect back to that page after login
 *
 * How it works:
 * - We read `?next=/some/path` from the URL.
 * - If missing, we default to "/projects".
 *
 * Examples:
 * - Navbar login link:   /admin/login
 *   -> next defaults to /projects
 *
 * - Edit button link:    /admin/login?next=/admin/projects/my-slug
 *   -> after login goes back to that project details page
 */

export default function AdminLoginPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  const { loginAsAdmin, isAdmin, logout } = useAuth();

  /**
   * Next page after login
   * - Navbar: no `next` param, so this becomes "/projects"
   * - Edit button: pass `next` param, so we return there
   */
  const next = params.get("next") || "/projects";

  // Backend expects "username" and "password"
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      /**
       * 1) Login request
       * NOTE: your api client should have:
       *  - api.loginAdmin(...) OR api.login(...)
       * Use whichever exists in your lib/api.ts.
       */
      const res =
        // @ts-expect-error - keep whichever you actually have
        (api.loginAdmin ? await api.loginAdmin(username, password) : await api.login(username, password));

      /**
       * 2) Store JWT in AuthContext/localStorage
       * This unlocks admin buttons everywhere
       */
      loginAsAdmin(res.accessToken);

      /**
       * 3) Redirect
       * - Navbar -> /projects
       * - Edit button -> back to project details (or wherever next points)
       */
      nav(next, { replace: true });
    } catch (err: any) {
      // http() throws: `HTTP ${status} ${statusText} – ${text}`
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 520 }}>
      {/* Back goes to where user came from logically */}
      <Link className="backLink" to={next === "/projects" ? "/projects" : "/projects"}>
        ← Back
      </Link>

      <h1 className="h2">Admin Login</h1>
      <p className="muted">Sign in to enable edit mode.</p>

      {/* If already logged in, show “admin active” + logout */}
      {isAdmin ? (
        <div className="card" style={{ padding: 14 }}>
          <p style={{ marginTop: 0 }}>✅ Admin mode is active.</p>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => {
                logout();
                nav("/projects", { replace: true });
              }}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              Logout
            </button>

            <button
              type="button"
              onClick={() => nav(next, { replace: true })}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.10)",
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              Continue
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} autoComplete="off" style={{ display: "grid", gap: 10 }}>
            <input
              type="text"
              name="username"
              autoComplete="username"
              style={{ display: "none" }}
              tabIndex={-1}
            />
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              style={{ display: "none" }}
              tabIndex={-1}
            />

            <input
              value={username}
              name="admin-user"
              autoComplete="off"
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "rgba(0,0,0,0.12)",
                color: "var(--text)",
              }}
            />

  <input
    value={password}
    type="password"
    name="admin-pass"
    autoComplete="new-password"
    onChange={(e) => setPassword(e.target.value)}
    placeholder="Password"
    style={{
      padding: 10,
      borderRadius: 10,
      border: "1px solid var(--border)",
      background: "rgba(0,0,0,0.12)",
      color: "var(--text)",
    }}
  />


          {/* Error message banner */}
          {error && (
            <div
              role="alert"
              style={{
                border: "1px solid rgba(255, 80, 80, 0.35)",
                background: "rgba(255, 80, 80, 0.12)",
                padding: 12,
                borderRadius: 12,
                color: "var(--text)",
              }}
            >
              {error}
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.10)",
              color: "var(--text)",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      )}
    </main>
  );
}