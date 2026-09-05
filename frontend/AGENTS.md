<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# HillShield frontend — agent guide

Everything below this line is project-specific guidance, not auto-generated — safe to
edit freely. Read `../AGENTS.md` first for repo-wide conventions.

Next.js 16 App Router, Tailwind v4, TypeScript, managed with **bun** (not npm/yarn/pnpm).

```bash
bun install
bun run dev     # http://localhost:3000 (Next falls back to another port if taken —
                 # the backend's CORS regex already allows any localhost port)
```

## Layout

Two large dashboard pages assemble most of the app's actual functionality directly
(not through a component-per-feature split): `app/resident/page.tsx` and
`app/responder/page.tsx`. `components/AppSidebar.tsx` drives the responder page's panel
switcher via an `activePanel` string; panels are always mounted and just
translated/opacity-hidden off-screen when inactive (so a panel's own `useEffect`
polling runs continuously regardless of whether it's visible — see e.g.
`IncidentPanel.tsx`).

## Talking to the backend

Every component that calls the API hardcodes `const API_BASE = "http://localhost:8000"`
(or the literal string inline) — there's no shared client or env-based base URL yet.
Follow that convention if you add a new call rather than introducing a new pattern
half-way. If this ever needs to point somewhere other than localhost, that's a
repo-wide refactor, not a one-component fix.

Live data pattern used by the real (non-orphaned) panels — `CommunityReportsSection.tsx`,
`ReportPanel.tsx`, `IncidentPanel.tsx`:
- `fetch` on mount + `setInterval` polling (2–10s depending on how time-sensitive the
  panel is) for reads.
- `fetch(..., { method: "POST" })` for writes, updating local state optimistically so
  the UI reacts instantly, with the next poll reconciling if the request actually failed.
- **A visible error state when the fetch itself fails** (e.g. "Could not reach the
  server") — never let a failed fetch render identically to "legitimately empty," and
  never keep a hardcoded dataset around as a silent fallback. Both of those exact
  mistakes shipped in this app's history and took multiple debugging rounds to catch
  because nothing looked wrong on screen.
- Match the backend's status strings **exactly**, including case (see
  `../backend/AGENTS.md`) — a case mismatch here previously made an entire panel filter
  out 100% of real data with zero errors anywhere, silently falling back to whatever
  dummy data was still sitting in the component.

## Dead code — don't confuse these with the live components

- `components/report-section.tsx` (`ReportSection`) and `components/IncidentBoard.tsx`
  are **not imported anywhere**. They're earlier, unwired scaffolding built against a
  different (shadcn `ui/card`-based) visual style. The live equivalents are
  `components/CommunityReportsSection.tsx` and `components/IncidentPanel.tsx`. If a bug
  report mentions a "report section" or "incident board," check which component is
  actually reachable from `app/resident/page.tsx` / `app/responder/page.tsx` before
  assuming which file to fix — this exact confusion has happened before.
- `lib/flood-data.ts` mixes real shared types/helpers (`Severity`, `SEVERITY_META`,
  `timeAgo`) with sensor/shelter/alert data that's still simulated client-side (the app
  doesn't yet have a real sensors/shelters backend) — don't assume everything exported
  from it is live data.

## Known pre-existing TypeScript errors

`bunx tsc --noEmit -p tsconfig.json` currently reports pre-existing errors in
`app/app-shell.tsx`, `app/resident/map/page.tsx`, `app/responder/page.tsx`,
`components/alerts-feed.tsx`, `components/flood-map.tsx`, and `components/report-section.tsx`
(the last one is the dead component above). None of these are introduced by typical
feature work — check `git blame`/whether your change touched that file before assuming
you need to fix them; they predate the backend integration work.

## Verifying a change actually works

Type-checking is not enough — most real bugs here were runtime data-flow issues
(wrong status casing, CORS, fields that don't exist on the actual API response) that
`tsc` can't see because API responses are typed as whatever the component's local
interface claims, not validated against the backend. Run both servers and drive the
actual UI. A headless Chromium is available in some environments at
`/opt/pw-browsers/chromium` for Playwright-based verification (launch with
`args: ['--no-proxy-server', '--proxy-bypass-list=*']` if requests to `localhost`
are being routed through an HTTPS proxy that breaks plain HTTP `fetch`/WebSocket calls).
