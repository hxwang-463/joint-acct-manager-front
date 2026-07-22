/**
 * HTTP Basic auth state for the API.
 *
 * The username is fixed and public; only the password is secret. We keep the
 * ready-to-send header string (not the raw password) in memory and in
 * localStorage, so "stay logged in" survives a reload. It is cleared on any 401.
 */

const USERNAME = 'AdminUser';
const STORAGE_KEY = 'joint.authHeader';

let cachedHeader: string | null = null;
let loaded = false;
let onUnauthorized: (() => void) | null = null;

/** The `Authorization` value to attach to API calls, or null when logged out. */
export function getAuthHeader(): string | null {
  if (!loaded && typeof window !== 'undefined') {
    cachedHeader = window.localStorage.getItem(STORAGE_KEY);
    loaded = true;
  }
  return cachedHeader;
}

/**
 * Builds and persists the Basic header for the given password. Throws if the
 * password is non-ASCII, because btoa cannot encode it — callers surface that
 * to the user rather than letting it bubble up.
 */
export function storeAuthHeader(password: string): void {
  const header = `Basic ${btoa(`${USERNAME}:${password}`)}`;
  cachedHeader = header;
  loaded = true;
  window.localStorage.setItem(STORAGE_KEY, header);
}

export function clearAuthHeader(): void {
  cachedHeader = null;
  loaded = true;
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

/** Registers the callback invoked when an API call reports 401 (null to clear). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

/** Called by the API layer on a 401: drop the bad credential, notify the app. */
export function handleUnauthorized(): void {
  clearAuthHeader();
  onUnauthorized?.();
}
