import { getToken } from "./auth";

/**
 * Base API URL loaded from Vite environment variables.
 * Must be defined in .env.local or deployment environment.
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

/**
 * =========================================
 * Update Project Request Type
 * =========================================
 *
 * Used when partially updating a project.
 *
 * `Partial<>` makes all fields optional,
 * allowing PATCH-style updates where only
 * changed fields are sent.
 */
export type UpdateProjectRequest = Partial<{
  slug: string;              // URL-friendly project identifier
  name: string;              // Project display name
  summary: string | null;    // Short description (nullable)
  description: string | null; // Detailed description
  techStack: string | null;  // Technologies used
  repoUrl: string | null;    // Source repository link
  liveUrl: string | null;    // Live deployment link
}>;


/**
 * =========================================
 * Update Task Request Type
 * =========================================
 *
 * Used for partial task updates via API.
 *
 * Supports updating task metadata such as:
 * - status
 * - type
 * - priority
 * - version target
 * - title/description
 */
export type UpdateTaskRequest = Partial<{
  status: TaskStatus;          // Task workflow status
  type: TaskType;              // Task category (feature/bug/etc.)
  priority: TaskPriority;      // Priority level
  targetVersion: string | null; // Planned release version
  title: string;               // Task title
  description: string | null;  // Task details
}>;

/**
 * Generic HTTP helper for API requests.
 *
 * Features:
 * - Automatically attaches JWT token if present
 * - Handles JSON serialization/deserialization
 * - Throws descriptive error for non-OK responses
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
      "Content-Type": "application/json",
      ...(useAuth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  // Handle HTTP errors explicitly
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} – ${text}`);
  }

  // 204 No Content responses
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

/**
 * Enum-like types matching backend task enums.
 */
export type TaskStatus = "BACKLOG" | "IN_PROGRESS" | "DONE";
export type TaskType = "FEATURE" | "BUG" | "REFACTOR";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

/**
 * Authentication response structure.
 */
export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
};

/**
 * Task DTO returned by backend.
 */
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

/**
 * Update / Dev log DTO.
 */
export type UpdateDto = {
  id: string;
  projectId: string;
  title: string;
  body: string;
  createdAt: string;
};

/**
 * Combined project details response.
 */
export type ProjectDetailsDto = {
  project: ProjectDto;
  tasks: TaskDto[];
  updates: UpdateDto[];
};

/**
 * Request payloads for creating entities.
 */
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
 * API Client
 * ========================
 * Centralized API wrapper for backend communication.
 * Keeps fetch logic consistent across the app.
 */
export const api = {


  /**
   * Fetch all public projects.
   */
  listProjects: () => http<ProjectDto[]>("/api/projects"),

  /**
   * Fetch project details by slug.
   */
  getProjectDetailsBySlug: (slug: string) =>
    http<ProjectDetailsDto>(`/api/projects/${encodeURIComponent(slug)}`),

  /**
   * Login endpoint (no auth header required).
   */
  login: (username: string, password: string) =>
    http<LoginResponse>("/auth/login", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ username, password }),
    }),

  /**
   * Create a new task under a project (admin).
   */
  createTask: (projectId: string, payload: CreateTaskRequest) =>
    http<TaskDto>(`/admin/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /**
   * Delete a task by ID (admin).
   */
  deleteTask: (taskId: string) =>
    http<void>(`/admin/tasks/${taskId}`, {
      method: "DELETE",
    }),

  /**
   * Create a project update / dev log entry.
   */
  createUpdate: (projectId: string, payload: CreateUpdateRequest) =>
    http<UpdateDto>(`/admin/projects/${projectId}/updates`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /**
   * Delete an update entry.
   */
  deleteUpdate: (updateId: string) =>
    http<void>(`/admin/updates/${updateId}`, {
      method: "DELETE",
    }),

  /**
   * Create a new project (admin-only).
   */
  createProject: (payload: CreateProjectRequest) =>
    http<ProjectDto>("/admin/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
   
     /**
   * Partially update a project.
   *
   * HTTP: PATCH /admin/projects/{projectId}
   */
  updateProject: (projectId: string, payload: UpdateProjectRequest) =>
    http<ProjectDto>(`/admin/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  /**
   * Delete a project by ID.
   *
   * HTTP: DELETE /admin/projects/{projectId}
   */
  deleteProject: (projectId: string) =>
    http<void>(`/admin/projects/${projectId}`, {
      method: "DELETE",
    }),

  /**
   * Partially update a task within a project.
   *
   * HTTP: PATCH /admin/projects/{projectId}/tasks/{taskId}
   */
  updateTask: (projectId: string, taskId: string, payload: UpdateTaskRequest) =>
    http<TaskDto>(`/admin/projects/${projectId}/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

};