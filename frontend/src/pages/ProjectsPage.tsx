import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { api, type CreateProjectRequest, type ProjectDto } from "../lib/api";
import PageHeader from "../components/PageHeader/PageHeader";
import { useAuth } from "../context/AuthContext";
import AccessChoiceModal from "../components/AccessChoiceModal";

import "../styles/projects.css";

/**
 * ProjectsPage
 *
 * Public behavior:
 * - Anyone can view projects
 * - Edit button is visible on every card
 * - Create Project asks how to continue if user is not authenticated
 * - Edit asks how to continue if user is not authenticated
 *
 * Auth behavior:
 * - ADMIN -> create/edit real portfolio data
 * - DEMO  -> create/edit sandbox demo data
 *
 * Important:
 * - Create button now uses the old "Admin or Demo" choice flow again
 * - After login from the Edit button, this page opens the edit modal directly
 */
export default function ProjectsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin, isDemo } = useAuth();

  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create/Edit modal state
  const [createOpen, setCreateOpen] = useState(false);

  // Form state shared by Create + Edit
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // When not null -> modal is in EDIT mode
  const [editingProject, setEditingProject] = useState<ProjectDto | null>(null);

  // Access choice modal (Admin vs Demo)
  const [choiceOpen, setChoiceOpen] = useState(false);

  /**
   * Stores what the user wanted to do before login:
   * - create
   * - edit a specific project
   */
  const [pendingAction, setPendingAction] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<ProjectDto | null>(null);

  /**
   * Load projects.
   *
   * - If DEMO is active, show sandbox projects
   * - Otherwise show public/real projects
   */
  async function loadProjects() {
    setLoading(true);
    setError(null);

    try {
      const list = isDemo ? await api.demoListProjects() : await api.listProjects();
      setProjects(list);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  /**
   * Reload whenever auth mode changes.
   * This allows:
   * - public -> real projects
   * - demo   -> sandbox projects
   */
  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo]);

  /**
   * Open Create modal directly.
   * Used when user is already ADMIN/DEMO, or after login redirect comes back here.
   */
  function openCreateModalDirect() {
    setEditingProject(null);
    setCreateError(null);
    resetCreateForm();
    setCreateOpen(true);
  }

  /**
   * Open Edit modal directly and prefill existing data.
   */
  function openEditModalDirect(p: ProjectDto) {
    setEditingProject(p);

    setSlug(p.slug ?? "");
    setName(p.name ?? "");
    setSummary(p.summary ?? "");
    setDescription(p.description ?? "");
    setTechStack(p.techStack ?? "");
    setRepoUrl(p.repoUrl ?? "");
    setLiveUrl(p.liveUrl ?? "");

    setCreateError(null);
    setCreateOpen(true);
  }

  /**
   * After returning from login with a ?action=... query,
   * automatically open the correct modal.
   *
   * Examples:
   * - /projects?action=create
   * - /projects?action=edit&slug=workout-app
   */
  useEffect(() => {
    if (loading) return;
    if (!isAdmin && !isDemo) return;

    const action = searchParams.get("action");
    const slugFromQuery = searchParams.get("slug");

    if (action === "create") {
      openCreateModalDirect();
      setSearchParams({}, { replace: true });
      return;
    }

    if (action === "edit" && slugFromQuery) {
      const target = projects.find((p) => p.slug === slugFromQuery);
      if (target) {
        openEditModalDirect(target);
        setSearchParams({}, { replace: true });
      }
    }
  }, [loading, isAdmin, isDemo, projects, searchParams, setSearchParams]);

  /**
   * Public Create click:
   * - ADMIN/DEMO -> open modal directly
   * - none       -> ask Admin or Demo
   */
  function onCreateClick() {
    if (isAdmin || isDemo) {
      openCreateModalDirect();
      return;
    }

    setPendingAction("create");
    setEditTarget(null);
    setChoiceOpen(true);
  }

  /**
   * Public Edit click:
   * - ADMIN/DEMO -> open edit modal directly
   * - none       -> ask Admin or Demo
   */
  function onEditClick(p: ProjectDto) {
    if (isAdmin || isDemo) {
      openEditModalDirect(p);
      return;
    }

    setPendingAction("edit");
    setEditTarget(p);
    setChoiceOpen(true);
  }

  /**
   * AccessChoiceModal -> Admin path
   *
   * Returns to this same page with intent encoded in query params,
   * so after login the correct modal opens automatically.
   */
  function goAdminLogin() {
    let next = "/projects";

    if (pendingAction === "create") {
      next = "/projects?action=create";
    } else if (pendingAction === "edit" && editTarget) {
      next = `/projects?action=edit&slug=${encodeURIComponent(editTarget.slug)}`;
    }

    setChoiceOpen(false);
    navigate(`/admin/login?next=${encodeURIComponent(next)}`);
  }

  /**
   * AccessChoiceModal -> Demo path
   *
   * Same as admin: returns to this page, then opens the correct modal automatically.
   */
  function goDemoLogin() {
    let next = "/demo";

    if (pendingAction === "create") {
      next = "/demo?action=create";
    } else if (pendingAction === "edit" && editTarget) {
      next = `/demo?action=edit&slug=${encodeURIComponent(editTarget.slug)}`;
    }

    setChoiceOpen(false);
    navigate(`/demo/login?next=${encodeURIComponent(next)}`);
  }

  function closeCreateModal() {
    setCreateOpen(false);
    setCreateError(null);
    setEditingProject(null);
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

  /**
   * Submit Create/Edit.
   *
   * - ADMIN -> real endpoints
   * - DEMO  -> sandbox endpoints
   */
  async function onSubmitProject() {
    setCreateError(null);

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

      if (editingProject) {
        if (isDemo) {
          await api.demoUpdateProject(editingProject.id, payload);
        } else {
          await api.updateProject(editingProject.id, payload);
        }
      } else {
        if (isDemo) {
          await api.demoCreateProject(payload);
        } else {
          await api.createProject(payload);
        }
      }

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
            onClick={onCreateClick}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.10)",
              color: "var(--text)",
              cursor: "pointer",
            }}
            title="Create as Admin or Demo"
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
              {p.description ? <p className="projectDescription">{p.description}</p> : null}

              {/* Edit is always visible in public view */}
              <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEditClick(p);
                  }}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.08)",
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
              </div>

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

      {/* Access choice modal (Admin vs Demo) */}
      <AccessChoiceModal
        open={choiceOpen}
        onClose={() => {
          setChoiceOpen(false);
          setPendingAction(null);
          setEditTarget(null);
        }}
        onAdmin={goAdminLogin}
        onDemo={goDemoLogin}
        title={pendingAction === "create" ? "Create a project?" : "Edit this project?"}
        message="Choose how you want to continue."
      />

      {/* =========================
          Create/Edit Project Modal
         ========================= */}
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
                {editingProject ? "Edit Project" : "Create Project"}
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
                  onClick={onSubmitProject}
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
                  {creating
                    ? editingProject
                      ? "Saving..."
                      : "Creating..."
                    : editingProject
                    ? "Save Changes"
                    : "Create Project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}