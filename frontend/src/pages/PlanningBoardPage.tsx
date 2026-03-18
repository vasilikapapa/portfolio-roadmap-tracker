import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader/PageHeader";
import { api, type ProjectDetailsDto, type TaskDto } from "../lib/api";
import "../styles/projectDetails.css";
import { useAuth } from "../context/AuthContext";

/**
 * Planning board item saved in localStorage.
 *
 * taskId:
 * - references a roadmap task
 *
 * isCurrent:
 * - marks the task currently being worked on
 */
type PlanningItem = {
  taskId: string;
  isCurrent: boolean;
};

/**
 * Build a localStorage key per project slug
 * so each project gets its own planning queue.
 */
function getPlanningStorageKey(slug: string) {
  return `planning-board:${slug}`;
}

/**
 * Safely reads saved planning items from localStorage.
 */
function loadPlanningItems(slug: string): PlanningItem[] {
  try {
    const raw = localStorage.getItem(getPlanningStorageKey(slug));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item) =>
        item &&
        typeof item.taskId === "string" &&
        typeof item.isCurrent === "boolean"
    );
  } catch {
    return [];
  }
}

/**
 * Saves planning items to localStorage.
 */
function savePlanningItems(slug: string, items: PlanningItem[]) {
  localStorage.setItem(getPlanningStorageKey(slug), JSON.stringify(items));
}

/**
 * Moves one item up/down in an array.
 */
function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * PlanningBoardPage
 *
 * Purpose:
 * - personal development planning board
 * - select roadmap tasks
 * - organize them in the order you want to work on them
 * - mark one task as currently active
 *
 * MVP version:
 * - persists in localStorage
 * - no backend changes required yet
 */
