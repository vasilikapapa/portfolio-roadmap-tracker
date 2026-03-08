import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader/PageHeader";
import {
  api,
  type CreateTaskRequest,
  type CreateUpdateRequest,
  type ProjectDetailsDto,
  type TaskDto,
  type TaskPriority,
  type TaskStatus,
  type TaskType,
  type UpdateDto,
} from "../lib/api";

import "../styles/projectDetails.css";
import { useAuth } from "../context/AuthContext";

/**
 * Groups tasks into Kanban columns by their status.
 */
function groupByStatus(tasks: TaskDto[]) {
  const map: Record<TaskStatus, TaskDto[]> = {
    BACKLOG: [],
    IN_PROGRESS: [],
    DONE: [],
  };
  for (const t of tasks) map[t.status].push(t);
  return map;
}

/**
 * Formats an ISO timestamp into local date/time.
 */
function fmt(iso: string) {
  return new Date(iso).toLocaleString();
}

/**
 * Friendly column label for task status.
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
 * DemoProjectDetailsPage
 *
 * Protected sandbox editor for demo users.
 *
 * Features:
 * - View demo project details
 * - Create / edit / delete demo tasks
 * - Create / edit / delete demo updates
 * - Delete demo project
 *
 * All writes go to /demo/** endpoints only.
 */
