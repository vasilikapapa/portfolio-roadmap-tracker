import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

/**
 * AdminLoginPage
 *
 * Everyone can view projects/tasks/updates.
 * Only admins can edit — admin mode is unlocked by storing a JWT token.
 *
 * This page:
 * - Calls api.login(username, password)
 * - Saves accessToken into AuthContext (and localStorage)
 * - Redirects after login
 */

export default function AdminLoginPage() {
  const nav = useNavigate();
  const { login, isAdmin, logout } = useAuth();

  // Your backend expects "username" (not email) based on your api.login signature.
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1) Login request (skipAuth happens inside api.login)
      const res = await api.login(username, password);

      // 2) Store the JWT token (this unlocks admin buttons everywhere)
      // Your response is: { accessToken, tokenType, expiresAt }
      login(res.accessToken);

      // 3) Redirect after successful login
      nav("/admin");
    } catch (err: any) {
      // Your http() throws: `HTTP ${status} ${statusText} – ${text}`
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h1>Admin Login</h1>

      {/* If already logged in, show “admin active” + logout */}
      {isAdmin ? (
        <>
          <p>✅ Admin mode is active.</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <form onSubmit={onSubmit}>
          <label>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%", marginBottom: 12 }}
            autoComplete="username"
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", marginBottom: 12 }}
            autoComplete="current-password"
          />

          {/* Show login error if any */}
          {error && <p style={{ marginTop: 8 }}>{error}</p>}

          <button disabled={loading} type="submit">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      )}
    </div>
  );
}