import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api, type CreateProjectRequest, type ProjectDto } from "../lib/api";
import PageHeader from "../components/PageHeader/PageHeader";
import { useAuth } from "../context/AuthContext";

import "../styles/projects.css";

/**
 * ProjectsPage (PUBLIC)
 *
 * - Anyone can view projects
 * - Admins can create projects (via modal)
 * - Non-admins clicking "Create Project" are redirected to login
 */
export default function ProjectsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);

  // Create form state
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function loadProjects() {
    setLoading(true);
    setError(null);

    try {
      const list = await api.listProjects();
      setProjects(list);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function openCreateModal() {
    // If not admin, send them to login (button is clickable, not disabled)
    if (!isAdmin) {
      navigate("/admin/login");
      return;
    }

    // Admin: open modal
    setCreateError(null);
    setCreateOpen(true);
  }

  function closeCreateModal() {
    setCreateOpen(false);
    setCreateError(null);
  }

  function resetCreateForm() {
    setSlug("");
    setName("");
    setSummary("");
    setDescription("");
    setTechStack("");
    setRepoUrl("");
    setLiveUrl("");
  }

  async function onCreateProject() {
    setCreateError(null);

    // Basic validation (you can tighten this later)
    if (!slug.trim() || !name.trim()) {
      setCreateError("Slug and Name are required.");
      return;
    }

    const payload: CreateProjectRequest = {
      slug: slug.trim(),
      name: name.trim(),
      summary: summary.trim() ? summary.trim() : null,
      description: description.trim() ? description.trim() : null,
      techStack: techStack.trim() ? techStack.trim() : null,
      repoUrl: repoUrl.trim() ? repoUrl.trim() : null,
      liveUrl: liveUrl.trim() ? liveUrl.trim() : null,
    };

    try {
      setCreating(true);

      // Admin-only endpoint (will also be enforced by backend)
      await api.createProject(payload);

      // Close modal, reset form, refresh list
      closeCreateModal();
      resetCreateForm();
      await loadProjects();
    } catch (e: any) {
      setCreateError(String(e?.message ?? e));
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="Engineering roadmap tracker — public view"
        right={
          <button
            type="button"
            onClick={openCreateModal}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.10)",
              color: "var(--text)",
              cursor: "pointer",
            }}
            title={!isAdmin ? "Login required to create projects" : "Create a new project"}
          >
            + Create Project
          </button>
        }
      />

      <div className="container">
        {loading && <p className="muted">Loading…</p>}
        {error && <p style={{ color: "salmon" }}>{error}</p>}

        <div className="projectGrid">
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.slug}`} className="projectCard">
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
          ))}
        </div>

        {!loading && projects.length === 0 ? <p className="muted">No projects yet.</p> : null}
      </div>

      {/* =========================
          Create Project Modal
         ========================= */}
      {createOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeCreateModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 10, 20, 0.85)", // darker overlay
            backdropFilter: "blur(6px)",          // optional: smooth blur
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 9999, // make sure it sits above everything
          }}
        >
          {/* Modal card (stop click from closing) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{
            width: "min(720px, 100%)",
            padding: 20,
            borderRadius: 18,
            background: "rgba(25, 25, 35, 0.95)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <h2 className="h2" style={{ marginTop: 0 }}>
                Create Project
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

            {createError && <p style={{ color: "salmon" }}>{createError}</p>}

            <div style={{ display: "grid", gap: 10 }}>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Slug (unique) e.g. workout-app"
                style={{
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "rgba(0,0,0,0.12)",
                  color: "var(--text)",
                }}
              />

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name e.g. Workout App"
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
                placeholder="Tech stack (optional) e.g. React, Spring Boot"
                style={{
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "rgba(0,0,0,0.12)",
                  color: "var(--text)",
                }}
              />

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
                rows={5}
                style={{
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "rgba(0,0,0,0.12)",
                  color: "var(--text)",
                }}
              />

              <div className="row" style={{ gap: 10 }}>
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
                  onClick={closeCreateModal}
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
    </>
  );
}