# Cascade Agent Instructions — LLHelper Frontend

Frontend-specific hard gates. Applies to all code inside `frontend/**`.
Repository-wide gates: see root `AGENTS.md`.

## Hard gates

- **FSD dependency direction:** Higher layers (`app` → `pages` → `widgets` → `features` → `entities` → `shared`) may import from lower layers. Lower layers must never import from higher layers.
- **Domain code forbidden in shared:** `shared/` contains only business-agnostic infrastructure. Deck/Card/Learning/Auth-specific code belongs in `entities/` or `features/`. `shared/api/` may provide generic HTTP transport (token-storage adapter, error normalization) but must not contain login/register/logout use cases, domain DTOs, or imports from `app/`/`features/`/`entities/`.
- **No premature slices:** A slice must exist only when there is real product responsibility. Do not create empty directories or placeholder slices.
- **API contract is source of truth:** Frontend types represent the HTTP API contract, not JPA entities or database models. Do not invent fields from backend/database knowledge.
- **State ownership:**
  - Server state → RTK Query (not ordinary Redux slices).
  - Runtime session state → `entities/session/` Redux slice.
  - Global client state → Redux Toolkit slices (only for genuinely global non-server state).
  - Form state → React Hook Form + Zod.
  - URL state → React Router.
  - Local UI state → React `useState`/`useReducer`.
- **RTK Query is the API layer:** All backend communication uses RTK Query `fetchBaseQuery`. Axios has been removed.
- **Auth architecture (Level 1):** Bearer JWT + `localStorage` persistence (via `shared/api/token-storage` adapter) + Redux runtime session state (`entities/session/`). `shared/api/` reads the token through its own adapter and never imports Redux, entities, features, or app. Auth use cases live in `features/login/`, `features/register/`, `features/logout/`. Future target: HttpOnly secure cookies (requires backend security change, not current sprint).
- **401 boundary:** `shared/api/` returns normalized 401 errors only. The app-level error listener owns token/session/cache cleanup; app routing reacts to the cleared session and redirects to login. `shared/api/` owns neither responsibility.
- **No refresh token:** Level 1 has no refresh-token flow. Handle JWT expiry via 401 → app-level listener → clear token → clear session → `baseApi.util.resetApiState()` → redirect to login.
- **Design system:** Custom lightweight system (`shared/ui/` + CSS Modules + semantic CSS variables). No external UI framework without explicit decision.
- **Testing:** Behavioral/user-centric tests. No mandatory test for trivial presentational components. Critical business logic and user flows require coverage.

## Before implementing or modifying frontend UI

- Read `docs/frontend/DESIGN.md`.
- Read the relevant entry in `docs/frontend/design-reference/MANIFEST.md`.
- Use Stitch MCP only for the exact canonical project/screen referenced there.
- Never select another Stitch variant based only on visual similarity.

## Before implementing or modifying frontend API-facing code

- Before implementing or modifying a frontend feature that communicates with the backend, read the relevant entries in both `docs/frontend/integration/BACKEND_CONTRACT_INVENTORY.md` and `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md`.
- The inventory owns the actual HTTP contract (endpoints, DTO shapes, auth/error behavior). The map owns screen-specific integration readiness (candidate route, required contract, blockers, MVP status) for each canonical Stitch reference.
- The inventory is a repository-grounded integration snapshot. If it conflicts with current executable backend code, backend code is authoritative and the inventory must be updated in the same task.
- The map's §0 holds the accepted Phase 0.4C MVP/routes/phases; §2–§7 preserve the historical Phase 0.4B snapshot and may contain candidates superseded by §0. Executable backend code remains authoritative for current HTTP behavior.

## Where to look

Load only the rule, reference, or normative document required by the current task.

| Need | Read |
|------|------|
| FSD layer/slice conventions | `frontend/.windsurf/rules/fsd-conventions.md` |
| Frontend testing conventions | `frontend/.windsurf/rules/testing-conventions.md` |
| Frontend detailed conventions | `frontend/CONVENTIONS.md` |
| Current sprint | `docs/roadmap/current-sprint.md` |
| Documentation sync triggers | `.windsurf/rules/documentation-sync.md` |
| Design-system tokens, shell, canonical screens | `docs/frontend/DESIGN.md` |

### Backend architecture (actual system design)

| Need | Read |
|------|------|
| Actual current backend architecture (package layout, request lifecycle, tech stack) | `docs/architecture/current-architecture.md` |
| Backend API surface at a glance | `docs/architecture/current-architecture.md` §11 |

### Frontend-consumed HTTP contract and integration gaps

| Need | Read |
|------|------|
| Endpoint list, request/response DTO shapes, auth/error behavior as actually implemented | `docs/frontend/integration/BACKEND_CONTRACT_INVENTORY.md` |
| Known integration gaps, discrepancies, unresolved questions blocking a frontend screen's data-fetching design | `docs/frontend/integration/BACKEND_CONTRACT_INVENTORY.md` §8–§10 |
| Screen-by-screen candidate route, required contract, blockers, and readiness status per canonical Stitch reference | `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md` |
