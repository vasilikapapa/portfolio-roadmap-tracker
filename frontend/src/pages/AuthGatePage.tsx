import { Link, useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader/PageHeader";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

/**
 * AuthGatePage
 *
 * Shown when user tries to do an ADMIN action without ADMIN auth.
 * Offers:
 * - Admin login (go to /admin/login)
 * - Continue as Demo/Test (1-click demo login)
 */
export default function AuthGatePage() {
  const nav = useNavigate();
  const loc = useLocation() as any;

  const { isAdmin, loginAsDemo } = useAuth();

  // where to go after login
  const next = loc?.state?.next ?? "/projects";

  async function continueAsDemo() {
    const res = await api.demoLogin();
    loginAsDemo(res.accessToken);
    nav(next, { replace: true });
  }

  return (
    <main className="container">
      <Link className="backLink" to="/projects">
        ← Back
      </Link>

      <PageHeader
        title="Admin access required"
        subtitle="Login as Admin to edit real projects, or continue in Demo/Test mode."
      />

      <div className="card" style={{ padding: 16, maxWidth: 720 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {/* Admin path */}
          <Link
            to="/admin/login"
            state={{ next }}
            className="card-soft"
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              textDecoration: "none",
              color: "var(--text)",
            }}
          >
            Login as Admin
          </Link>

          {/* Demo path */}
          <button
            type="button"
            onClick={continueAsDemo}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.10)",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            Continue as Demo/Test
          </button>

          {/* If already admin */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => nav(next, { replace: true })}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              Continue
            </button>
          )}
        </div>

        <p className="muted" style={{ marginTop: 12 }}>
          Demo/Test changes are sandbox-only and can be reset anytime.
        </p>
      </div>
    </main>
  );
}