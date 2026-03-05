import { clearAuth, getToken } from "./auth";

/**
 * Base API URL loaded from Vite environment variables.
 * Must be defined in .env.local or deployment environment.
 *
 * Example:
 * VITE_API_URL=http://localhost:8081
 */
const API_URL = import.meta.env.VITE_API_URL as string;

if (!API_URL) {
  throw new Error("Missing VITE_API_URL. Add it to .env.local");
}

/**
 * ========================
 * DTO Types (Data Transfer Objects)
 * ========================
 * These types mirror backend responses and requests.
 */

export type ProjectDto = {
  id: string;
  slug: string;
  name: string;
  summary?: string | null;
  description?: string | null;
  techStack?: string | null;
  repoUrl?: string | null;
  liveUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateProjectRequest = Partial<{
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  techStack: string | null;
  repoUrl: string | null;
  liveUrl: string | null;
}>;

export type TaskStatus = "BACKLOG" | "IN_PROGRESS" | "DONE";
export type TaskType = "FEATURE" | "BUG" | "REFACTOR";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type UpdateTaskRequest = Partial<{
  status: TaskStatus;
  type: TaskType;
  priority: TaskPriority;
  targetVersion: string | null;
  title: string;
  description: string | null;
}>;

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
};

export type TaskDto = {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  type: TaskType;
  priority: TaskPriority;
  targetVersion?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateDto = {
  id: string;
  projectId: string;
  title: string;
  body: string;
  createdAt: string;
};

export type ProjectDetailsDto = {
  project: ProjectDto;
  tasks: TaskDto[];
  updates: UpdateDto[];
};

export type CreateTaskRequest = {
  title: string;
  description?: string | null;
  status: TaskStatus;
  type: TaskType;
  priority: TaskPriority;
  targetVersion?: string | null;
};

export type CreateUpdateRequest = {
  title: string;
  body: string;
};

export type CreateProjectRequest = {
  slug: string;
  name: string;
  summary?: string | null;
  description?: string | null;
  techStack?: string | null;
  repoUrl?: string | null;
  liveUrl?: string | null;
};

/**
 * ========================
 * HTTP Helper
 * ========================
 *
 * - Attaches JWT token automatically (unless skipAuth)
 * - Parses JSON when available
 * - Returns undefined for 204 No Content
 * - Throws a readable error message on non-OK responses
 */
async function http<T>(
  path: string,
  init?: RequestInit & { skipAuth?: boolean }
): Promise<T> {
  const token = getToken();
  const useAuth = !init?.skipAuth;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(useAuth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  // If token expired/invalid: clear local storage so UI can recover cleanly.
  if (res.status === 401) {
    clearAuth();
  }

  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? "";
    let details = "";

    try {
      if (contentType.includes("application/json")) {
        const json = await res.json();
        details =
          typeof json === "string"
            ? json
            : json?.message
            ? String(json.message)
            : JSON.stringify(json);
      } else {
        details = await res.text();
      }
    } catch {
      details = "";
    }

    const extra = details ? ` – ${details}` : "";
    throw new Error(`HTTP ${res.status} ${res.statusText}${extra}`);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;

  return JSON.parse(text) as T;
}

/** ---------- API Client ---------- */
export const api = {
  // ---- Public ----
  listProjects: () => http<ProjectDto[]>("/api/projects"),
  getProjectDetailsBySlug: (slug: string) =>
    http<ProjectDetailsDto>(`/api/projects/${encodeURIComponent(slug)}`),

  // ---- Auth ----
  loginAdmin: (username: string, password: string) =>
    http<LoginResponse>("/auth/login", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ username, password }),
    }),

  loginDemo: (username: string, password: string) =>
    http<LoginResponse>("/auth/demo/login", {
      method: "POST",
      skipAuth: true, // critical: prevents expired token from being sent
      body: JSON.stringify({ username, password }),
    }),

  // ---- Admin (real) ----
  createProject: (payload: CreateProjectRequest) =>
    http<ProjectDto>("/admin/projects", { method: "POST", body: JSON.stringify(payload) }),

  updateProject: (projectId: string, payload: UpdateProjectRequest) =>
    http<ProjectDto>(`/admin/projects/${projectId}`, { method: "PATCH", body: JSON.stringify(payload) }),

  deleteProject: (projectId: string) =>
    http<void>(`/admin/projects/${projectId}`, { method: "DELETE" }),

  createTask: (projectId: string, payload: CreateTaskRequest) =>
    http<TaskDto>(`/admin/projects/${projectId}/tasks`, { method: "POST", body: JSON.stringify(payload) }),

  updateTask: (projectId: string, taskId: string, payload: UpdateTaskRequest) =>
    http<TaskDto>(`/admin/projects/${projectId}/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(payload) }),

  deleteTask: (taskId: string) =>
    http<void>(`/admin/tasks/${taskId}`, { method: "DELETE" }),

  createUpdate: (projectId: string, payload: CreateUpdateRequest) =>
    http<UpdateDto>(`/admin/projects/${projectId}/updates`, { method: "POST", body: JSON.stringify(payload) }),

  deleteUpdate: (updateId: string) =>
    http<void>(`/admin/updates/${updateId}`, { method: "DELETE" }),

  // ---- Demo (sandbox) ----
  demoReset: () => http<void>("/demo/reset", { method: "POST" }),

  demoListProjects: () => http<ProjectDto[]>("/demo/projects"),

  demoGetProjectDetailsBySlug: (slug: string) =>
    http<ProjectDetailsDto>(`/demo/projects/${encodeURIComponent(slug)}`),

  demoCreateTask: (projectId: string, payload: CreateTaskRequest) =>
    http<TaskDto>(`/demo/projects/${projectId}/tasks`, { method: "POST", body: JSON.stringify(payload) }),

  demoUpdateTask: (projectId: string, taskId: string, payload: UpdateTaskRequest) =>
    http<TaskDto>(`/demo/projects/${projectId}/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(payload) }),

demoDeleteTask: (projectId: string, taskId: string) =>
  http<void>(`/demo/projects/${projectId}/tasks/${taskId}`, {
    method: "DELETE",
  }),

demoDeleteUpdate: (projectId: string, updateId: string) =>
  http<void>(`/demo/projects/${projectId}/updates/${updateId}`, {
    method: "DELETE",
  }),
  demoCreateUpdate: (projectId: string, payload: CreateUpdateRequest) =>
    http<UpdateDto>(`/demo/projects/${projectId}/updates`, { method: "POST", body: JSON.stringify(payload) }),

  demoCreateProject: (payload: CreateProjectRequest) =>
    http<ProjectDto>("/demo/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  demoDeleteProject: (projectId: string) =>
    http<void>(`/demo/projects/${projectId}`, {
      method: "DELETE",
    }),
  
};