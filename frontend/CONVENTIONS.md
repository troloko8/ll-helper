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

The implemented `widgets/public-form-layout/` slice owns the responsive layout
base shared by Login, Register, and Complete Profile. Route guards and session
state remain app/domain responsibilities; the widget contains no auth logic.

The implemented `pages/login/`, `pages/register/`, and
`pages/complete-profile/` slices compose that layout with their feature-owned
forms and are mounted at `/login`, `/register`, and `/onboarding/profile`.
Successful authentication/profile creation can be exposed through callbacks;
token/session transitions and navigation remain owned by the pending Auth
orchestration rather than by the presentational pages.

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

## Formatting

- Use four spaces for indentation; do not use tab characters.
- Prettier is the formatting source of truth. Its repository configuration preserves the established single-quote and no-semicolon style.
- Use `npm run format` to format frontend source files and `npm run format:check` for a non-mutating verification.

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
│   └── selectors.ts       ← selectSessionStatus, selectIsAuthenticated, selectNeedsProfile
└── index.ts               ← public API
```

**Session model — current implementation:**

```text
type SessionStatus = 'initializing' | 'anonymous' | 'needsProfile' | 'authenticated'
```

`entities/session/model/session-slice.ts` implements all four accepted Level 1
statuses and exposes explicit transitions to `anonymous`, `needsProfile`, and
`authenticated`. The `GET /api/v1/users/me` bootstrap resolution and routing
guards that react to `needsProfile` are still pending; the current token-only
bootstrap must not be treated as proof that a `User` profile exists.

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
- **Implemented Auth/User injections:** `features/login` owns `AUTH-01`, `features/register` owns `AUTH-02`, `features/complete-profile` owns `USER-01`, and `entities/user` owns the cacheable current-profile query `USER-07`. `UserResponseDto` remains RTK Query server data and is not copied into `entities/session`.
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
- Application bootstrap checks persisted-token sessions through `USER-07 GET /users/me`: `200` → `authenticated`; `404` from this endpoint only → `needsProfile`; shared `401` handling clears the token, session, and RTK Query cache → `anonymous`. Without a persisted token, bootstrap resolves directly to `anonymous` without an HTTP request. `UserResponse` remains RTK Query server state and is not copied into the session slice.

### Future target

- HttpOnly + Secure + SameSite cookie-based auth (requires backend security architecture change).
- Refresh-token flow (deferred to Level 3).

## Routing

- **Library:** React Router 7 (centralized configuration via `createBrowserRouter` + `RouterProvider`).
- **Router config location:** `app/router/` (`router.tsx`, route-boundary components, `index.ts`).
- **Implemented route boundaries:** `AuthRoute`, `OnboardingRoute`, and `AuthenticatedRoute` read `entities/session` runtime status and gate their nested routes through `Outlet`:
  - `initializing` → render a blocking session-bootstrap `PageState`; never render protected content or an empty screen while bootstrap resolves.
  - `anonymous` → allow `/login` and `/register`; redirect every other route to `/login`.
  - `needsProfile` → only `/onboarding/profile` is reachable; all other product routes redirect away (target route list owned by `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md`, not duplicated here).
  - `authenticated` → render the protected application; Auth/Onboarding routes redirect directly to `/learning`.
- `/login` and `/register` are nested under `AuthRoute`; `/onboarding/profile` is nested under `OnboardingRoute`; `/`, `/learning`, and the authenticated-only wildcard/not-found route are nested under `AuthenticatedRoute`.
- `/` redirects to `/learning`. The `/learning` route is the temporary product placeholder until the Learning screen and authenticated `AppShell` are implemented. The router provides a root route-level error surface and an explicit wildcard not-found page; the application root provides a global Error Boundary.
- The implemented `pages/not-found/` slice owns the basic wildcard route fallback and contains no session or domain behavior.
- **Pages do not own global router configuration.**
  Current runtime route tree remains temporary. Accepted product URLs are owned
  by FRONTEND_INTEGRATION_MAP.md §0.3 and are pending implementation.

## Forms and Validation

- **Library:** React Hook Form + Zod schemas.
- Zod schemas define both validation rules and TypeScript types.
- Form state is component-local (not Redux).
- Validation schemas live alongside the form component or in the feature's `model/` segment.
- Login, Register, and Complete Profile expose their backend-aligned form schemas and `z.infer`-derived value types through the feature public API. The Complete Profile form intentionally excludes `avatarUrl`; its future Level 1 submit mapping must send the API DTO's nullable field as `null`.
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
- `getApiErrorPresentation(error)` maps transport status to safe generic copy; it never exposes backend `5xx` messages. A feature or page may override the copy when it has resource-specific context.
- `getApiFieldErrors(error)` extracts only `400 { errors: { field: message } }` validation payloads. Features map recognized field names to React Hook Form with `setError`; `FormField` renders the resulting message.
- It does **not** dispatch Redux actions, redirect, or perform application-level side effects.

### Application-level error handling (app/features responsibility)

- The app-level API error listener handles every normalized `401` by clearing the token, clearing the runtime session, and resetting the RTK Query cache. Routing owns the resulting redirect.
- Page-load `403` / `404` / `409` / `429` / `5xx` failures render `ApiErrorPresentation` in `page` mode (`PageState`); action-level failures render it in `inline` mode (`InlineError`). Features may provide contextual title/message/action props.
- A `400` field-validation payload is mapped to recognized RHF fields and displayed through `FormField`. Malformed-body or non-field `400` failures use inline presentation.
- Form validation errors: Zod + RHF field-level display.
- Unhandled errors: the global `ApplicationErrorBoundary` wraps all application providers; the root router `errorElement` handles route loader/render failures. Both use `PageState` and hide technical error details.

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
