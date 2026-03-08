import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import PageHeader from "../components/PageHeader/PageHeader";
import AdminButton from "../components/AdminButton";
import AccessChoiceModal from "../components/AccessChoiceModal";
import { useAuth } from "../context/AuthContext";

import {
  api,
  type ProjectDetailsDto,
  type TaskDto,
  type TaskStatus,
} from "../lib/api";

import "../styles/projectDetails.css";

/**
 * Groups tasks into Kanban columns by their status:
 * BACKLOG / IN_PROGRESS / DONE
 */
function groupByStatus(tasks: TaskDto[]) {
  const map: Record<TaskStatus, TaskDto[]> = {
    BACKLOG: [],
    IN_PROGRESS: [],
    DONE: [],
  };

  for (const t of tasks) {
    map[t.status].push(t);
  }
  return map;
}

/**
 * Formats an ISO timestamp string into a readable local date/time.
 */
function fmt(iso: string) {
  return new Date(iso).toLocaleString();
}

/**
 * Converts TaskStatus enum values into friendly column labels.
 */
function ColumnLabel({ status }: { status: TaskStatus }) {
  return (
    <>
      {status === "BACKLOG"
        ? "Backlog"
        : status === "IN_PROGRESS"
        ? "In Progress"
        : "Done"}
    </>
  );
}

/**
 * ProjectDetailsPage (PUBLIC)
 *
 * Purpose:
 * - Anyone can view project details, tasks, and updates

 *
 * Notes:
 * - This page remains read-only
 */
export default function ProjectDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAdmin, isDemo } = useAuth();

  // Loaded project details (project + tasks + updates)
  const [data, setData] = useState<ProjectDetailsDto | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Access choice modal
  const [choiceOpen, setChoiceOpen] = useState(false);

  /**
   * Fetch project details from the backend by slug (PUBLIC endpoint).
   */
  async function load() {
    if (!slug) return;

    setLoading(true);
    setError(null);

    try {
      const details = await api.getProjectDetailsBySlug(slug);
      setData(details);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  /**
   * Group tasks into board columns (memoized).
   */
  const grouped = useMemo(() => groupByStatus(data?.tasks ?? []), [data]);

  /**
   * Sort updates newest-first (memoized).
   */
  const updatesSorted = useMemo(() => {
    const u = [...(data?.updates ?? [])];
    u.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return u;
  }, [data]);

  /**
   * Main project edit button in page header.
   *
   * Routes directly when already authenticated,
   * otherwise opens the access choice modal.
   */
  function onEditProjectClick() {
    if (!data) return;

    if (isAdmin) {
      navigate(`/admin/projects/${data.project.slug}`);
      return;
    }

    if (isDemo) {
      navigate(`/demo/projects/${data.project.slug}`);
      return;
    }

    setChoiceOpen(true);
  }



  /**
   * Access choice -> Admin login
   *
   * "next" brings user back to the protected editor page
   * after login.
   */
  function goAdminLogin() {
    if (!data) return;
    navigate(
      `/admin/login?next=${encodeURIComponent(
        `/admin/projects/${data.project.slug}`
      )}`
    );
  }

  /**
   * Access choice -> Demo login
   *
   * "next" brings user back to the demo editor page
   * after login.
   */
  function goDemoLogin() {
    if (!data) return;
    navigate(
      `/demo/login?next=${encodeURIComponent(
        `/demo/projects/${data.project.slug}`
      )}`
    );
  }

  return (
    <main className="container">
      <Link className="backLink" to="/projects">
        ← Back
      </Link>

      {loading && <p className="muted">Loading…</p>}
      {error && <p style={{ color: "salmon" }}>{error}</p>}

      {data && (
        <>
          <PageHeader
            title={data.project.name}
            subtitle={data.project.summary ?? undefined}
            right={
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {data.project.repoUrl && (
                  <a
                    href={data.project.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Repo
                  </a>
                )}

                {data.project.liveUrl && (
                  <a
                    href={data.project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Live
                  </a>
                )}

                {/* Edit button is always visible, but behavior is gated */}
                <AdminButton onClick={onEditProjectClick}>Edit</AdminButton>
              </div>
            }
          />

          <div className="spacer" />

          {/* =========================
              Task board (READ-ONLY)
             ========================= */}
          <section>
            <h2 className="h2">Roadmap Tasks</h2>

            <div className="board">
              {(["BACKLOG", "IN_PROGRESS", "DONE"] as const).map((status) => (
                <div key={status} className="card column">
                  <div className="columnHeader">
                    <strong>
                      <ColumnLabel status={status} />
                    </strong>
                    <span className="pill">{grouped[status].length}</span>
                  </div>

                  <div className="taskList">
                    {grouped[status].map((t) => (
                      <div key={t.id} className="card-soft taskCard">
                        <p className="taskTitle">{t.title}</p>

                        {t.description ? (
                          <div className="taskDesc">{t.description}</div>
                        ) : null}

                        <div className="taskMeta">
                          <span className="pill">{t.type}</span>
                          <span className="pill">{t.priority}</span>
                          {t.targetVersion ? (
                            <span className="pill">{t.targetVersion}</span>
                          ) : null}
                          <span className="pill">{t.status}</span>
                        </div>

                        <div className="taskFooter">
                          Updated {fmt(t.updatedAt)}
                        </div>
                      </div>
                    ))}

                    {grouped[status].length === 0 ? (
                      <div className="muted2" style={{ fontSize: 13 }}>
                        No tasks here yet.
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="spacer" />

          {/* =========================
              Updates timeline (READ-ONLY)
             ========================= */}
          <section>
            <h2 className="h2">Updates</h2>

            <div className="updates">
              {updatesSorted.map((u) => (
                <div key={u.id} className="card updateCard">
                  <div className="updateHeader">
                    <div className="updateTitle">{u.title}</div>
                    <div className="updateTime">{fmt(u.createdAt)}</div>
                  </div>

                  <div className="updateBody">{u.body}</div>
        
                </div>
              ))}

              {updatesSorted.length === 0 ? (
                <p className="muted">No updates yet.</p>
              ) : null}
            </div>
          </section>

          {/* =========================
              Access choice modal
             ========================= */}
          <AccessChoiceModal
            open={choiceOpen}
            onClose={() => setChoiceOpen(false)}
            onAdmin={goAdminLogin}
            onDemo={goDemoLogin}
            title="Edit this project?"
            message="Choose how you want to continue."
          />
        </>
      )}
    </main>
  );
}