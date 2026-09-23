# Frontend instructions

Applies to `frontend/**`; inherit root `AGENTS.md`.

## Hard gates

- FSD imports only downward: app > pages > widgets > features > entities > shared. Shared has no domain code; no empty slices.
- HTTP contracts define DTOs. All backend calls/server state use RTK Query `fetchBaseQuery`.
- Auth: Bearer JWT/localStorage; runtime session in `entities/session/`.
- Before relevant work, read `frontend/CONVENTIONS.md`: State Ownership, React APIs, UI / Styling, Testing; for auth/API also RTK Query / API, Authentication, Error Handling.
- 401: shared normalizes; app listener clears token/session/cache; routing redirects. No refresh tokens.
- No external UI framework without explicit decision.
- Critical logic/flows need behavioral tests; trivial presentation has no mandatory tests.

## Before implementing or modifying frontend UI

Read relevant `docs/frontend/DESIGN.md` and `docs/frontend/design-reference/MANIFEST.md` entries. Use Stitch MCP only for their exact canonical project/screen.

## Before implementing or modifying frontend API-facing code

Read relevant `docs/frontend/integration/BACKEND_CONTRACT_INVENTORY.md` (HTTP) and `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md` (routes/readiness; §0 supersedes history). Executable backend wins conflicts; update inventory in the same task.

## Where to look

Windsurf: FSD/testing use `frontend/.windsurf/rules/fsd-conventions.md` / `frontend/.windsurf/rules/testing-conventions.md`. Other docs: root routing. Read only relevant sections.
