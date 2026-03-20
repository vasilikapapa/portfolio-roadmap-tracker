import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import PageHeader from "../components/PageHeader/PageHeader";
import {
  api,
  type CreateTaskRequest,
  type CreateUpdateRequest,
  type ProjectDetailsDto,
  type TaskDto,
  type TaskPriority,
  type TaskStatus,
  type UpdateDto,
} from "../lib/api";

import "../styles/projectDetails.css";

/**
 * Default task types always shown first in the dropdown.
 * Backend now supports flexible string types, so these are just common options.
 */
const DEFAULT_TASK_TYPE_OPTIONS = ["FEATURE", "BUG", "REFACTOR"] as const;

/**
 * Groups tasks into Kanban columns by their status.
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
 * Groups updates by related task.
 *
 * Rules:
 * - If update.taskId exists, group under that task id
 * - Otherwise place it under "general"
 * - Each group is sorted newest first
 */
function groupUpdatesByTask(updates: UpdateDto[]) {
  const map: Record<string, UpdateDto[]> = {};

  for (const update of updates) {
    const key = update.taskId ?? "general";

    if (!map[key]) {
      map[key] = [];
    }

    map[key].push(update);
  }

  for (const key of Object.keys(map)) {
    map[key].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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
 * Friendly label for task status columns.
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
 * Formats backend task type values for display.
 *
 * Examples:
 * - FEATURE -> Feature
 * - BUG_FIX -> Bug Fix
 * - api-integration -> Api Integration
 */
function formatTaskType(type?: string | null) {
  if (!type) return "Unspecified";

  return type
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Temporary draft item used only while creating
 * multiple updates in one modal submission.
 */
type UpdateDraft = {
  title: string;
  body: string;
};

export default function AdminProjectDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<ProjectDetailsDto | null>(null);

  // ---------------------------
  // Page state
  // ---------------------------
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // ---------------------------
  // Modal open state
  // ---------------------------
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);

  // ---------------------------
  // Editing state
  // ---------------------------
  const [editingTask, setEditingTask] = useState<TaskDto | null>(null);
  const [editingUpdate, setEditingUpdate] = useState<UpdateDto | null>(null);

  // ---------------------------
  // Server errors shown inside modals
  // ---------------------------
  const [taskServerError, setTaskServerError] = useState<string | null>(null);
  const [updateServerError, setUpdateServerError] = useState<string | null>(
    null
  );

  // ---------------------------
  // Field-level validation errors
  // ---------------------------
  const [taskErrors, setTaskErrors] = useState<{
    title?: string;
    type?: string;
  }>({});
  const [updateErrors, setUpdateErrors] = useState<{
    title?: string;
    body?: string;
    drafts?: string;
  }>({});

  // ---------------------------
  // Task form state
  // ---------------------------
  const [tTitle, setTTitle] = useState("");
  const [tDesc, setTDesc] = useState("");
  const [tStatus, setTStatus] = useState<TaskStatus>("BACKLOG");

  /**
   * Task type UI state
   *
   * - tTypeSelect = value chosen in dropdown
   * - tTypeCustom = manual value when dropdown is OTHER
   *
   * Final backend payload always receives a single string.
   */
  const [tTypeSelect, setTTypeSelect] = useState("FEATURE");
  const [tTypeCustom, setTTypeCustom] = useState("");

  const [tPriority, setTPriority] = useState<TaskPriority>("MEDIUM");
  const [tTarget, setTTarget] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  // ---------------------------
  // Update form state
  // ---------------------------
  const [uTaskId, setUTaskId] = useState("");
  const [uTitle, setUTitle] = useState("");
  const [uBody, setUBody] = useState("");
  const [creatingUpdate, setCreatingUpdate] = useState(false);

  // ---------------------------
  // Create mode only:
  // allows multiple updates to be submitted at once
  // for the same selected task
  // ---------------------------
  const [updateDrafts, setUpdateDrafts] = useState<UpdateDraft[]>([
    { title: "", body: "" },
  ]);

  // ---------------------------
  // Update group collapse / expand state
  // ---------------------------
  const [expandedUpdateGroups, setExpandedUpdateGroups] = useState<Set<string>>(
    new Set(["general"])
  );

  /**
   * Stores DOM refs for each update group so we can
   * scroll to a group when "See Updates" is clicked.
   */
  const updateGroupRefs = useRef<Record<string, HTMLElement | null>>({});

  /**
   * Task type dropdown options:
   * 1. FEATURE / BUG / REFACTOR
   * 2. any extra types already used in this project
   * 3. OTHER
   *
   * This keeps the UI friendly while still supporting
   * flexible backend task types.
   */
  const taskTypeOptions = useMemo(() => {
    const existingTypes = Array.from(
      new Set((data?.tasks ?? []).map((task) => task.type).filter(Boolean))
    ).filter((type) => !DEFAULT_TASK_TYPE_OPTIONS.includes(type as any));

    return [...DEFAULT_TASK_TYPE_OPTIONS, ...existingTypes, "OTHER"];
  }, [data]);

  /**
   * Final task type sent to backend.
   * - normal dropdown value
   * - or custom input value if OTHER is selected
   */
  const finalTaskType =
    tTypeSelect === "OTHER" ? tTypeCustom.trim() : tTypeSelect.trim();

  /**
   * Reset task modal state to clean CREATE mode defaults.
   */
  function resetTaskModalState() {
    setTaskErrors({});
    setTaskServerError(null);
    setEditingTask(null);
    setTTitle("");
    setTDesc("");
    setTStatus("BACKLOG");
    setTTypeSelect("FEATURE");
    setTTypeCustom("");
    setTPriority("MEDIUM");
    setTTarget("");
  }

  /**
   * Reset update modal state to clean CREATE mode defaults.
   */
  function resetUpdateModalState() {
    setUpdateErrors({});
    setUpdateServerError(null);
    setEditingUpdate(null);
    setUTaskId("");
    setUTitle("");
    setUBody("");
    setUpdateDrafts([{ title: "", body: "" }]);
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
   * Loads project details from backend.
   */
  async function load() {
    if (!slug) return;

    setLoading(true);
    setPageError(null);

    try {
      const details = await api.getProjectDetailsBySlug(slug);
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
   * Close open modals with Escape.
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

  const updatesGrouped = useMemo(() => {
    return groupUpdatesByTask(data?.updates ?? []);
  }, [data]);

  const taskLookup = useMemo(() => {
    const map = new Map<string, TaskDto>();

    for (const task of data?.tasks ?? []) {
      map.set(task.id, task);
    }

    return map;
  }, [data]);

  const groupedTaskIds = useMemo(() => {
    return Object.keys(updatesGrouped).filter((key) => key !== "general");
  }, [updatesGrouped]);

  function toggleUpdateGroup(groupKey: string) {
    setExpandedUpdateGroups((prev) => {
      const next = new Set(prev);

      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }

      return next;
    });
  }

  function openTaskUpdates(taskId: string) {
    setExpandedUpdateGroups((prev) => {
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });

    requestAnimationFrame(() => {
      updateGroupRefs.current[taskId]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function openCreateTaskModal() {
    resetTaskModalState();
    setTaskModalOpen(true);
  }

  /**
   * Open task modal in EDIT mode.
   *
   * If the current backend type matches a common/default option
   * or an existing task type option, we select it directly.
   * Otherwise we switch to OTHER and place the value into custom input.
   */
  function openEditTaskModal(task: TaskDto) {
    setEditingTask(task);
    setTaskServerError(null);
    setTaskErrors({});

    setTTitle(task.title ?? "");
    setTDesc(task.description ?? "");
    setTStatus(task.status);

    const existingType = task.type ?? "";
    const canSelectDirectly = taskTypeOptions.includes(existingType);

    if (canSelectDirectly && existingType !== "OTHER") {
      setTTypeSelect(existingType);
      setTTypeCustom("");
    } else {
      setTTypeSelect("OTHER");
      setTTypeCustom(existingType);
    }

    setTPriority(task.priority);
    setTTarget(task.targetVersion ?? "");

    setTaskModalOpen(true);
  }

  function openCreateUpdateModal() {
    resetUpdateModalState();
    setUpdateModalOpen(true);
  }

  function openEditUpdateModal(update: UpdateDto) {
    setEditingUpdate(update);
    setUpdateServerError(null);
    setUpdateErrors({});

    setUTaskId(update.taskId ?? "");
    setUTitle(update.title ?? "");
    setUBody(update.body ?? "");

    setUpdateModalOpen(true);
  }

  function addUpdateDraft() {
    setUpdateDrafts((prev) => [...prev, { title: "", body: "" }]);
  }

  function removeUpdateDraft(index: number) {
    setUpdateDrafts((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  function updateDraftField(
    index: number,
    field: keyof UpdateDraft,
    value: string
  ) {
    setUpdateDrafts((prev) =>
      prev.map((draft, i) =>
        i === index ? { ...draft, [field]: value } : draft
      )
    );
  }

  /**
   * Create or update a task.
   */
  async function onSubmitTask() {
    if (!data) return;

    const nextErrors: { title?: string; type?: string } = {};

    if (!tTitle.trim()) nextErrors.title = "Task title is required.";
    if (!finalTaskType) nextErrors.type = "Task type is required.";

    setTaskErrors(nextErrors);
    setTaskServerError(null);

    if (Object.keys(nextErrors).length > 0) return;

    const payload: CreateTaskRequest = {
      title: tTitle.trim(),
      description: tDesc.trim() ? tDesc.trim() : null,
      status: tStatus,
      type: finalTaskType,
      priority: tPriority,
      targetVersion: tTarget.trim() ? tTarget.trim() : null,
    };

    try {
      setCreatingTask(true);

      if (editingTask) {
        await api.updateTask(data.project.id, editingTask.id, payload);
      } else {
        await api.createTask(data.project.id, payload);
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
   * Create or update updates.
   */
  async function onSubmitUpdate() {
    if (!data) return;

    setUpdateErrors({});
    setUpdateServerError(null);

    if (editingUpdate) {
      const nextErrors: { title?: string; body?: string } = {};
      if (!uTitle.trim()) nextErrors.title = "Update title is required.";
      if (!uBody.trim()) nextErrors.body = "Update body is required.";

      setUpdateErrors(nextErrors);

      if (Object.keys(nextErrors).length > 0) return;

      const payload: CreateUpdateRequest = {
        taskId: uTaskId || null,
        title: uTitle.trim(),
        body: uBody.trim(),
      };

      try {
        setCreatingUpdate(true);
        await api.updateUpdate(data.project.id, editingUpdate.id, payload);
        closeUpdateModal();
        await load();
      } catch (e: any) {
        setUpdateServerError(String(e?.message ?? e));
      } finally {
        setCreatingUpdate(false);
      }

      return;
    }

    const cleanedDrafts = updateDrafts
      .map((draft) => ({
        title: draft.title.trim(),
        body: draft.body.trim(),
      }))
      .filter((draft) => draft.title || draft.body);

    const nextErrors: { drafts?: string } = {};

    if (cleanedDrafts.length === 0) {
      nextErrors.drafts = "Add at least one update with a title and body.";
    } else if (cleanedDrafts.some((draft) => !draft.title || !draft.body)) {
      nextErrors.drafts =
        "Each update in the list must include both a title and a body.";
    }

    setUpdateErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    try {
      setCreatingUpdate(true);

      for (const draft of cleanedDrafts) {
        const payload: CreateUpdateRequest = {
          taskId: uTaskId || null,
          title: draft.title,
          body: draft.body,
        };

        await api.createUpdate(data.project.id, payload);
      }

      closeUpdateModal();
      await load();
    } catch (e: any) {
      setUpdateServerError(String(e?.message ?? e));
    } finally {
      setCreatingUpdate(false);
    }
  }

  async function onDeleteTask(taskId: string) {
    if (!data) return;
    if (!confirm("Delete this task?")) return;

    try {
      setPageError(null);
      await api.deleteTask(taskId);
      await load();
    } catch (e: any) {
      setPageError(String(e?.message ?? e));
    }
  }

  async function onDeleteUpdate(updateId: string) {
    if (!confirm("Delete this update?")) return;

    try {
      setPageError(null);
      await api.deleteUpdate(updateId);
      await load();
    } catch (e: any) {
      setPageError(String(e?.message ?? e));
    }
  }

  async function onDeleteProject() {
    if (!data) return;

    if (
      !confirm(`Delete project "${data.project.name}"? This cannot be undone.`)
    ) {
      return;
    }

    try {
      setPageError(null);
      await api.deleteProject(data.project.id);
      navigate("/projects");
    } catch (e: any) {
      setPageError(String(e?.message ?? e));
    }
  }

  return (
    <main className="container">
      <Link className="backLink" to="/projects">
        ← Back
      </Link>

      {loading && <p className="muted">Loading…</p>}
      {pageError && <p style={{ color: "salmon" }}>{pageError}</p>}

      {data && (
        <>
          <PageHeader
            title={data.project.name}
            subtitle={data.project.summary ?? undefined}
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
                  onClick={() =>
                    navigate(`/admin/projects/${data.project.slug}/planning`)
                  }
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.10)",
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  Planning Board
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

          {data.project.description && (
            <div className="projectDescription">
              {data.project.description}
            </div>
          )}

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
                          <span className="pill">{formatTaskType(t.type)}</span>
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
                              const next = e.target.value as TaskStatus;
                              await api.updateTask(data.project.id, t.id, {
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

                        <div className="taskFooter">
                          Updated {fmt(t.updatedAt)}
                        </div>

                        <div
                          style={{
                            marginTop: 10,
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          {t.status === "DONE" && updatesGrouped[t.id]?.length ? (
                            <button
                              type="button"
                              onClick={() => openTaskUpdates(t.id)}
                              style={{
                                padding: "8px 10px",
                                borderRadius: 10,
                                border: "1px solid var(--border)",
                                background: "rgba(255,255,255,0.08)",
                                color: "var(--text)",
                                cursor: "pointer",
                              }}
                            >
                              See Updates
                            </button>
                          ) : null}

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
                            onClick={() => onDeleteTask(t.id)}
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

            {updatesSorted.length === 0 ? (
              <p className="muted">No updates yet.</p>
            ) : (
              <div className="updates-groups">
                {updatesGrouped.general?.length ? (
                  <section
                    className="update-group"
                    ref={(el) => {
                      updateGroupRefs.current.general = el;
                    }}
                  >
                    <div
                      className="update-group-header"
                      onClick={() => toggleUpdateGroup("general")}
                      style={{ cursor: "pointer" }}
                    >
                      <div>
                        <h3>General Project Updates</h3>
                        <p className="update-group-subtitle">
                          {expandedUpdateGroups.has("general")
                            ? "Hide full history"
                            : "Click to view history"}
                        </p>
                      </div>

                      <span>
                        {updatesGrouped.general.length}{" "}
                        {expandedUpdateGroups.has("general") ? "−" : "+"}
                      </span>
                    </div>

                    {expandedUpdateGroups.has("general") && (
                      <div className="updates-list">
                        {updatesGrouped.general.map((u) => (
                          <article key={u.id} className="update-card">
                            <div className="update-card-top">
                              <div>
                                <h4>{u.title}</h4>
                                <p className="update-meta">{fmt(u.createdAt)}</p>
                              </div>

                              <div className="update-actions">
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
                                  onClick={() => onDeleteUpdate(u.id)}
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

                            <p>{u.body}</p>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                ) : null}

                {groupedTaskIds.map((taskId) => {
                  const task = taskLookup.get(taskId);
                  const updates = updatesGrouped[taskId] ?? [];
                  const isExpanded = expandedUpdateGroups.has(taskId);

                  return (
                    <section
                      key={taskId}
                      className="update-group"
                      ref={(el) => {
                        updateGroupRefs.current[taskId] = el;
                      }}
                    >
                      <div
                        className="update-group-header"
                        onClick={() => toggleUpdateGroup(taskId)}
                        style={{ cursor: "pointer" }}
                      >
                        <div>
                          <h3>{task?.title ?? "Related Task"}</h3>
                          <p className="update-group-subtitle">
                            {task?.targetVersion
                              ? `Target version: ${task.targetVersion}`
                              : "Task update history"}
                            {" · "}
                            {isExpanded ? "Hide details" : "Click to view updates"}
                          </p>
                        </div>

                        <span>
                          {updates.length} {isExpanded ? "−" : "+"}
                        </span>
                      </div>

                      {isExpanded && (
                        <div className="updates-list">
                          {updates.map((u) => (
                            <article key={u.id} className="update-card">
                              <div className="update-card-top">
                                <div>
                                  <h4>{u.title}</h4>
                                  <p className="update-meta">{fmt(u.createdAt)}</p>
                                </div>

                                <div className="update-actions">
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
                                    onClick={() => onDeleteUpdate(u.id)}
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

                              <p>{u.body}</p>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </section>

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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
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
                  <p style={{ color: "salmon", marginTop: 0 }}>
                    {taskServerError}
                  </p>
                )}

                <div style={{ display: "grid", gap: 10 }}>
                  <input
                    value={tTitle}
                    onChange={(e) => {
                      const v = e.target.value;
                      setTTitle(v);

                      if (taskErrors.title && v.trim()) {
                        setTaskErrors((prev) => ({
                          ...prev,
                          title: undefined,
                        }));
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

                    {/* 
                      Task type select:
                      - shows default types first
                      - then existing project types
                      - then OTHER
                      - if OTHER is chosen, show a custom input
                    */}
                    <select
                      value={tTypeSelect}
                      onChange={(e) => {
                        const next = e.target.value;
                        setTTypeSelect(next);

                        if (next !== "OTHER") {
                          setTTypeCustom("");
                        }

                        const hasValue =
                          next === "OTHER"
                            ? tTypeCustom.trim().length > 0
                            : next.trim().length > 0;

                        if (taskErrors.type && hasValue) {
                          setTaskErrors((prev) => ({
                            ...prev,
                            type: undefined,
                          }));
                        }
                      }}
                      style={{ padding: 10, borderRadius: 10 }}
                    >
                      {taskTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option === "OTHER" ? "OTHER" : formatTaskType(option)}
                        </option>
                      ))}
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

                  {tTypeSelect === "OTHER" && (
                    <input
                      value={tTypeCustom}
                      onChange={(e) => {
                        const v = e.target.value;
                        setTTypeCustom(v);

                        if (taskErrors.type && v.trim()) {
                          setTaskErrors((prev) => ({
                            ...prev,
                            type: undefined,
                          }));
                        }
                      }}
                      placeholder="Enter custom task type"
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "rgba(0,0,0,0.12)",
                        color: "var(--text)",
                      }}
                    />
                  )}

                  {taskErrors.type && (
                    <div style={{ color: "salmon", fontSize: 13, marginTop: -6 }}>
                      {taskErrors.type}
                    </div>
                  )}

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

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      justifyContent: "flex-end",
                    }}
                  >
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
                  width: "min(820px, 100%)",
                  padding: 16,
                  borderRadius: 16,
                  maxHeight: "90vh",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <h2 className="h2" style={{ marginTop: 0 }}>
                    {editingUpdate ? "Edit Update" : "Create Updates"}
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
                  <p style={{ color: "salmon", marginTop: 0 }}>
                    {updateServerError}
                  </p>
                )}

                <div style={{ display: "grid", gap: 12 }}>
                  <select
                    value={uTaskId}
                    onChange={(e) => setUTaskId(e.target.value)}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <option value="">General project update</option>

                    {(data.tasks ?? []).map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>

                  {editingUpdate ? (
                    <>
                      <input
                        value={uTitle}
                        onChange={(e) => {
                          const v = e.target.value;
                          setUTitle(v);

                          if (updateErrors.title && v.trim()) {
                            setUpdateErrors((prev) => ({
                              ...prev,
                              title: undefined,
                            }));
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
                        <div
                          style={{ color: "salmon", fontSize: 13, marginTop: -6 }}
                        >
                          {updateErrors.title}
                        </div>
                      )}

                      <textarea
                        value={uBody}
                        onChange={(e) => {
                          const v = e.target.value;
                          setUBody(v);

                          if (updateErrors.body && v.trim()) {
                            setUpdateErrors((prev) => ({
                              ...prev,
                              body: undefined,
                            }));
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
                        <div
                          style={{ color: "salmon", fontSize: 13, marginTop: -6 }}
                        >
                          {updateErrors.body}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="muted2" style={{ fontSize: 13 }}>
                        You can add multiple updates below. All of them will be
                        created for the selected task in one submission.
                      </div>

                      {updateDrafts.map((draft, index) => (
                        <div
                          key={index}
                          className="card-soft"
                          style={{
                            padding: 14,
                            borderRadius: 14,
                            display: "grid",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 10,
                              alignItems: "center",
                            }}
                          >
                            <strong>Update {index + 1}</strong>

                            <button
                              type="button"
                              onClick={() => removeUpdateDraft(index)}
                              disabled={updateDrafts.length === 1}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 10,
                                border: "1px solid var(--border)",
                                background:
                                  updateDrafts.length === 1
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(255, 80, 80, 0.12)",
                                color: "var(--text)",
                                cursor:
                                  updateDrafts.length === 1
                                    ? "not-allowed"
                                    : "pointer",
                                opacity: updateDrafts.length === 1 ? 0.7 : 1,
                              }}
                            >
                              Remove
                            </button>
                          </div>

                          <input
                            value={draft.title}
                            onChange={(e) => {
                              updateDraftField(index, "title", e.target.value);
                              if (updateErrors.drafts && e.target.value.trim()) {
                                setUpdateErrors((prev) => ({
                                  ...prev,
                                  drafts: undefined,
                                }));
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

                          <textarea
                            value={draft.body}
                            onChange={(e) => {
                              updateDraftField(index, "body", e.target.value);
                              if (updateErrors.drafts && e.target.value.trim()) {
                                setUpdateErrors((prev) => ({
                                  ...prev,
                                  drafts: undefined,
                                }));
                              }
                            }}
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
                        </div>
                      ))}

                      {updateErrors.drafts && (
                        <div
                          style={{ color: "salmon", fontSize: 13, marginTop: -4 }}
                        >
                          {updateErrors.drafts}
                        </div>
                      )}

                      <div>
                        <button
                          type="button"
                          onClick={addUpdateDraft}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 12,
                            border: "1px solid var(--border)",
                            background: "rgba(255,255,255,0.08)",
                            color: "var(--text)",
                            cursor: "pointer",
                          }}
                        >
                          + Add Another Update
                        </button>
                      </div>
                    </>
                  )}

                  <div
                    style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
                  >
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
                        : `Create ${updateDrafts.length > 1 ? "Updates" : "Update"}`}
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