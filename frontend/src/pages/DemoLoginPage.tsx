import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

/**
 * DemoLoginPage
 *
 * Simple “Try the demo” login.
 * - Clears any old/expired token first (important!)
 * - Calls demo login (must use skipAuth on API client)
 * - Stores DEMO role token
 * - Redirects into /demo
 */
export default function DemoLoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // ✅ default should be demo home
  const next = params.get("next") || "/demo/projects";

  const { loginAsDemo, logout } = useAuth();

  // (optional) keep inputs, but demo login can also be “button only”
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("demo-portfolio-2026!");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // remove old ADMIN token so it can't be attached to this request
  useEffect(() => {
    logout(); // clears localStorage + resets AuthContext state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function friendlyErrorMessage(raw: string) {
    if (!raw) return "Something went wrong.";

    // Network / CORS / backend down
    if (raw.includes("Failed to fetch") || raw.includes("NetworkError")) {
      return "Cannot reach the backend. Make sure the API is running and VITE_API_URL is correct.";
    }

    // http() throws: "HTTP 401 Unauthorized – ..."
    if (raw.includes("HTTP 401")) {
      return "Demo login failed (401). Check demo username/password are configured on the backend env vars.";
    }

    if (raw.includes("HTTP 403")) {
      return "Access denied (403). Spring Security is blocking /auth/demo/login. Ensure it is permitAll().";
    }

    // JWT expired (sometimes backend returns this)
    if (raw.toLowerCase().includes("jwt") && raw.toLowerCase().includes("expired")) {
      return "Your token is expired. Please try logging in again.";
    }

    // Fallback: keep raw (useful while debugging)
    return raw;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      // demo login should NOT send Authorization header (skipAuth=true in api.ts)
      const res = await api.loginDemo(username, password);

      // ✅ save token as DEMO role
      loginAsDemo(res.accessToken);

      // ✅ go to demo area
      navigate(next, { replace: true });
    } catch (e: any) {
      setError(friendlyErrorMessage(String(e?.message ?? e)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 520 }}>
      <Link className="backLink" to="/projects">
        ← Back
      </Link>

      <h1 className="h2">Demo Login</h1>
      <p className="muted">
        Demo is a sandbox. You can create/edit/delete safely and reset.
      </p>

      {/* Error message banner */}
      {error && (
        <div
          role="alert"
          style={{
            border: "1px solid rgba(255, 80, 80, 0.35)",
            background: "rgba(255, 80, 80, 0.12)",
            padding: 12,
            borderRadius: 12,
            marginBottom: 12,
            color: "var(--text)",
          }}
        >
          <strong style={{ display: "block", marginBottom: 6 }}>
            Demo login failed
          </strong>
          <div style={{ opacity: 0.95 }}>{error}</div>
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          autoComplete="username"
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
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          autoComplete="current-password"
          style={{
            padding: 10,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "rgba(0,0,0,0.12)",
            color: "var(--text)",
          }}
        />

        <button
          type="submit"
          disabled={loading}
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
          {loading ? "Signing in..." : "Continue as Demo"}
        </button>
      </form>
    </main>
  );
}