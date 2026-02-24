/**
 * auth.ts
 * Very small “auth storage” layer:
 * - We store an admin JWT token in localStorage
 * - Presence of a token = "admin mode" in the UI
 *
 * (Backend must still enforce security; UI alone is not protection.)
 */

const TOKEN_KEY = "admin_token";

/** Read token from localStorage (or null if not logged in). */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Save token to localStorage. */
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Remove token from localStorage (logout). */
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/** Simple UI check: if token exists, treat user as admin. */
export function isAdmin(): boolean {
  return Boolean(getToken());
}