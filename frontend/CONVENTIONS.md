# Frontend Conventions — LLHelper

## Architecture — Pragmatic Feature-Sliced Design

**Target layer structure:**

```text
src/
├── app/          ← application shell: providers, router, global store config
├── pages/        ← route-level compositions; compose widgets/features/entities
├── widgets/      ← substantial reusable page blocks (not arbitrary components)
├── features/     ← user actions/use cases (e.g. "create deck", "submit review")
├── entities/     ← business/domain concepts (e.g. Deck, Card, User, Progress)
└── shared/       ← business-agnostic infrastructure (ui, lib, api, config, types)
```

**Dependency direction (hard gate):** `app` → `pages` → `widgets` → `features` → `entities` → `shared`. Lower layers must never import higher layers.

### Layer responsibilities

| Layer | Responsibility | May contain |
|-------|---------------|-------------|
| `app` | Bootstrap, providers, router config, store setup | Global wiring only |
| `pages` | Route compositions | Imports from widgets/features/entities/shared |
| `widgets` | Substantial reusable page blocks | Imports from features/entities/shared |
| `features` | User actions and use cases | Imports from entities/shared |
| `entities` | Domain concepts, data shapes, domain logic | Imports from shared only |
| `shared` | Business-agnostic utilities, UI primitives, config | Imports nothing from above |

### Slice internal segments

Standard segments inside a slice (use only those needed):

```text
slice-name/
├── ui/       ← React components
├── api/      ← RTK Query endpoint injection or API hooks
├── model/    ← types, stores/slices, selectors, business logic
├── lib/      ← pure utility functions for this slice
└── index.ts  ← public API
```

### Public APIs

- Every slice that is imported by other slices must export through `index.ts`.
- Internal implementation files should not be imported directly from outside the slice.
- Shared layer sub-folders (`shared/ui`, `shared/lib`, etc.) each have their own `index.ts`.

## Naming

- **Files:** `kebab-case` for all files and directories (e.g. `create-deck/`, `auth-slice.ts`).
- **Components:** `PascalCase` export name, `kebab-case` file (e.g. `deck-card.tsx` exports `DeckCard`).
- **Types/interfaces:** `PascalCase`. Suffix response DTOs with `Dto` only if disambiguation is needed.
- **Hooks:** `camelCase` with `use` prefix.
- **Constants:** `UPPER_SNAKE_CASE`.

## Imports

- Absolute imports via path aliases.
- Alias: `@/` → `src/`.
- Import order: external libs → shared → entities → features → widgets → relative.
- No circular imports between slices.
- Import from slice public API (`index.ts`), not internal files.

## React APIs

- The frontend runtime baseline is React 19. New components should use current React 19 APIs rather than legacy compatibility patterns.
- Accept and pass DOM refs as ordinary props, typed with `ComponentPropsWithRef`, instead of wrapping new function components in `forwardRef`.
- Do not introduce APIs marked deprecated or legacy by React or another installed library unless a documented compatibility requirement makes them necessary. When an exception is required, document why it exists and what allows its removal.

## State Ownership

| Category | Tool | Location |
|----------|------|----------|
| Server state (API data) | RTK Query | `entities/*/api/` or `features/*/api/` |
| Runtime session state | Redux Toolkit slice | `entities/session/model/` |
| Global client state | Redux Toolkit slice | `entities/*/model/` or `app/` |
| Form state | React Hook Form + Zod | Component-local |
| URL state | React Router params/search | Route-level |
| Local UI state | `useState` / `useReducer` | Component-local |

### entities/session

Runtime authentication/session lifecycle state lives in `entities/session/`:

```text
entities/session/
├── model/
│   ├── session-slice.ts   ← Redux slice: session status
│   └── selectors.ts       ← selectSessionStatus, selectIsAuthenticated
└── index.ts               ← public API
```

**Session model — current implemented scaffold:**

```text
type SessionStatus = 'initializing' | 'anonymous' | 'authenticated'
```

This is what `entities/session/model/session-slice.ts` actually implements today. There is no `needsProfile` status and no `GET /api/v1/users/me` bootstrap call in the current scaffold; `authenticated` currently means only "a token is present", not "a `User` profile exists".

**Session model — accepted Level 1 target, pending implementation:**

```text
type SessionStatus = 'initializing' | 'anonymous' | 'needsProfile' | 'authenticated'
```

Source of truth for this target: `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md` §0.7 (Phase 0.4C accepted decision). The backend `GET /api/v1/users/me` contract exists, but the frontend bootstrap call, `needsProfile`, and routing guards that react to it are **not implemented yet** — do not write code or docs that assume the frontend lifecycle already exists until the scaffold is updated to match.

**Bootstrap target (accepted, not yet implemented):**

```text
No token                                  → anonymous
token + GET /api/v1/users/me → 200        → authenticated
token + GET /api/v1/users/me → 404        → needsProfile
token + GET /api/v1/users/me → 401        → clear token → anonymous
```

