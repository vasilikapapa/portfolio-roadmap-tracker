import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader/PageHeader";
import { api, type CreateProjectRequest, type ProjectDto } from "../lib/api";

/**
 * AdminHomePage
 *
 * Admin dashboard for:
 * - Viewing all projects
 * - Creating new projects
 * - Deleting projects
 * - Basic project statistics
 *
 * Requires admin authentication (handled by backend + token).
 */
export default function AdminHomePage() {
  /** -----------------------------
   * State: Projects list + UI status
   * ----------------------------- */
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** -----------------------------
   * State: Create Project form inputs
   * ----------------------------- */
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");

  /**
   * Loads project list from backend API.
   * Handles loading and error states.
   */
  async function load() {
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

  /**
   * Load projects on initial component mount.
   */
  useEffect(() => {
    load();
  }, []);

  /**
   * Derived statistics (memoized for performance).
   * Currently only project count is available.
   */
  const stats = useMemo(() => {
    return { projects: projects.length };
  }, [projects]);

  /**
   * Deletes a project after user confirmation.
   *
   * Steps:
   * 1. Confirm with the user (prevents accidental deletion)
   * 2. Call backend DELETE endpoint
   * 3. Reload projects list
   * 4. Display error message if request fails
   */
  async function onDeleteProject(projectId: string) {
    if (
      !confirm("Delete this project? This will delete its tasks and updates too.")
    ) {
      return;
    }

    try {
      setError(null); // Clear any previous error

      await api.deleteProject(projectId); // Delete project (cascades tasks/updates in DB)

      await load(); // Refresh list after deletion
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  /**
   * Handles creating a new project.
   * - Validates required fields
   * - Calls backend API
   * - Resets form
   * - Reloads project list
   */
  async function onCreateProject() {
    // Basic client-side validation (backend validation still applies)
    if (!slug.trim() || !name.trim()) {
      setError("Slug and Name are required.");
      return;
    }

    // Prepare payload using API types (keeps frontend aligned with backend DTO)
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
      setError(null);

      // Create project via API
      await api.createProject(payload);

      // Reset form inputs after successful creation
      setSlug("");
      setName("");
      setSummary("");
      setDescription("");
      setTechStack("");
      setRepoUrl("");
      setLiveUrl("");

      // Refresh project list so the new project appears
      await load();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  return (
    <>
      {/* Page header component */}
      <PageHeader
        title="Admin Dashboard"
        subtitle="Create and manage projects (admin only)"
      />

      <div className="container">
        {/* Error message display */}
        {error && <p style={{ color: "salmon" }}>{error}</p>}

        {/* Loading indicator */}
        {loading && <p className="muted">Loading…</p>}

        {/* ======================
           Dashboard Statistics
        ====================== */}
        <div className="row" style={{ gap: 12, marginBottom: 14 }}>
          <div className="card" style={{ padding: 14, flex: 1 }}>
            <div className="muted2">Projects</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{stats.projects}</div>
          </div>
        </div>

        {/* ======================
           Create Project Form
        ====================== */}
        <section className="card" style={{ padding: 16 }}>
          <h2 className="h2" style={{ marginTop: 0 }}>
            Create Project
          </h2>

          <div style={{ display: "grid", gap: 10 }}>
            {/* Required fields */}
            <div className="row" style={{ gap: 10 }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name (required)"
                style={{ width: "100%", padding: 10, borderRadius: 10 }}
              />

              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Slug (required) e.g. workout-app"
                style={{ width: "100%", padding: 10, borderRadius: 10 }}
              />
            </div>

            {/* Optional metadata */}
            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Summary"
              style={{ width: "100%", padding: 10, borderRadius: 10 }}
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              rows={4}
              style={{ width: "100%", padding: 10, borderRadius: 10 }}
            />

            <input
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="Tech stack (comma separated)"
              style={{ width: "100%", padding: 10, borderRadius: 10 }}
            />

            {/* URLs */}
            <div className="row" style={{ gap: 10 }}>
              <input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="Repo URL"
                style={{ width: "100%", padding: 10, borderRadius: 10 }}
              />

              <input
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="Live URL"
                style={{ width: "100%", padding: 10, borderRadius: 10 }}
              />
            </div>

            {/* Submit button */}
            <button
              type="button"
              onClick={onCreateProject}
              style={{
                padding: 10,
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.10)",
                color: "var(--text)",
                cursor: "pointer",
                width: 180,
              }}
            >
              Create Project
            </button>
          </div>
        </section>

        <div className="spacer" />

        {/* ======================
           Projects List
        ====================== */}
        <section>
          <h2 className="h2">Projects</h2>

          <div className="projectGrid">
            {projects.map((p) => (
              <Link key={p.id} to={`/projects/${p.slug}`} className="projectCard">
                <div className="projectTop">
                  <h3>{p.name}</h3>
                  <span className="pill">{p.techStack}</span>
                </div>

                {/* Delete button inside Link:
                    preventDefault prevents navigation when clicking delete */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault(); // do not navigate to project page
                    e.stopPropagation(); // prevent event bubbling to Link
                    onDeleteProject(p.id);
                  }}
                  style={{
                    marginTop: 10,
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "rgba(255, 80, 80, 0.12)",
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>

                {p.summary && <p className="projectSummary">{p.summary}</p>}

                <div className="projectFooter">
                  <span className="muted2">Slug: {p.slug}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}