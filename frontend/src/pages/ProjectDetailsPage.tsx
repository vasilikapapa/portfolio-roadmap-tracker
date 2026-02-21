import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import PageHeader from "../components/PageHeader/PageHeader";
import { isAuthed } from "../lib/auth";
import {
  api,
  type CreateTaskRequest,
  type CreateUpdateRequest,
  type ProjectDetailsDto,
  type TaskDto,
  type TaskPriority,
  type TaskStatus,
  type TaskType,
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
 * ProjectDetailsPage
 *
 * Responsibilities:
 * - Fetch and display project details by slug (project + tasks + updates)
 * - Show tasks as a Kanban board grouped by status
 * - Show updates newest-first
 * - If authenticated (admin): allow creating/deleting tasks and updates
 */
export default function ProjectDetailsPage() {
  const { slug } = useParams<{ slug: string }>();

  // Loaded project details (null until fetched)
  const [data, setData] = useState<ProjectDetailsDto | null>(null);

  // UI state for fetch + error display
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simple auth flag (checks for stored token)
  const authed = isAuthed();

  // -----------------------------
  // Admin form state: Create Task
  // -----------------------------
  const [tTitle, setTTitle] = useState("");
  const [tDesc, setTDesc] = useState("");
  const [tStatus, setTStatus] = useState<TaskStatus>("BACKLOG");
  const [tType, setTType] = useState<TaskType>("FEATURE");
  const [tPriority, setTPriority] = useState<TaskPriority>("MEDIUM");
  const [tTarget, setTTarget] = useState("");

  // ------------------------------
  // Admin form state: Create Update
  // ------------------------------
  const [uTitle, setUTitle] = useState("");
  const [uBody, setUBody] = useState("");

  /**
   * Fetch project details from the backend by slug.
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

  // Load data on first render and whenever the slug changes
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  /**
   * Group tasks into board columns (memoized).
   * Recomputed only when `data` changes.
   */
  const grouped = useMemo(() => groupByStatus(data?.tasks ?? []), [data]);

  /**
   * Sort updates newest-first (memoized).
   * Recomputed only when `data` changes.
   */
  const updatesSorted = useMemo(() => {
    const u = [...(data?.updates ?? [])];
    u.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return u;
  }, [data]);

  // -----------------------------
  // Admin actions
  // -----------------------------

  /**
   * Creates a new task under the current project (admin only).
   */
  async function onCreateTask() {
    if (!data) return;

    if (!tTitle.trim()) {
      setError("Task title is required.");
      return;
    }

    const payload: CreateTaskRequest = {
      title: tTitle.trim(),
      description: tDesc.trim() ? tDesc.trim() : null,
      status: tStatus,
      type: tType,
      priority: tPriority,
      targetVersion: tTarget.trim() ? tTarget.trim() : null,
    };

    try {
      setError(null);
      await api.createTask(data.project.id, payload);

      // Reset form fields after success
      setTTitle("");
      setTDesc("");
      setTStatus("BACKLOG");
      setTType("FEATURE");
      setTPriority("MEDIUM");
      setTTarget("");

      // Refresh page data so new task appears
      await load();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  /**
   * Deletes a task by ID (admin only).
   */
  async function onDeleteTask(taskId: string) {
    try {
      setError(null);
      await api.deleteTask(taskId);
      await load();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  /**
   * Creates a new update entry (admin only).
   */
  async function onCreateUpdate() {
    if (!data) return;

    if (!uTitle.trim() || !uBody.trim()) {
      setError("Update title and body are required.");
      return;
    }

    const payload: CreateUpdateRequest = {
      title: uTitle.trim(),
      body: uBody.trim(),
    };

    try {
      setError(null);
      await api.createUpdate(data.project.id, payload);

      // Reset form fields after success
      setUTitle("");
      setUBody("");

      // Refresh page data so new update appears
      await load();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  /**
   * Deletes an update by ID (admin only).
   */
  async function onDeleteUpdate(updateId: string) {
    try {
      setError(null);
      await api.deleteUpdate(updateId);
      await load();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  return (
    <main className="container">
      {/* Back navigation to projects list */}
      <Link className="backLink" to="/projects">
        ← Back
      </Link>

      {/* Loading and error messages */}
      {loading && <p className="muted">Loading…</p>}
      {error && <p style={{ color: "salmon" }}>{error}</p>}

      {data && (
        <>
          {/* Project title + optional repo/live links */}
          <PageHeader
            title={data.project.name}
            subtitle={data.project.summary ?? undefined}
            right={
              <>
                {data.project.repoUrl && (
                  <a href={data.project.repoUrl} target="_blank" rel="noreferrer">
                    Repo
                  </a>
                )}
                {data.project.liveUrl && (
                  <a href={data.project.liveUrl} target="_blank" rel="noreferrer">
                    Live
                  </a>
                )}
              </>
            }
          />

          {/* Admin section: create tasks & updates (only when logged in) */}
          {authed && (
            <>
              <div className="spacer" />

              <section className="card" style={{ padding: 16 }}>
                <h2 className="h2" style={{ marginTop: 0 }}>
                  Admin
                </h2>

                <div className="row" style={{ gap: 16 }}>
                  {/* Create Task card */}
                  <div
                    className="card-soft"
                    style={{ padding: 14, flex: 1, minWidth: 280 }}
                  >
                    <div className="h3" style={{ marginTop: 0 }}>
                      Create Task
                    </div>

                    <div style={{ display: "grid", gap: 10 }}>
                      <input
                        value={tTitle}
                        onChange={(e) => setTTitle(e.target.value)}
                        placeholder="Title"
                        style={{
                          padding: 10,
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: "rgba(0,0,0,0.12)",
                          color: "var(--text)",
                        }}
                      />

                      <textarea
                        value={tDesc}
                        onChange={(e) => setTDesc(e.target.value)}
                        placeholder="Description (optional)"
                        rows={3}
                        style={{
                          padding: 10,
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: "rgba(0,0,0,0.12)",
                          color: "var(--text)",
                        }}
                      />

                      {/* Task fields: status, type, priority */}
                      <div className="row">
                        <select
                          value={tStatus}
                          onChange={(e) =>
                            setTStatus(e.target.value as TaskStatus)
                          }
                          style={{ padding: 10, borderRadius: 10 }}
                        >
                          <option value="BACKLOG">BACKLOG</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="DONE">DONE</option>
                        </select>

                        <select
                          value={tType}
                          onChange={(e) => setTType(e.target.value as TaskType)}
                          style={{ padding: 10, borderRadius: 10 }}
                        >
                          <option value="FEATURE">FEATURE</option>
                          <option value="BUG">BUG</option>
                          <option value="REFACTOR">REFACTOR</option>
                        </select>

                        <select
                          value={tPriority}
                          onChange={(e) =>
                            setTPriority(e.target.value as TaskPriority)
                          }
                          style={{ padding: 10, borderRadius: 10 }}
                        >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                        </select>
                      </div>

                      <input
                        value={tTarget}
                        onChange={(e) => setTTarget(e.target.value)}
                        placeholder="Target version (optional) e.g. v1.1"
                        style={{
                          padding: 10,
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: "rgba(0,0,0,0.12)",
                          color: "var(--text)",
                        }}
                      />

                      <button
                        type="button"
                        onClick={onCreateTask}
                        style={{
                          padding: 10,
                          borderRadius: 12,
                          border: "1px solid var(--border)",
                          background: "rgba(255,255,255,0.10)",
                          color: "var(--text)",
                          cursor: "pointer",
                        }}
                      >
                        Create Task
                      </button>
                    </div>
                  </div>

                  {/* Create Update card */}
                  <div
                    className="card-soft"
                    style={{ padding: 14, flex: 1, minWidth: 280 }}
                  >
                    <div className="h3" style={{ marginTop: 0 }}>
                      Create Update
                    </div>

                    <div style={{ display: "grid", gap: 10 }}>
                      <input
                        value={uTitle}
                        onChange={(e) => setUTitle(e.target.value)}
                        placeholder="Title"
                        style={{
                          padding: 10,
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: "rgba(0,0,0,0.12)",
                          color: "var(--text)",
                        }}
                      />

                      <textarea
                        value={uBody}
                        onChange={(e) => setUBody(e.target.value)}
                        placeholder="Body"
                        rows={5}
                        style={{
                          padding: 10,
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: "rgba(0,0,0,0.12)",
                          color: "var(--text)",
                        }}
                      />

                      <button
                        type="button"
                        onClick={onCreateUpdate}
                        style={{
                          padding: 10,
                          borderRadius: 12,
                          border: "1px solid var(--border)",
                          background: "rgba(255,255,255,0.10)",
                          color: "var(--text)",
                          cursor: "pointer",
                        }}
                      >
                        Create Update
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          <div className="spacer" />

          {/* Task board (Kanban columns) */}
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
                        </div>

                        <div className="taskFooter">
                          Updated {fmt(t.updatedAt)}
                        </div>

                        {/* Admin-only delete action */}
                        {authed && (
                          <button
                            type="button"
                            onClick={() => onDeleteTask(t.id)}
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
                        )}
                      </div>
                    ))}

                    {/* Empty state message per column */}
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

          {/* Updates timeline */}
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

                  {/* Admin-only delete action */}
                  {authed && (
                    <button
                      type="button"
                      onClick={() => onDeleteUpdate(u.id)}
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
                  )}
                </div>
              ))}

              {/* Empty state for updates */}
              {updatesSorted.length === 0 ? (
                <p className="muted">No updates yet.</p>
              ) : null}
            </div>
          </section>
        </>
      )}
    </main>
  );
}