`GET /api/v1/users/me` is implemented on the backend with the `200`/`404`/controlled `401` semantics above. Its executable backend code remains authoritative; the repository-grounded frontend contract is recorded as `USER-07` in `BACKEND_CONTRACT_INVENTORY.md`.

- `entities/session` owns runtime client session lifecycle state (session status).
- User/profile data fetched from backend remains RTK Query server state and must not be duplicated into the session Redux slice.
- Do not invent additional identity fields unless an actual backend/API contract requires them.

**Ownership rules:**
- `features/login/`, `features/register/`, `features/logout/` may import and dispatch `entities/session` actions.
- `app/router/` may read `entities/session` selectors for protected routing.
- `app/store` wires the session reducer.
- Frontend FSD entities do not need to correspond 1:1 to backend/JPA entities.

**Rules:**
- Do not put server data into ordinary Redux slices.
- Do not put transient local UI state into Redux.
- Do not store form state in Redux unless explicitly justified.

## RTK Query / API

- **Single `createApi` base:** Located in `shared/api/` with `fetchBaseQuery` configured for backend base URL.
- **Endpoint injection:** Domain endpoints inject into the base API from their respective entity/feature.
- **Base URL:** `VITE_API_URL` environment variable, must align with backend `/api/v1`.
- **Auth headers:** Centralized via `prepareHeaders` in `fetchBaseQuery` — reads token through a business-agnostic token-storage adapter in `shared/api/`.
- **Error handling:**
  - `shared/api/` only normalizes transport errors into a consistent `ApiError` shape.
  - `shared/api/` does not perform logout, redirect, dispatch Redux actions, or any user-facing application side effects.
  - Application-level handling belongs to `app/` or relevant `features/`, as documented in the Authentication and Error Handling sections.

### shared/api boundary

`shared/api/` may contain:
- `createApi` base instance and `fetchBaseQuery` configuration;
- a small **token-storage transport adapter** that owns Level 1 access-token persistence (read/write `localStorage`);
- generic HTTP transport infrastructure (attaching an already-available Bearer token via the adapter, normalizing HTTP errors);
- business-agnostic transport types (`ApiError`, pagination metadata, generic response wrappers).

`shared/api/` must **not** contain:
- login/register/logout/session business use cases (these belong in `features/login/`, `features/register/`, `features/logout/`);
- domain-specific endpoint definitions or DTO types;
- imports from `app/`, `features/`, `entities/`, or any higher FSD layer.

### Token-transport architecture (Level 1)

```text
shared/api/
├── base-api.ts          ← createApi + fetchBaseQuery + prepareHeaders
└── token-storage.ts     ← business-agnostic adapter: getToken / setToken / clearToken
```

- `fetchBaseQuery` `prepareHeaders` reads the Bearer token through `token-storage.ts`.
- `shared/api/` does **not** import Redux store, `RootState`, or any selector from a higher FSD layer.
- Runtime session state lives in `entities/session/` (Redux slice).
- `features/login/`, `features/register/`, and `features/logout/` coordinate both token persistence (via `shared/api/token-storage`) and session state (via `entities/session`).
- Future HttpOnly-cookie auth removes the client token-transport requirement entirely.

**Axios has been removed. All backend communication uses RTK Query.**

## DTO / Domain-Model

- API DTO types accurately represent backend request/response contracts.
- Frontend domain/UI models may differ from DTOs where semantic/shape transformation exists.
- Add DTO → domain mapping only when an actual transformation is needed, not for architectural purity.
- Keep distinct backend response shapes distinct (e.g. `DeckListResponse` ≠ `DeckResponse`).
- Do not invent frontend fields based on database/JPA knowledge.
- **Domain DTO types** (e.g. `DeckResponse`, `CardResponse`, `AuthResponse`) live in the relevant entity or feature slice (`entities/*/model/` or `features/*/model/`).
- **`shared/api/types/`** may contain only business-agnostic transport infrastructure types (e.g. `ApiError`, pagination metadata, generic response wrappers). Domain-specific DTOs must not live in shared.

## Authentication

### Level 1 (current)

- Bearer JWT + `localStorage` persistence + Redux runtime session state (`entities/session/`).
- `localStorage` persistence is a deliberate Level 1 trade-off.
- Token key: `access_token` in `localStorage`.
- RTK Query `prepareHeaders` → read token from `shared/api/token-storage` adapter → attach `Authorization: Bearer <token>`.
- `shared/api/` never imports Redux, entities, features, or app.

**401 handling (target architecture):**

```text
shared/api
→ returns normalized 401 error (does NOT dispatch logout/session actions or redirect)

app-level API error listener (middleware or RTK Query onError)
→ detects 401
→ tokenStorage.clearToken()
→ dispatches entities/session session-cleared action
→ dispatches baseApi.util.resetApiState()

app/router (protected routing)
→ reacts to session state change → redirects to login
```

