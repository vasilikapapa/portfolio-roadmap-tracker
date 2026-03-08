import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader/PageHeader";
import { api, type CreateProjectRequest, type ProjectDto } from "../lib/api";
import { useAuth } from "../context/AuthContext";

/**
 * DemoHomePage
 *
 * Sandbox dashboard for recruiters.
 *
 * Features:
 * - Lists demo projects
 * - Create demo projects
 * - Edit demo projects
 * - Navigate to DemoProjectDetailsPage
 *
 * All data is isolated from the real portfolio.
 */

export default function DemoHomePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  /** Modal state */
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  /** When not null → modal is editing an existing project */
  const [editingProject, setEditingProject] = useState<ProjectDto | null>(null);

  /** Form fields (used for both create + edit) */
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");

  const [formError, setFormError] = useState<string | null>(null);

  /** Reset form fields */
  function resetForm() {
    setSlug("");
    setName("");
    setSummary("");
    setDescription("");
    setTechStack("");
    setRepoUrl("");
    setLiveUrl("");
    setFormError(null);
    setEditingProject(null);
  }

  function closeCreateModal() {
    setCreateOpen(false);
    resetForm();
  }

  /** Load demo projects */
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
  load()
 },[]);

 useEffect(() => {
  if(loading) return

  const action = searchParams.get("action");
  const slug = searchParams.get("slug");

  if (action === "create") {
    openCreateModal();
    setSearchParams({}, { replace: true });
    return;
  }
  if (action === "edit" && slug) {
    const target = projects.find((p) => p.slug === slug);
    if (target) {
      openEditModal(target);
      setSearchParams({}, { replace: true });
    }
  
  }
}, [loading, projects, searchParams, setSearchParams]);

  /** Sort newest first */
  const sortedProjects = useMemo(() => {
    const p = [...projects];
    p.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return p;
  }, [projects]);

  /**
   * Logout demo → return to public view
   */
  function logoutAndResetDemo() {
    logout();
    navigate("/projects", { replace: true });
  }

  /**
   * Open modal to CREATE project
   */
  function openCreateModal() {
    resetForm();
    setCreateOpen(true);
  }

  /**
   * Open modal to EDIT project
   */
  function openEditModal(p: ProjectDto) {
    setEditingProject(p);

    setSlug(p.slug ?? "");
    setName(p.name ?? "");
    setSummary(p.summary ?? "");
    setDescription(p.description ?? "");
    setTechStack(p.techStack ?? "");
    setRepoUrl(p.repoUrl ?? "");
    setLiveUrl(p.liveUrl ?? "");

    setFormError(null);
    setCreateOpen(true);
  }

  /**
   * Create OR Update project
   */
  async function onSubmitProject() {
    setFormError(null);

    const s = slug.trim();
    const n = name.trim();

    if (!s) return setFormError("Slug is required.");
    if (!n) return setFormError("Name is required.");

    const safeSlug = s
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const payload: CreateProjectRequest = {
      slug: safeSlug,
      name: n,
      summary: summary.trim() || null,
      description: description.trim() || null,
      techStack: techStack.trim() || null,
      repoUrl: repoUrl.trim() || null,
      liveUrl: liveUrl.trim() || null,
    };

    try {
      setCreating(true);

      if (editingProject) {
        /** Update existing demo project */
        await api.demoUpdateProject(editingProject.id, payload);
      } else {
        /** Create new demo project */
        await api.demoCreateProject(payload);
      }

      closeCreateModal();
      await load();
    } catch (e: any) {
      setFormError(String(e?.message ?? e));
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="container">

      {/* Back to public view */}
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
      
      {/*DEMO badge on the PageHeader */}
       <div 
        style={{
          display: "inline-block",
          padding: "4px 10px",
          borderRadius: 20,
          fontSize: 12,
          background: "rgba(255,255,255,0.1)",
          marginBottom: 10
        }}
        >
          DEMO MODE

      </div>
      <PageHeader
        title={`Demo Dashboard (${projects.length} projects)`}
        subtitle="Sandbox projects - changes here do NOT affect the real portfolio."
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
          >
            + Create Project
          </button>
        }
      />

      <p className="muted" style={{ marginBottom: 20 }}>
         This demo environmnet lets recruiters safely create, edit, and test features 
         without modyfying the real portfolio data.
      </p>
      {loading && <p className="muted">Loading…</p>}
      {error && <p style={{ color: "salmon" }}>{error}</p>}

      <div className="projectGrid">
        {sortedProjects.map((p) => (
          <div key={p.id} className="projectCard">

            <Link
              to={`/demo/projects/${p.slug}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="projectTop">
                <h3>{p.name}</h3>
                {p.techStack && <span className="pill">{p.techStack}</span>}
              </div>

              {p.summary && <p className="projectSummary">{p.summary}</p>}
            </Link>

            {/* Edit button */}
            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => openEditModal(p)}
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

          </div>
        ))}
      </div>

      {/* Modal for Create + Edit */}
      {createOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeCreateModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10,10,20,0.85)",
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

            <h2 className="h2">
              {editingProject ? "Edit Demo Project" : "Create Demo Project"}
            </h2>

            {formError && (
              <div style={{ color: "salmon", marginBottom: 10 }}>
                {formError}
              </div>
            )}

            {/* form inputs*/}
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
                        flex: 1, }} 
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
                          color: "var(--text)", flex: 1, }} 
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
                        color: "var(--text)", }} 
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
                              color: "var(--text)", }} 
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
                            color: "var(--text)", }} 
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
                                color: "var(--text)", flex: 1, }} 
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
                                  color: "var(--text)", flex: 1, }} 
                              />
                           </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
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

        </main>
      );
}