export default function DemoProjectDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isDemo } = useAuth();

  const [data, setData] = useState<ProjectDetailsDto | null>(null);

  // Page state
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Modal open state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);

  // Field validation errors
  const [taskErrors, setTaskErrors] = useState<{ title?: string }>({});
  const [updateErrors, setUpdateErrors] = useState<{
    title?: string;
    body?: string;
  }>({});

  // Editing state
  const [editingTask, setEditingTask] = useState<TaskDto | null>(null);
  const [editingUpdate, setEditingUpdate] = useState<UpdateDto | null>(null);

  // Server errors shown inside modals
  const [taskServerError, setTaskServerError] = useState<string | null>(null);
  const [updateServerError, setUpdateServerError] = useState<string | null>(
    null
  );

  // Task form state
  const [tTitle, setTTitle] = useState("");
  const [tDesc, setTDesc] = useState("");
  const [tStatus, setTStatus] = useState<TaskStatus>("BACKLOG");
  const [tType, setTType] = useState<TaskType>("FEATURE");
  const [tPriority, setTPriority] = useState<TaskPriority>("MEDIUM");
  const [tTarget, setTTarget] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  // Update form state
  const [uTitle, setUTitle] = useState("");
  const [uBody, setUBody] = useState("");
  const [creatingUpdate, setCreatingUpdate] = useState(false);

  /**
   * Reset task modal state for fresh create/edit sessions.
   */
  function resetTaskModalState() {
    setTaskErrors({});
    setTaskServerError(null);
    setEditingTask(null);
    setTTitle("");
    setTDesc("");
    setTStatus("BACKLOG");
    setTType("FEATURE");
    setTPriority("MEDIUM");
    setTTarget("");
  }

  /**
   * Reset update modal state for fresh create/edit sessions.
   */
  function resetUpdateModalState() {
    setUpdateErrors({});
    setUpdateServerError(null);
    setEditingUpdate(null);
    setUTitle("");
    setUBody("");
  }

  function closeTaskModal() {
    setTaskModalOpen(false);
    resetTaskModalState();
  }

  function closeUpdateModal() {
    setUpdateModalOpen(false);
    resetUpdateModalState();
  }

  /**
   * Load demo project details by slug.
   */
  async function load() {
    if (!slug) return;

    setLoading(true);
    setPageError(null);

    try {
      const details = await api.demoGetProjectDetailsBySlug(slug);
      setData(details);
    } catch (e: any) {
      setPageError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  /**
   * If user somehow lands here without demo auth, return to demo login.
   */
  useEffect(() => {
    if (!isDemo && data) {
      navigate(
        `/demo/login?next=${encodeURIComponent(
          `/demo/projects/${data.project.slug}`
        )}`
      );
    }
  }, [isDemo, data, navigate]);

  /**
   * ESC closes whichever modal is currently open.
   */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (taskModalOpen) closeTaskModal();
      if (updateModalOpen) closeUpdateModal();
    }

    if (taskModalOpen || updateModalOpen) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [taskModalOpen, updateModalOpen]);

  const grouped = useMemo(() => groupByStatus(data?.tasks ?? []), [data]);

  const updatesSorted = useMemo(() => {
    const u = [...(data?.updates ?? [])];
    u.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return u;
  }, [data]);

  /**
   * Open task modal in CREATE mode.
   */
  function openCreateTaskModal() {
    resetTaskModalState();
    setPageError(null);
    setTaskModalOpen(true);
  }

  /**
   * Open task modal in EDIT mode and prefill fields.
   */
  function openEditTaskModal(task: TaskDto) {
    setEditingTask(task);
    setTaskServerError(null);
    setTaskErrors({});

    setTTitle(task.title ?? "");
    setTDesc(task.description ?? "");
    setTStatus(task.status);
    setTType(task.type);
    setTPriority(task.priority);
    setTTarget(task.targetVersion ?? "");

    setTaskModalOpen(true);
  }

  /**
   * Open update modal in CREATE mode.
   */
  function openCreateUpdateModal() {
    resetUpdateModalState();
    setPageError(null);
    setUpdateModalOpen(true);
  }

  /**
   * Open update modal in EDIT mode and prefill fields.
   */
  function openEditUpdateModal(update: UpdateDto) {
    setEditingUpdate(update);
    setUpdateServerError(null);
    setUpdateErrors({});

    setUTitle(update.title ?? "");
    setUBody(update.body ?? "");

    setUpdateModalOpen(true);
  }

  /**
   * Create or update a demo task.
   */
  async function onSubmitTask() {
    if (!data) return;

    const nextErrors: { title?: string } = {};
    if (!tTitle.trim()) nextErrors.title = "Task title is required.";

    setTaskErrors(nextErrors);
    setTaskServerError(null);

    if (Object.keys(nextErrors).length > 0) return;

    const payload: CreateTaskRequest = {
      title: tTitle.trim(),
      description: tDesc.trim() ? tDesc.trim() : null,
      status: tStatus,
      type: tType,
      priority: tPriority,
      targetVersion: tTarget.trim() ? tTarget.trim() : null,
    };

    try {
      setCreatingTask(true);

      if (editingTask) {
        await api.demoUpdateTask(data.project.id, editingTask.id, payload);
      } else {
        await api.demoCreateTask(data.project.id, payload);
      }

      closeTaskModal();
      await load();
    } catch (e: any) {
      setTaskServerError(String(e?.message ?? e));
    } finally {
      setCreatingTask(false);
    }
  }

  /**
   * Create or update a demo update entry.
   */
  async function onSubmitUpdate() {
    if (!data) return;

    const nextErrors: { title?: string; body?: string } = {};
    if (!uTitle.trim()) nextErrors.title = "Update title is required.";
    if (!uBody.trim()) nextErrors.body = "Update body is required.";

    setUpdateErrors(nextErrors);
    setUpdateServerError(null);

    if (Object.keys(nextErrors).length > 0) return;

    const payload: CreateUpdateRequest = {
      title: uTitle.trim(),
      body: uBody.trim(),
    };

    try {
      setCreatingUpdate(true);

      if (editingUpdate) {
        await api.demoUpdateUpdate(data.project.id, editingUpdate.id, payload);
      } else {
        await api.demoCreateUpdate(data.project.id, payload);
      }

      closeUpdateModal();
      await load();
    } catch (e: any) {
      setUpdateServerError(String(e?.message ?? e));
    } finally {
      setCreatingUpdate(false);
    }
  }

  /**
   * Delete demo project.
   */
  async function onDeleteProject() {
    if (!data) return;

    if (!confirm(`Delete project "${data.project.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      setPageError(null);
      await api.demoDeleteProject(data.project.id);
      navigate("/demo");
    } catch (e: any) {
      setPageError(String(e?.message ?? e));
    }
  }

  /**
   * Delete demo task.
   */
  async function onDeleteTask(projectId: string, taskId: string) {
    if (!confirm("Delete this task?")) return;

    try {
      setPageError(null);
      await api.demoDeleteTask(projectId, taskId);
      await load();
    } catch (e: any) {
      setPageError(String(e?.message ?? e));
    }
  }

  /**
   * Delete demo update.
   */
  async function onDeleteUpdate(projectID: string, updateId: string) {
    if (!confirm("Delete this update?")) return;

    try {
      setPageError(null);
      await api.demoDeleteUpdate(projectID, updateId);
      await load();
    } catch (e: any) {
      setPageError(String(e?.message ?? e));
    }
  }

  return (
    <main className="container">
      <Link className="backLink" to="/demo">
        ← Back
      </Link>

      {loading && <p className="muted">Loading…</p>}
      {pageError && <p style={{ color: "salmon" }}>{pageError}</p>}

      {data && (
        <>
          <PageHeader
            title={`${data.project.name} (Demo)`}
            subtitle="Sandbox mode — safe CRUD"
            right={
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={openCreateTaskModal}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.10)",
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  + Create Task
                </button>

                <button
                  type="button"
                  onClick={openCreateUpdateModal}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.10)",
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  + Create Update
                </button>

                <button
                  type="button"
                  onClick={onDeleteProject}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "rgba(255, 80, 80, 0.14)",
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  Delete Project
                </button>
              </div>
            }
          />

          <div className="spacer" />

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

                        <div
                          style={{
                            marginTop: 10,
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                          }}
                        >
                          <span className="muted2" style={{ fontSize: 13 }}>
                            Status
                          </span>

                          <select
                            value={t.status}
                            onChange={async (e) => {
                              if (!data) return;
                              const next = e.target.value as TaskStatus;
                              await api.demoUpdateTask(data.project.id, t.id, {
                                status: next,
                              });
                              await load();
                            }}
                            style={{ padding: 8, borderRadius: 10 }}
                          >
                            <option value="BACKLOG">BACKLOG</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="DONE">DONE</option>
                          </select>
                        </div>

                        <div className="taskFooter">Updated {fmt(t.updatedAt)}</div>

                        <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                          <button
                            type="button"
                            onClick={() => openEditTaskModal(t)}
                            style={{
                              padding: "8px 10px",
                              borderRadius: 10,
                              border: "1px solid var(--border)",
                              background: "rgba(255,255,255,0.08)",
                              color: "var(--text)",
                              cursor: "pointer",
                            }}
                          >
                            Edit Task
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteTask(data.project.id, t.id)}
                            style={{
                              padding: "8px 10px",
                              borderRadius: 10,
                              border: "1px solid var(--border)",
                              background: "rgba(255, 80, 80, 0.12)",
                              color: "var(--text)",
                              cursor: "pointer",
                            }}
                          >
                            Delete Task
                          </button>
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

                  <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => openEditUpdateModal(u)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "rgba(255,255,255,0.08)",
                        color: "var(--text)",
                        cursor: "pointer",
                      }}
                    >
                      Edit Update
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteUpdate(data.project.id, u.id)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "rgba(255, 80, 80, 0.12)",
                        color: "var(--text)",
                        cursor: "pointer",
                      }}
                    >
                      Delete Update
                    </button>
                  </div>
                </div>
              ))}

              {updatesSorted.length === 0 ? (
                <p className="muted">No updates yet.</p>
              ) : null}
            </div>
          </section>

          {/* =========================
              Create/Edit Task Modal
             ========================= */}
          {taskModalOpen && (
            <div
              role="dialog"
              aria-modal="true"
              onClick={closeTaskModal}
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
                  padding: 16,
                  borderRadius: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <h2 className="h2" style={{ marginTop: 0 }}>
                    {editingTask ? "Edit Task" : "Create Task"}
                  </h2>

                  <button
                    type="button"
                    onClick={closeTaskModal}
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

                {taskServerError && (
                  <p style={{ color: "salmon", marginTop: 0 }}>{taskServerError}</p>
                )}

                <div style={{ display: "grid", gap: 10 }}>
                  <input
                    value={tTitle}
                    onChange={(e) => {
                      const v = e.target.value;
                      setTTitle(v);
                      if (taskErrors.title && v.trim()) {
                        setTaskErrors((prev) => ({ ...prev, title: undefined }));
                      }
                    }}
                    placeholder="Title"
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      background: "rgba(0,0,0,0.12)",
                      color: "var(--text)",
                    }}
                  />

                  {taskErrors.title && (
                    <div style={{ color: "salmon", fontSize: 13, marginTop: -6 }}>
                      {taskErrors.title}
                    </div>
                  )}

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

                  <div className="row">
                    <select
                      value={tStatus}
                      onChange={(e) => setTStatus(e.target.value as TaskStatus)}
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
                      onChange={(e) => setTPriority(e.target.value as TaskPriority)}
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

                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={closeTaskModal}
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
                      onClick={onSubmitTask}
                      disabled={creatingTask}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: "rgba(255,255,255,0.10)",
                        color: "var(--text)",
                        cursor: creatingTask ? "not-allowed" : "pointer",
                        opacity: creatingTask ? 0.7 : 1,
                      }}
                    >
                      {creatingTask
                        ? editingTask
                          ? "Saving..."
                          : "Creating..."
                        : editingTask
                        ? "Save Task"
                        : "Create Task"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================
              Create/Edit Update Modal
             ========================= */}
          {updateModalOpen && (
            <div
              role="dialog"
              aria-modal="true"
              onClick={closeUpdateModal}
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
                  padding: 16,
                  borderRadius: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <h2 className="h2" style={{ marginTop: 0 }}>
                    {editingUpdate ? "Edit Update" : "Create Update"}
                  </h2>

                  <button
                    type="button"
                    onClick={closeUpdateModal}
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

                {updateServerError && (
                  <p style={{ color: "salmon", marginTop: 0 }}>{updateServerError}</p>
                )}

                <div style={{ display: "grid", gap: 10 }}>
                  <input
                    value={uTitle}
                    onChange={(e) => {
                      const v = e.target.value;
                      setUTitle(v);
                      if (updateErrors.title && v.trim()) {
                        setUpdateErrors((prev) => ({ ...prev, title: undefined }));
                      }
                    }}
                    placeholder="Title"
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      background: "rgba(0,0,0,0.12)",
                      color: "var(--text)",
                    }}
                  />

                  {updateErrors.title && (
                    <div style={{ color: "salmon", fontSize: 13, marginTop: -6 }}>
                      {updateErrors.title}
                    </div>
                  )}

                  <textarea
                    value={uBody}
                    onChange={(e) => {
                      const v = e.target.value;
                      setUBody(v);
                      if (updateErrors.body && v.trim()) {
                        setUpdateErrors((prev) => ({ ...prev, body: undefined }));
                      }
                    }}
                    placeholder="Body"
                    rows={6}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      background: "rgba(0,0,0,0.12)",
                      color: "var(--text)",
                    }}
                  />

                  {updateErrors.body && (
                    <div style={{ color: "salmon", fontSize: 13, marginTop: -6 }}>
                      {updateErrors.body}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={closeUpdateModal}
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
                      onClick={onSubmitUpdate}
                      disabled={creatingUpdate}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: "rgba(255,255,255,0.10)",
                        color: "var(--text)",
                        cursor: creatingUpdate ? "not-allowed" : "pointer",
                        opacity: creatingUpdate ? 0.7 : 1,
                      }}
                    >
                      {creatingUpdate
                        ? editingUpdate
                          ? "Saving..."
                          : "Creating..."
                        : editingUpdate
                        ? "Save Update"
                        : "Create Update"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}