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
- **401 boundary:** `shared/api/` returns normalized 401 errors only. Application-level logout (clear token, clear session, redirect) is owned by an app-level error listener, not by `shared/api/`.
- **No refresh token:** Level 1 has no refresh-token flow. Handle JWT expiry via 401 → app-level listener → clear token → clear session → redirect to login.
- **Design system:** Custom lightweight system (`shared/ui/` + CSS Modules + semantic CSS variables). No external UI framework without explicit decision.
- **Testing:** Behavioral/user-centric tests. No mandatory test for trivial presentational components. Critical business logic and user flows require coverage.

## Where to look

Load only the rule, reference, or normative document required by the current task.

| Need | Read |
|------|------|
| FSD layer/slice conventions | `frontend/.windsurf/rules/fsd-conventions.md` |
| Frontend testing conventions | `frontend/.windsurf/rules/testing-conventions.md` |
| Frontend detailed conventions | `frontend/CONVENTIONS.md` |
| Current architecture | `docs/architecture/current-architecture.md` |
| Current sprint | `docs/roadmap/current-sprint.md` |
| Backend API surface/contracts | `docs/architecture/current-architecture.md` §11 |
| Documentation sync triggers | `.windsurf/rules/documentation-sync.md` |
| Future design-system tokens | (not yet created — will be `docs/frontend/DESIGN.md` when canonical Stitch design exists) |
