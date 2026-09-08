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
