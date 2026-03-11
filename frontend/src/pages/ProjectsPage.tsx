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
 * UX note:
 * - First load may be slower if backend is waking up from Render cold start
 * - Loading cards help the page feel responsive while data is loading
 */

export default function ProjectsPage() {

  /** -----------------------------
   * Router + Auth
   * ----------------------------- */
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin, isDemo } = useAuth();


  /** -----------------------------
   * Page state
   * ----------------------------- */

  // Loaded projects
  const [projects, setProjects] = useState<ProjectDto[]>([]);

  // Loading / error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * If backend takes longer than expected to respond
   * (for example when Render wakes it from sleep),
   * we show an additional message to the user.
   */
  const [loadingTooLong, setLoadingTooLong] = useState(false);


  /** -----------------------------
   * Create/Edit modal state
   * ----------------------------- */

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


  /** -----------------------------
   * Access choice modal
   * (Admin vs Demo)
   * ----------------------------- */

  const [choiceOpen, setChoiceOpen] = useState(false);

  /**
   * Stores what the user wanted to do before login
   */
  const [pendingAction, setPendingAction] =
    useState<"create" | "edit" | null>(null);

  const [editTarget, setEditTarget] = useState<ProjectDto | null>(null);


  /** ---------------------------------------------------------
   * Load projects from backend
   *
   * - DEMO mode loads sandbox data
   * - Otherwise loads real projects
   *
   * mounted guard prevents state updates after unmount
   * --------------------------------------------------------- */
  useEffect(() => {
    let mounted = true;

    async function loadProjects() {
      if (mounted) {
        setLoading(true);
        setError(null);
      }

      try {
        const list = isDemo
          ? await api.demoListProjects()
          : await api.listProjects();

        if (mounted) setProjects(list);

      } catch (e: any) {
        if (mounted) setError(String(e?.message ?? e));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProjects();

    return () => {
      mounted = false;
    };
  }, [isDemo]);


  /** ---------------------------------------------------------
   * Detect if backend is taking too long
   *
   * Render free instances sleep after inactivity.
   * First request may take ~20–30 seconds.
   *
   * After 4 seconds we show a message explaining
   * that the backend may still be waking up.
   * --------------------------------------------------------- */
  useEffect(() => {
    if (!loading) {
      setLoadingTooLong(false);
      return;
    }

    const t = setTimeout(() => setLoadingTooLong(true), 4000);
    return () => clearTimeout(t);

  }, [loading]);


  /** ---------------------------------------------------------
   * Reload list after create/update
   * --------------------------------------------------------- */
  async function refreshProjects() {

    setLoading(true);
    setError(null);

    try {
      const list = isDemo
        ? await api.demoListProjects()
        : await api.listProjects();

      setProjects(list);

    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }


  /** ---------------------------------------------------------
   * Open Create modal directly
   * --------------------------------------------------------- */
  function openCreateModalDirect() {

    setEditingProject(null);
    setCreateError(null);

    resetCreateForm();

    setCreateOpen(true);
  }


  /** ---------------------------------------------------------
   * Open Edit modal and prefill form
   * --------------------------------------------------------- */
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


  /** ---------------------------------------------------------
   * Handle login redirect
   *
   * Example URLs:
   * /projects?action=create
   * /projects?action=edit&slug=workout-app
   * --------------------------------------------------------- */
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

      const target = projects.find(p => p.slug === slugFromQuery);

      if (target) {
        openEditModalDirect(target);
        setSearchParams({}, { replace: true });
      }
    }

  }, [loading, isAdmin, isDemo, projects]);


  /** ---------------------------------------------------------
   * Create button click
   * --------------------------------------------------------- */
  function onCreateClick() {

    if (isAdmin || isDemo) {
      openCreateModalDirect();
      return;
    }

    setPendingAction("create");
    setEditTarget(null);

    setChoiceOpen(true);
  }


  /** ---------------------------------------------------------
   * Edit button click
   * --------------------------------------------------------- */
  function onEditClick(p: ProjectDto) {

    if (isAdmin || isDemo) {
      openEditModalDirect(p);
      return;
    }

    setPendingAction("edit");
    setEditTarget(p);

    setChoiceOpen(true);
  }


  /** ---------------------------------------------------------
   * Admin login redirect
   * --------------------------------------------------------- */
  function goAdminLogin() {

    let next = "/projects";

    if (pendingAction === "create") {
      next = "/projects?action=create";
    }

    else if (pendingAction === "edit" && editTarget) {
      next = `/projects?action=edit&slug=${encodeURIComponent(editTarget.slug)}`;
    }

    setChoiceOpen(false);

    navigate(`/admin/login?next=${encodeURIComponent(next)}`);
  }


  /** ---------------------------------------------------------
   * Demo login redirect
   * --------------------------------------------------------- */
  function goDemoLogin() {

    let next = "/demo";

    if (pendingAction === "create") {
      next = "/demo?action=create";
    }

    else if (pendingAction === "edit" && editTarget) {
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


  /** ---------------------------------------------------------
   * Submit Create/Edit project
   * --------------------------------------------------------- */
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

      await refreshProjects();

    } catch (e: any) {

      setCreateError(String(e?.message ?? e));

    } finally {

      setCreating(false);
    }
  }


  /** ---------------------------------------------------------
   * Render
   * --------------------------------------------------------- */

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
          >
            + Create Project
          </button>
        }
      />

      <div className="container">

        {loading && (
          <>
            <p className="muted">
              Loading projects...
              {loadingTooLong &&
                " Backend is waking up, this may take a little longer on first visit."}
            </p>
          </>
        )}

        {error && <p style={{ color: "salmon" }}>{error}</p>}

        {!loading && (
          <div className="projectGrid">

            {projects.map((p) => (
              <Link key={p.id} to={`/projects/${p.slug}`} className="projectCard">

                <div className="projectTop">
                  <h3>{p.name}</h3>
                  {p.techStack && <span className="pill">{p.techStack}</span>}
                </div>

                {p.summary && (
                  <p className="projectSummary">{p.summary}</p>
                )}

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
        )}

        {!loading && projects.length === 0 && (
          <p className="muted">No projects yet.</p>
        )}

      </div>


      {/* Access choice modal */}
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
    </>
  );
}