import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader/PageHeader";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";

/**
 * Optional location state used when a protected route
 * redirects user to login (stores the original path).
 */
type LocationState = { from?: string };

/**
 * AdminLoginPage
 *
 * Purpose:
 * - Handles admin authentication via JWT
 * - Stores access token in localStorage
 * - Redirects user after successful login
 */
export default function AdminLoginPage() {
  const nav = useNavigate();
  const location = useLocation();

  /**
   * Form state
   */
  const [username, setUsername] = useState("admin"); // Default for convenience
  const [password, setPassword] = useState("");

  /**
   * UI state
   */
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Determine where to redirect after login:
   * - If redirected from protected route → go back there
   * - Otherwise → default to /projects
   */
  const from =
    (location.state as LocationState | null)?.from?.toString() || "/projects";

  /**
   * Handles login form submission.
   * - Prevents default form reload
   * - Calls backend login API
   * - Saves JWT token
   * - Redirects user
   */
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError(null);
    setLoading(true);

    try {
      // Call POST /auth/login with plain credentials
      const res = await api.login(username.trim(), password);

      // Store JWT token for future authenticated requests
      setToken(res.accessToken);

      // Redirect user to intended page
      nav(from, { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="container"
      style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        
        {/* Page title */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <PageHeader
            title="Admin Login"
            subtitle="JWT-based access (admin only)"
          />
        </div>

        {/* Login form card */}
        <form onSubmit={onSubmit} className="card" style={{ padding: 18 }}>
          <div style={{ display: "grid", gap: 12 }}>

            {/* Username input */}
            <label>
              <div className="muted2">Username</div>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "rgba(0,0,0,0.12)",
                  color: "var(--text)",
                }}
              />
            </label>

            {/* Password input */}
            <label>
              <div className="muted2">Password</div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "rgba(0,0,0,0.12)",
                  color: "var(--text)",
                }}
              />
            </label>

            {/* Display backend or network errors */}
            {error && <div style={{ color: "salmon" }}>{error}</div>}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: 10,
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.10)",
                color: "var(--text)",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            {/* Development helper: shows redirect path */}
            <div
              className="muted2"
              style={{ fontSize: 12, textAlign: "center" }}
            >
              After login you’ll be redirected to:{" "}
              <span className="muted">{from}</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}