- `shared/api/` does not perform application-level logout, dispatch session actions, or redirect.
- 403 / 429 / validation errors are also normalized transport errors at `shared/api/` level; user-facing behavior is owned by the appropriate higher layer.
- Logout feature (`features/logout/`) performs the same cleanup: `tokenStorage.clearToken()` + dispatch session-cleared + `baseApi.util.resetApiState()`. Cache reset is mandatory so a later login in the same browser session cannot observe the previous user's cached server state.
- Application bootstrap → rehydrate `entities/session` state from persisted token (via `shared/api/token-storage`).

### Future target

- HttpOnly + Secure + SameSite cookie-based auth (requires backend security architecture change).
- Refresh-token flow (deferred to Level 3).

## Routing

- **Library:** React Router 7 (centralized configuration via `createBrowserRouter` + `RouterProvider`).
- **Router config location:** `app/router/` (`router.tsx`, `protected-route.tsx`, `index.ts`).
- **Protected routes — current implemented scaffold:** `ProtectedRoute` reads `selectSessionStatus`/`selectIsAuthenticated` from `entities/session`. `initializing` → render nothing yet; `anonymous` → redirect to `/login` (`replace`); `authenticated` → render nested route via `Outlet`. There is no `needsProfile` branch yet.
- **Routing target for `needsProfile` (accepted, not yet implemented):**
  - `initializing` → render a blocking session-bootstrap `PageState`; never render protected content or an empty screen while bootstrap resolves.
  - `anonymous` → redirect to `/login`.
  - `needsProfile` → only `/onboarding/profile` is reachable; all other product routes redirect away (target route list owned by `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md`, not duplicated here).
  - `authenticated` → render the protected application.
  - `authenticated` user navigating to `/onboarding/profile` → redirect to `/learning`.
- **Route boundaries target:** public/auth, onboarding, and authenticated layouts; `/` redirects to `/learning`; the router provides a not-found route and route-level error surface; the application root provides a global Error Boundary.
- **Pages do not own global router configuration.**
  Current runtime route tree remains temporary. Accepted product URLs are owned
  by FRONTEND_INTEGRATION_MAP.md §0.3 and are pending implementation.

## Forms and Validation

- **Library:** React Hook Form + Zod schemas.
- Zod schemas define both validation rules and TypeScript types.
- Form state is component-local (not Redux).
- Validation schemas live alongside the form component or in the feature's `model/` segment.
- Backend validation errors should be mapped to RHF field errors where applicable.
- Wrap each `Input`, `Textarea`, or `Select` in `FormField`. `FormField` owns the control ID, label association, description/error IDs, `aria-describedby`, `aria-invalid`, and the polite field-error live region; feature forms must not recreate this wiring ad hoc.
- Preserve keyboard focus visibility. Shared controls and buttons provide `:focus-visible` styling; feature CSS must not remove it without an accessible replacement.
- During submission, disable the related native `fieldset` and render the submit `Button` with `isLoading`. Loading buttons expose `aria-busy` and remain disabled until the request settles.
- Map backend field validation to React Hook Form with `setError`. Present form-level asynchronous failures with `InlineError`; use its default assertive announcement for urgent failures or `role="status"` for non-urgent retryable feedback.

## UI / Styling

- **Strategy:** CSS Modules for component styles + semantic CSS variables for design tokens.
- **Shared UI:** `shared/ui/` — genuinely reusable visual primitives (Button, Input, etc.).
- **Domain-specific components:** Belong with their entity/feature/widget/page.
- **No external UI framework** (MUI, Ant, Tailwind, styled-components) without explicit decision.
- **Design tokens:** Semantic CSS variables in a shared stylesheet. Canonical token values, navigation shell, and screen references: `docs/frontend/DESIGN.md`.
- Headless/accessibility primitives may be introduced later for complex components.

## Error Handling

### Transport errors (shared/api responsibility)

- `shared/api/` normalizes HTTP errors into a consistent shape (`ApiError`).
- It does **not** dispatch Redux actions, redirect, or perform application-level side effects.

### Application-level error handling (app/features responsibility)

- An app-level API error listener detects normalized errors and performs side effects (e.g. 401 → clear session).
- 403 / 429 / 5xx → user-facing feedback owned by the relevant feature or a global error handler.
- Form validation errors: Zod + RHF field-level display.
- Backend validation error responses: Map to appropriate UI feedback.
- Unhandled errors: Global error boundary at `app/` level.

## Testing

- **Target stack:** Vitest + React Testing Library + MSW + Playwright.
- **Pure logic / reusable primitives** → unit tests.
- **Features and page behavior** → user-centric integration tests (RTL + MSW).
- **Critical full product flows** → Playwright E2E.
- No mandatory test for trivial presentational components.
- Test naming: `*.test.ts(x)` co-located with source or in `__tests__/` within the slice.
- See `frontend/.windsurf/rules/testing-conventions.md` for hard gates.

## Environment / Configuration

- `VITE_API_URL` — backend API base URL (must point to `/api/v1` prefix).
- `.env.example` — documents required environment variables.
- Vite dev proxy for `/api` → backend (`http://localhost:8080`).
- TypeScript `strict: true`.
- Path aliases `@/` → `src/`.
