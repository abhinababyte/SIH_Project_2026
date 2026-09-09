/**
 * Auth session helpers — thin localStorage wrappers.
 *
 * Keys:
 *   hillshield_access_token   — short-lived JWT (Bearer)
 *   hillshield_refresh_token  — long-lived JWT used to rotate the access token
 *   hillshield_user           — JSON-serialised user object { id, full_name, role, email, phone_number }
 *
 * All functions are safe to call on the server (they guard against
 * typeof window === "undefined") so they won't crash during SSR.
 */

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  role: "resident" | "responder" | string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
}

const KEY_ACCESS = "hillshield_access_token";
const KEY_REFRESH = "hillshield_refresh_token";
const KEY_USER = "hillshield_user";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Store a complete TokenResponse from the backend (login or register). */
export function setSession(data: TokenResponse): void {
  if (!isBrowser()) return;
  localStorage.setItem(KEY_ACCESS, data.access_token);
  localStorage.setItem(KEY_REFRESH, data.refresh_token);
  localStorage.setItem(KEY_USER, JSON.stringify(data.user));
}

/** Remove all session data (logout). */
export function clearSession(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(KEY_ACCESS);
  localStorage.removeItem(KEY_REFRESH);
  localStorage.removeItem(KEY_USER);
  // Also clear the legacy key used before JWT was wired up.
  localStorage.removeItem("hillshield_user_name");
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(KEY_ACCESS);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(KEY_REFRESH);
}

export function getUser(): AuthUser | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(KEY_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null && getUser() !== null;
}
