import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader/PageHeader";
import { api, type CreateProjectRequest, type ProjectDto } from "../lib/api";
import { useAuth } from "../context/AuthContext";

/**
 * DemoHomePage
 *
 * Demo version of ProjectsPage:
 * - Lists demo projects (/demo/projects)
 * - Allows full CRUD on demo projects
 *   - Create Project
 *
 * NOTE:
 * Tasks/updates are handled inside DemoProjectDetailsPage
 */
export default function DemoHomePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Project modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");

  const [formError, setFormError] = useState<string | null>(null);

  function resetForm() {
    setSlug("");
    setName("");
    setSummary("");
    setDescription("");
    setTechStack("");
    setRepoUrl("");
    setLiveUrl("");
    setFormError(null);
  }

  function closeCreateModal() {
    setCreateOpen(false);
    setFormError(null);
  }

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const list = await api.demoListProjects();
      setProjects(list);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const sortedProjects = useMemo(() => {
    const p = [...projects];
    // newest-first if createdAt exists
    p.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return p;
  }, [projects]);

  /**
   * Back-to-login should behave like navbar logout:
   * - Delete demo data
   * - Clear token/role
   * - Navigate away
   */
  async function logoutAndResetDemo() {
      logout();
      navigate("/projects", { replace: true });
  }

  async function onCreateProject() {
    setFormError(null);

    const s = slug.trim();
    const n = name.trim();

    if (!s) return setFormError("Slug is required.");
    if (!n) return setFormError("Name is required.");

    // optional: basic slug cleanup (keeps it recruiter-friendly)
    const safeSlug = s
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const payload: CreateProjectRequest = {
      slug: safeSlug,
      name: n,
      summary: summary.trim() ? summary.trim() : null,
      description: description.trim() ? description.trim() : null,
      techStack: techStack.trim() ? techStack.trim() : null,
      repoUrl: repoUrl.trim() ? repoUrl.trim() : null,
      liveUrl: liveUrl.trim() ? liveUrl.trim() : null,
    };

    try {
      setCreating(true);
      setError(null);

      const created = await api.demoCreateProject(payload);
      setProjects((prev) => [created, ...prev]);

      // ✅ close modal + clear form
      closeCreateModal();
      resetForm();

      // ✅ refresh list so the new project appears immediately
      await load();
    } catch (e: any) {
      setFormError(String(e?.message ?? e));
    } finally {
      setCreating(false);
    }
  }


  return (
    <main className="container">
      {/* Back to login should logout + reset demo */}
      <button
        type="button"
        onClick={logoutAndResetDemo}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: "white"
        }}
      >
        ← Back to public view
      </button>

      <PageHeader
        title="Demo Dashboard"
        subtitle="Sandbox projects (safe to edit)."
        right={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setFormError(null);
                setCreateOpen(true);
              }}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.10)",
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              + Create Project
            </button>
          </div>
        }
      />

      {loading && <p className="muted">Loading…</p>}
      {error && <p style={{ color: "salmon" }}>{error}</p>}

      <div className="projectGrid">
        {sortedProjects.map((p) => (
          <div key={p.id} className="projectCard">
            <Link
              to={`/demo/projects/${p.slug}`} // ✅ fixed: must start with /
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="projectTop">
                <h3>{p.name}</h3>
                {p.techStack ? <span className="pill">{p.techStack}</span> : null}
              </div>

              {p.summary ? <p className="projectSummary">{p.summary}</p> : null}

              <div className="projectFooter">
                <span className="muted2">
                  Created {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>

          </div>
        ))}
      </div>

      {!loading && sortedProjects.length === 0 && (
        <p className="muted">
          No demo projects found yet. Click <strong>Create Project</strong> to add
          one.
        </p>
      )}

      {/* Create Project Modal */}
      {createOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeCreateModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 10, 20, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{ width: "min(760px, 100%)", padding: 16, borderRadius: 16 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <h2 className="h2" style={{ marginTop: 0 }}>
                Create Demo Project
              </h2>

              <button
                type="button"
                onClick={closeCreateModal}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Error banner (message) */}
            {formError && (
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
                {formError}
              </div>
            )}

            <div style={{ display: "grid", gap: 10 }}>
              <div className="row">
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="Slug (e.g. workout-app)"
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "rgba(0,0,0,0.12)",
                    color: "var(--text)",
                    flex: 1,
                  }}
                />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "rgba(0,0,0,0.12)",
                    color: "var(--text)",
                    flex: 1,
                  }}
                />
              </div>

              <input
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Summary (optional)"
                style={{
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "rgba(0,0,0,0.12)",
                  color: "var(--text)",
                }}
              />

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={4}
                style={{
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "rgba(0,0,0,0.12)",
                  color: "var(--text)",
                }}
              />

              <input
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="Tech stack (optional)"
                style={{
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "rgba(0,0,0,0.12)",
                  color: "var(--text)",
                }}
              />

              <div className="row">
                <input
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="Repo URL (optional)"
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "rgba(0,0,0,0.12)",
                    color: "var(--text)",
                    flex: 1,
                  }}
                />
                <input
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  placeholder="Live URL (optional)"
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "rgba(0,0,0,0.12)",
                    color: "var(--text)",
                    flex: 1,
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    closeCreateModal();
                    resetForm();
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
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={onCreateProject}
                  disabled={creating}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.10)",
                    color: "var(--text)",
                    cursor: creating ? "not-allowed" : "pointer",
                    opacity: creating ? 0.7 : 1,
                  }}
                >
                  {creating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}