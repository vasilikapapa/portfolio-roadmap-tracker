/**
 * Storage key used for saving the admin JWT token.
 * Keeping it in a constant avoids typos and makes refactoring easier.
 */
const KEY = "portfolio_admin_token";

/**
 * Retrieves the stored authentication token from localStorage.
 *
 * Returns:
 * - The JWT token string if present
 * - null if not found
 */
export function getToken() {
  return localStorage.getItem(KEY);
}

/**
 * Stores the authentication token in localStorage.
 *
 * @param token - JWT access token received from backend login
 */
export function setToken(token: string) {
  localStorage.setItem(KEY, token);
}

/**
 * Removes the authentication token from localStorage.
 * Used during logout to clear user session.
 */
export function clearToken() {
  localStorage.removeItem(KEY);
}

/**
 * Checks whether the user is authenticated.
 *
 * Returns:
 * - true if a token exists
 * - false if no token is stored
 *
 * Note:
 * This only checks token presence, not expiration validity.
 */
export function isAuthed() {
  return Boolean(getToken());
}