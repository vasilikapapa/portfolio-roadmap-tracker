/**
 * auth.ts
 * Very small “auth storage” layer:
 * - keps token+role in localStorage
 * - Presence of a token = "admin mode" in the UI
 */

export type AuthRole = "ADMIN" | "DEMO";

const TOKEN_KEY = "pt_token";
const ROLE_KEY = "pt_role";


export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole(): AuthRole | null {
  const v = localStorage.getItem(ROLE_KEY);
  return v === "ADMIN" || v === "DEMO" ? v : null;
}

export function setAuth(token: string, role: AuthRole) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}