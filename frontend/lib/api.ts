/**
 * Shared API configuration — single source of truth for backend URLs.
 *
 * Reads NEXT_PUBLIC_API_BASE from the environment (.env.local / .env).
 * Falls back to http://localhost:8000 if unset so `bun run dev` works
 * out of the box without any .env file.
 */

export const API_BASE =
	process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

/**
 * WebSocket base derived from the HTTP base.
 * Converts http:// → ws:// and https:// → wss://.
 */
export const WS_BASE = API_BASE.replace(/^http/, "ws");

// ── Authenticated fetch ───────────────────────────────────────────────────────

/**
 * Drop-in replacement for `fetch` that:
 *  1. Adds an `Authorization: Bearer <access_token>` header automatically.
 *  2. On HTTP 401, attempts one silent token refresh via POST /api/auth/refresh.
 *     - If the refresh succeeds, stores the new tokens and retries the original request.
 *     - If the refresh also fails (expired refresh token, network error, etc.),
 *       the session is cleared and the page is redirected to /login so the user
 *       sees an explicit login prompt instead of broken UI.
 *  3. Returns the Response from the (possibly retried) request unchanged so
 *     callers can still inspect status codes and parse JSON normally.
 *
 * Import and use instead of bare `fetch` for any call that requires authentication.
 */
export async function authFetch(
	input: RequestInfo | URL,
	init: RequestInit = {},
): Promise<Response> {
	// Lazy import to avoid circular dependencies and SSR issues.
	const { getAccessToken, getRefreshToken, setSession, clearSession } =
		await import("@/lib/auth");

	const makeHeaders = (token: string | null): HeadersInit => ({
		"Content-Type": "application/json",
		...(init.headers as Record<string, string> | undefined),
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	});

	// ── First attempt ──────────────────────────────────────────────────────────
	const accessToken = getAccessToken();
	let response = await fetch(input, {
		...init,
		headers: makeHeaders(accessToken),
	});

	if (response.status !== 401) {
		return response;
	}

	// ── 401 received — try to refresh ─────────────────────────────────────────
	const refreshToken = getRefreshToken();
	if (!refreshToken) {
		clearSession();
		if (typeof window !== "undefined") window.location.replace("/login");
		return response; // return original 401 response; the redirect will happen
	}

	try {
		const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ refresh_token: refreshToken }),
		});

		if (!refreshRes.ok) {
			throw new Error("Refresh failed");
		}

		const newTokenData = await refreshRes.json();
		setSession(newTokenData);

		// ── Retry the original request with the new access token ────────────────
		response = await fetch(input, {
			...init,
			headers: makeHeaders(newTokenData.access_token),
		});
		return response;
	} catch {
		// Refresh token is also invalid/expired — force re-login.
		clearSession();
		if (typeof window !== "undefined") window.location.replace("/login");
		return response;
	}
}
