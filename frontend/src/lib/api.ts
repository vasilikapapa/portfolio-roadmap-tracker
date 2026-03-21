import { clearAuth, getToken } from "./auth";

/**
 * ==========================================
 * Base API URL
 * ==========================================
 * Loaded from Vite env variables.
 * Example:
 * VITE_API_URL=http://localhost:8081
 */
const API_URL = import.meta.env.VITE_API_URL as string;

// Fail fast if missing (prevents silent bugs)
if (!API_URL) {
  throw new Error("Missing VITE_API_URL. Add it to .env.local");
}

/**
 * ==========================================
 * DTO TYPES (Frontend <-> Backend contract)
 * ==========================================
 */

/**
 * Project returned from backend
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

/**
 * Partial update payload
 */
export type UpdateProjectRequest = Partial<{
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  techStack: string | null;
  repoUrl: string | null;
  liveUrl: string | null;
}>;

/**
 * Task enums
 */
export type TaskStatus = "BACKLOG" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

/**
 * Task type is now dynamic string (NOT enum anymore)
 */
export type TaskTypeOptionDto = {
  code: string;
  label: string;
};

/**
 * Update task payload
 */
export type UpdateTaskRequest = Partial<{
  status: TaskStatus;
  type: string;
  priority: TaskPriority;
  targetVersion: string | null;
  title: string;
  description: string | null;
}>;

/**
 * Auth response
 */
export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
};

/**
 * Task object
 */
export type TaskDto = {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  type: string;
  priority: TaskPriority;
  targetVersion?: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Update object
 * IMPORTANT CHANGE:
 * - Now supports linking to a task
 */
export type UpdateDto = {
  id: string;
  projectId: string;
  taskId?: string | null;
  taskTitle?: string | null;
  title: string;
  body: string;
  createdAt: string;
};

/**
 * Full project page payload
 */
export type ProjectDetailsDto = {
  project: ProjectDto;
  tasks: TaskDto[];
  updates: UpdateDto[];
};

/**
 * Create payloads
 */
export type CreateTaskRequest = {
  title: string;
  description?: string | null;
  status: TaskStatus;
  type: string;
  priority: TaskPriority;
  targetVersion?: string | null;
};

export type CreateUpdateRequest = {
  taskId?: string | null; // 🔥 KEY CHANGE
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
 * ==========================================
 * HTTP HELPER
 * ==========================================
 * Handles:
 * - Token injection
 * - JSON parsing
 * - Error handling
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

  /**
   * Auto logout if token expired
   */
  if (res.status === 401) {
    clearAuth();
  }

  /**
   * Error parsing (supports JSON + text)
   */
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

    throw new Error(`HTTP ${res.status} ${res.statusText}${details ? " – " + details : ""}`);
  }

  /**
   * Handle empty responses (204)
   */
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;

  return JSON.parse(text) as T;
}

/**
 * ==========================================
 * API CLIENT
 * ==========================================
 */
export const api = {
  /** ---------- PUBLIC ---------- */

  listProjects: () => http<ProjectDto[]>("/api/projects"),

  getProjectDetailsBySlug: (slug: string) =>
    http<ProjectDetailsDto>(`/api/projects/${encodeURIComponent(slug)}`),

  /** ---------- AUTH ---------- */

  loginAdmin: (username: string, password: string) =>
    http<LoginResponse>("/auth/login", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ username, password }),
    }),

  loginDemo: (username: string, password: string) =>
    http<LoginResponse>("/auth/demo/login", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ username, password }),
    }),

  /** ---------- ADMIN ---------- */

  createProject: (payload: CreateProjectRequest) =>
    http<ProjectDto>("/admin/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProject: (projectId: string, payload: UpdateProjectRequest) =>
    http<ProjectDto>(`/admin/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteProject: (projectId: string) =>
    http<void>(`/admin/projects/${projectId}`, { method: "DELETE" }),

  createTask: (projectId: string, payload: CreateTaskRequest) =>
    http<TaskDto>(`/admin/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateTask: (projectId: string, taskId: string, payload: UpdateTaskRequest) =>
    http<TaskDto>(`/admin/projects/${projectId}/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteTask: (taskId: string) =>
    http<void>(`/admin/tasks/${taskId}`, { method: "DELETE" }),

  /**
   * 🔥 Updates now support taskId
   */
  createUpdate: (projectId: string, payload: CreateUpdateRequest) =>
    http<UpdateDto>(`/admin/projects/${projectId}/updates`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateUpdate: (projectId: string, updateId: string, payload: CreateUpdateRequest) =>
    http<UpdateDto>(`/admin/projects/${projectId}/updates/${updateId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteUpdate: (updateId: string) =>
    http<void>(`/admin/updates/${updateId}`, { method: "DELETE" }),

  /** ---------- DEMO ---------- */

  demoReset: () => http<void>("/demo/reset", { method: "POST" }),

  demoListProjects: () => http<ProjectDto[]>("/demo/projects"),
  
    demoUpdateProject: (projectId: string, payload: UpdateProjectRequest) =>
    http<ProjectDto>(`/demo/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  demoGetProjectDetailsBySlug: (slug: string) =>
    http<ProjectDetailsDto>(`/demo/projects/${encodeURIComponent(slug)}`),

  demoCreateTask: (projectId: string, payload: CreateTaskRequest) =>
    http<TaskDto>(`/demo/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  demoUpdateTask: (projectId: string, taskId: string, payload: UpdateTaskRequest) =>
    http<TaskDto>(`/demo/projects/${projectId}/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  demoDeleteTask: (projectId: string, taskId: string) =>
    http<void>(`/demo/projects/${projectId}/tasks/${taskId}`, {
      method: "DELETE",
    }),

  demoCreateUpdate: (projectId: string, payload: CreateUpdateRequest) =>
    http<UpdateDto>(`/demo/projects/${projectId}/updates`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  demoUpdateUpdate: (projectId: string, updateId: string, payload: CreateUpdateRequest) =>
    http<UpdateDto>(`/demo/projects/${projectId}/updates/${updateId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  demoDeleteUpdate: (projectId: string, updateId: string) =>
    http<void>(`/demo/projects/${projectId}/updates/${updateId}`, {
      method: "DELETE",
    }),

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