export default function PlanningBoardPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isDemo } = useAuth();

  const [data, setData] = useState<ProjectDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Selected task from dropdown before adding to queue
  const [selectedTaskId, setSelectedTaskId] = useState("");

  // Ordered planning queue
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);

  /**
   * Load project details.
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
   * Load saved planning queue from localStorage
   * once we know the project slug.
   */
  useEffect(() => {
    if (!slug) return;
    setPlanningItems(loadPlanningItems(slug));
  }, [slug]);

  /**
   * Persist planning queue changes.
   */
  useEffect(() => {
    if (!slug) return;
    savePlanningItems(slug, planningItems);
  }, [slug, planningItems]);

  /**
   * Quick lookup for task by id.
   */
  const taskLookup = useMemo(() => {
    const map = new Map<string, TaskDto>();

    for (const task of data?.tasks ?? []) {
      map.set(task.id, task);
    }

    return map;
  }, [data]);

  /**
   * Tasks that are not already in the planning queue,
   * so they can still be added.
   */
  const availableTasks = useMemo(() => {
    const usedIds = new Set(planningItems.map((item) => item.taskId));

    return (data?.tasks ?? []).filter(
      (task) => task.status !== "DONE" && !usedIds.has(task.id)
    );
  }, [data, planningItems]);

  /**
   * Resolved planning tasks with full task info.
   * Filters out any stale saved task ids that no longer exist.
   */
  const plannedTasks = useMemo(() => {
    return planningItems
      .map((item) => {
        const task = taskLookup.get(item.taskId);
        if (!task) return null;

        return {
          ...item,
          task,
        };
      })
      .filter(Boolean) as Array<PlanningItem & { task: TaskDto }>;
  }, [planningItems, taskLookup]);

  /**
   * Add selected task to the planning queue.
   */
  function addTaskToPlanningBoard() {
    if (!selectedTaskId) return;

    setPlanningItems((prev) => [
      ...prev,
      {
        taskId: selectedTaskId,
        isCurrent: prev.length === 0, // first item becomes current by default
      },
    ]);

    setSelectedTaskId("");
  }

  /**
   * Remove a task from the planning queue.
   */
  function removePlanningItem(taskId: string) {
    setPlanningItems((prev) => {
      const next = prev.filter((item) => item.taskId !== taskId);

      // Ensure one task remains "current" if queue still has items
      if (next.length > 0 && !next.some((item) => item.isCurrent)) {
        next[0] = { ...next[0], isCurrent: true };
      }

      return next;
    });
  }

  /**
   * Mark exactly one task as currently being worked on.
   */
  function setCurrentTask(taskId: string) {
    setPlanningItems((prev) =>
      prev.map((item) => ({
        ...item,
        isCurrent: item.taskId === taskId,
      }))
    );
  }

  /**
   * Move a planning item up.
   */
  function moveUp(index: number) {
    if (index === 0) return;
    setPlanningItems((prev) => moveItem(prev, index, index - 1));
  }

  /**
   * Move a planning item down.
   */
  function moveDown(index: number) {
    setPlanningItems((prev) => {
      if (index === prev.length - 1) return prev;
      return moveItem(prev, index, index + 1);
    });
  }

  /**
   * Clear the whole planning queue.
   */
  function clearPlanningBoard() {
    if (!confirm("Clear the planning board for this project?")) return;
    setPlanningItems([]);
  }

  return (
    <main className="container">
      <Link className="backLink" to={slug ? `/admin/projects/${slug}` : "/projects"}>
        ← Back
      </Link>

      {loading && <p className="muted">Loading…</p>}
      {pageError && <p style={{ color: "salmon" }}>{pageError}</p>}

      {data && (
        <>
          <PageHeader
            title={`${data.project.name} Planning Board`}
            subtitle="Organize the order of tasks you want to work on next."
            right={
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={clearPlanningBoard}
                  disabled={isDemo}
                  title={isDemo ? "Disabled in demo mode" : ""}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "rgba(255, 80, 80, 0.10)",
                    color: "var(--text)",
                    cursor: isDemo ? "not-allowed" : "pointer",
                    opacity: isDemo ? 0.6 : 1,
                  }}
                >
                  Clear Board
                </button>
              </div>
            }
          />

          {isDemo && (
            <div
              className="card"
              style={{
                padding: 14,
                marginTop: 16,
                border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.05)",
              }}
            >
              <p style={{ margin: 0 }}>
                Demo mode: This planning board is view-only. Editing is disabled
                to protect the real admin data.
              </p>
            </div>
          )}

          <div className="spacer" />

          {/* =========================
              Add task to planning queue
             ========================= */}
          <section className="card" style={{ padding: 16 }}>
            <h2 className="h2" style={{ marginTop: 0 }}>
              Add Task to Planning Queue
            </h2>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                disabled={isDemo}
                style={{
                  flex: 1,
                  minWidth: 260,
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "#111827",
                  color: "#ffffff",
                  cursor: isDemo ? "not-allowed" : "pointer",
                  opacity: isDemo ? 0.7 : 1,
                }}
              >
                <option value="">Select a roadmap task</option>

                {availableTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={addTaskToPlanningBoard}
                disabled={isDemo || !selectedTaskId}
                title={isDemo ? "Disabled in demo mode" : ""}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.10)",
                  color: "var(--text)",
                  cursor: isDemo || !selectedTaskId ? "not-allowed" : "pointer",
                  opacity: isDemo || !selectedTaskId ? 0.7 : 1,
                }}
              >
                + Add to Plan
              </button>
            </div>

            {isDemo ? (
              <p className="muted" style={{ marginBottom: 0 }}>
                Demo users can view the planning board, but editing is disabled to
                protect the real admin data.
              </p>
            ) : availableTasks.length === 0 ? (
              <p className="muted" style={{ marginBottom: 0 }}>
                All project tasks are already in the planning queue.
              </p>
            ) : null}
          </section>

          <div className="spacer" />

          {/* =========================
              Planning queue
             ========================= */}
          <section>
            <h2 className="h2">Development Queue</h2>

            {plannedTasks.length === 0 ? (
              <div className="card" style={{ padding: 16 }}>
                <p className="muted" style={{ margin: 0 }}>
                  No tasks added yet. Select a roadmap task and add it to your queue.
                </p>
              </div>
            ) : (
              <div className="updates-groups">
                {plannedTasks.map((item, index) => (
                  <article key={item.taskId} className="update-group">
                    <div className="update-group-header">
                      <div>
                        <h3 style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span>#{index + 1}</span>
                          <span>{item.task.title}</span>
                        </h3>

                        <p className="update-group-subtitle">
                          {item.task.type} · {item.task.priority} · {item.task.status}
                          {item.task.targetVersion
                            ? ` · Target version: ${item.task.targetVersion}`
                            : ""}
                        </p>

                        {item.isCurrent ? (
                          <p
                            style={{
                              margin: "8px 0 0",
                              fontSize: 13,
                              color: "var(--text)",
                            }}
                          >
                            Currently working on
                          </p>
                        ) : null}
                      </div>

                      <span>{item.isCurrent ? "Now" : index + 1}</span>
                    </div>

                    {item.task.description ? (
                      <div className="updateDesc">{item.task.description}</div>
                    ) : null}

                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                        marginTop: 14,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setCurrentTask(item.taskId)}
                        disabled={isDemo}
                        title={isDemo ? "Disabled in demo mode" : ""}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: "rgba(255,255,255,0.08)",
                          color: "var(--text)",
                          cursor: isDemo ? "not-allowed" : "pointer",
                          opacity: isDemo ? 0.7 : 1,
                        }}
                      >
                        Mark Current
                      </button>

                      <button
                        type="button"
                        onClick={() => moveUp(index)}
                        disabled={isDemo || index === 0}
                        title={isDemo ? "Disabled in demo mode" : ""}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: "rgba(255,255,255,0.08)",
                          color: "var(--text)",
                          cursor: isDemo || index === 0 ? "not-allowed" : "pointer",
                          opacity: isDemo || index === 0 ? 0.7 : 1,
                        }}
                      >
                        Move Up
                      </button>

                      <button
                        type="button"
                        onClick={() => moveDown(index)}
                        disabled={isDemo || index === plannedTasks.length - 1}
                        title={isDemo ? "Disabled in demo mode" : ""}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: "rgba(255,255,255,0.08)",
                          color: "var(--text)",
                          cursor:
                            isDemo || index === plannedTasks.length - 1
                              ? "not-allowed"
                              : "pointer",
                          opacity:
                            isDemo || index === plannedTasks.length - 1 ? 0.7 : 1,
                        }}
                      >
                        Move Down
                      </button>

                      <button
                        type="button"
                        onClick={() => removePlanningItem(item.taskId)}
                        disabled={isDemo}
                        title={isDemo ? "Disabled in demo mode" : ""}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: "rgba(255, 80, 80, 0.12)",
                          color: "var(--text)",
                          cursor: isDemo ? "not-allowed" : "pointer",
                          opacity: isDemo ? 0.7 : 1,
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}