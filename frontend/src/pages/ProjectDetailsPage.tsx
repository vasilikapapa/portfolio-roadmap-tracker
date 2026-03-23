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
  type UpdateDto,
} from "../lib/api";

import "../styles/projectDetails.css";

/**
 * Release notes shown when hovering a target version pill.
 *
 * You can expand this whenever you add more roadmap releases.
 * The key should match the exact value stored in targetVersion.
 */
const VERSION_DESCRIPTIONS: Record<string, string[]> = {
  "v1.0": [
    "Initial release with core project functionality",
    "Basic task board and public project view",
  ],
  "v1.1": [
    "Performance improvements",
    "Bug fixes",
    "UI polish and usability updates",
  ],
  "v1.2": [
    "Planning board improvements",
    "Task grouping enhancements",
    "Better project management workflow",
  ],
  "v2.0": [
    "Major feature expansion",
    "New roadmap experience",
    "Larger structural improvements across the app",
  ],
};

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
 * Groups updates by related task.
 *
 * Rules:
 * - If update.taskId exists, group under that task
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
 * Formats backend task type values for display.
 *
 * Why this matters:
 * - Backend task types are now dynamic strings
 * - They may come as:
 *   "FEATURE"
 *   "BUG_FIX"
 *   "tech_debt"
 *   "api integration"
 *
 * This helper makes them display nicely in the UI
 * without depending on a fixed frontend enum.
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
 * Converts a version code like "v1.1" into a friendlier title.
 */
function formatVersionTitle(version: string) {
  return `Version ${version.replace(/^v/i, "")}`;
}

/**
 * Returns tooltip lines for a version.
 *
 * If a version is not listed in VERSION_DESCRIPTIONS,
 * we still show a helpful fallback message.
 */
function getVersionDescription(version: string) {
  return (
    VERSION_DESCRIPTIONS[version] ?? [
      `${formatVersionTitle(version)} roadmap milestone`,
      "Planned work and improvements are grouped into this release",
    ]
  );
}

/**
 * Small reusable hover tooltip used for target versions.
 */
function VersionTooltip({
  version,
  children,
}: {
  version: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const lines = getVersionDescription(version);

  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}

      {open && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 10px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: 240,
            maxWidth: "min(240px, 80vw)",
            background: "rgba(18, 20, 30, 0.97)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 12,
            padding: "10px 12px",
            boxShadow: "0 14px 34px rgba(0,0,0,0.35)",
            zIndex: 50,
            fontSize: 12,
            lineHeight: 1.45,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            {formatVersionTitle(version)}
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            {lines.map((line, index) => (
              <div key={index}>• {line}</div>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderTop: "7px solid rgba(18, 20, 30, 0.97)",
            }}
          />
        </div>
      )}
    </span>
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
 * - Users can still click Edit, but protected access is handled
 *   through admin/demo login routing
 * - Task type support is backend-driven via string values
 * - Target versions now show hover tooltips with release context
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
   * Flat newest-first updates.
   * Still useful for empty state checks.
   */
  const updatesSorted = useMemo(() => {
    const u = [...(data?.updates ?? [])];
    u.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return u;
  }, [data]);

  /**
   * Group updates by related task.
   * This makes the public project history easier to follow.
   */
  const updatesGrouped = useMemo(() => {
    return groupUpdatesByTask(data?.updates ?? []);
  }, [data]);

  /**
   * Quick lookup for task id -> task object.
   * Used to show task title and target version in grouped update sections.
   */
  const taskLookup = useMemo(() => {
    const map = new Map<string, TaskDto>();

    for (const task of data?.tasks ?? []) {
      map.set(task.id, task);
    }

    return map;
  }, [data]);

  /**
   * Group ids for task-linked update sections.
   * Excludes the special "general" bucket.
   */
  const groupedTaskIds = useMemo(() => {
    return Object.keys(updatesGrouped).filter((key) => key !== "general");
  }, [updatesGrouped]);

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

          {data.project.description && (
            <div className="projectDescription">
              {data.project.description}
            </div>
          )}

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
                          {/* 
                            Backend task type is now treated as a dynamic string.
                            We format it for display instead of relying on a fixed enum.
                          */}
                          <span className="pill">{formatTaskType(t.type)}</span>
                          <span className="pill">{t.priority}</span>

                          {t.targetVersion ? (
                            <VersionTooltip version={t.targetVersion}>
                              <span
                                className="pill"
                                style={{ cursor: "help" }}
                                tabIndex={0}
                              >
                                {t.targetVersion}
                              </span>
                            </VersionTooltip>
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
              Updates grouped by task
              (READ-ONLY)
             ========================= */}
          <section>
            <h2 className="h2">Updates</h2>

            {updatesSorted.length === 0 ? (
              <p className="muted">No updates yet.</p>
            ) : (
              <div className="updates-groups">
                {/* =========================
                    General project updates
                   ========================= */}
                {updatesGrouped.general?.length ? (
                  <section className="update-group">
                    <div className="update-group-header">
                      <h3>General Project Updates</h3>
                      <span>{updatesGrouped.general.length}</span>
                    </div>

                    <div className="updates-list">
                      {updatesGrouped.general.map((u) => (
                        <article key={u.id} className="update-card">
                          <div className="update-card-top">
                            <div>
                              <h4>{u.title}</h4>
                              <p className="update-meta">{fmt(u.createdAt)}</p>
                            </div>
                          </div>

                          <p>{u.body}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}

                {/* =========================
                    Task-specific update groups
                   ========================= */}
                {groupedTaskIds.map((taskId) => {
                  const task = taskLookup.get(taskId);
                  const updates = updatesGrouped[taskId] ?? [];

                  return (
                    <section key={taskId} className="update-group">
                      <div className="update-group-header">
                        <div>
                          <h3>{task?.title ?? "Related Task"}</h3>

                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                              alignItems: "center",
                            }}
                          >
                            {task?.type ? (
                              <span className="pill">
                                {formatTaskType(task.type)}
                              </span>
                            ) : null}

                            {task?.targetVersion ? (
                              <VersionTooltip version={task.targetVersion}>
                                <p
                                  className="update-group-subtitle"
                                  style={{
                                    margin: 0,
                                    cursor: "help",
                                  }}
                                  tabIndex={0}
                                >
                                  Target version: {task.targetVersion}
                                </p>
                              </VersionTooltip>
                            ) : null}
                          </div>
                        </div>

                        <span>{updates.length}</span>
                      </div>

                      <div className="updates-list">
                        {updates.map((u) => (
                          <article key={u.id} className="update-card">
                            <div className="update-card-top">
                              <div>
                                <h4>{u.title}</h4>
                                <p className="update-meta">{fmt(u.createdAt)}</p>
                              </div>
                            </div>

                            <p>{u.body}</p>
                          </article>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
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