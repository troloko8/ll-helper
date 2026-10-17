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

The implemented `widgets/app-shell/` slice owns the responsive authenticated
layout: a fixed desktop sidebar, compact mobile header, fixed mobile bottom
navigation, a skip link and route-change focus management for the protected
route outlet. Contextual routes retain the active state of their parent shell
destination. The shell navigation exposes the working `/learning`, `/created`,
and `/discover` destinations accepted for the current Level 1 subset. Further
navigation expansion is specified in
`docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md` §0.10 and
`docs/frontend/DESIGN.md`.

The implemented `pages/login/`, `pages/register/`, and
`pages/complete-profile/` slices compose that layout with their feature-owned
forms and are mounted at `/login`, `/register`, and `/onboarding/profile`.
The Register and Complete Profile features own their successful-submit
orchestration: registration persists the access token, enters `needsProfile`,
and navigates to onboarding; profile creation enters `authenticated` and
navigates to `/learning`. The pages remain route-level compositions and do not
own token or session transitions.
`RegisterForm` invokes its internal `useRegisterSuccess` hook directly;
`RegisterPage` renders the complete feature without a success callback prop.

The implemented `pages/learning/` slice owns the `/learning` route composition.
It consumes the cacheable `LEARN-05` query from `entities/learning/`, renders
the backend-defined response order, and treats the first item as the
Continue/Start highlight without copying server state into Redux slices.
The implemented `pages/learning-deck-details/` slice owns `/learning/:deckId`.
It consumes the unified, unpaginated `LEARN-06` detail response, renders its
metadata and each backend-provided card status, and derives display-only
per-status counts from the returned cards. It does not subscribe to the full
Learning collection or combine public content state with learning state. The
counts are neither persisted nor copied into client state.

The implemented `pages/created/` slice owns the `/created` route composition.
It consumes the owner-scoped `DECK-06` query from `entities/deck/`, renders the
backend-provided visibility and content-card count, and links each item to its
Owner Deck Details route. Its Create New Deck action remains available for
both empty and populated collections.

The implemented `pages/discover/` slice owns the `/discover` route composition.
It consumes the public-only infinite `DECK-03` query from `entities/deck/`, keeps
search/language/enrollment/sort controls in URL search parameters, debounces only
text search, and appends server pages through an IntersectionObserver sentinel.
It renders the backend-provided owner, language pair, content-card count, and
ACTIVE enrollment badge. Unsupported topics, levels, ratings, popularity,
bookmarks, and decorative covers are not exposed.

The implemented `pages/card-details/`, `pages/edit-card/`, and `pages/edit-deck/`
slices own the owner-only content-management routes. Card and deck form schemas,
limits, prefill, optional-field normalization, and `isPrivate` ↔ `isPublic`
mapping live in their respective entities so create/add and edit flows share one
contract. Destructive mutations use the shared native-dialog confirmation and
keep server failures inline.

The implemented `pages/create-deck/` slice owns `/decks/new` and composes the
`features/create-deck/` form inside the authenticated `AppShell`. The feature
owns the `DECK-01` mutation, backend-aligned validation, submission states, and
the required `isPrivate` UI → `isPublic` wire inversion. Successful creation
navigates directly to `/decks/:deckId/manage` so the owner can add cards and
invalidates `Deck/LIST`, ensuring the next Created visit reloads the collection.
Shared Deck response types and the backend Language enum live in
`entities/deck/`. The implemented
`pages/owner-deck-details/` slice owns `/decks/:deckId/manage`, consumes the
cacheable `DECK-02` query from `entities/deck/`, verifies the current user is
the response owner, and renders the response's content-card inventory without
learning progress. The implemented `pages/add-card/` slice owns
`/decks/:deckId/cards/new`, verifies deck ownership before rendering, and
composes the `features/add-card/` form. That feature owns manual creation
(`CARD-01`, `POST /decks/{deckId}/cards`, required translation and optional
definition) and single-card AI generation (`CARD-07`). AI generation sends
`POST /card-generations` with only title and deckId, disables the editable
fields while pending, and presents
the shared `429`/`503` errors without implementing provider logic in the
frontend. Shared `CardResponse` contract data lives in `entities/card/`.
Successful creation invalidates the selected deck detail cache before
navigation returns to Owner Deck Details. Because the Created collection also
provides each `Deck/{deckId}` tag, the same invalidation refreshes its
backend-provided `cardCount` after both manual and single-card AI creation.

The implemented `pages/bulk-generate-cards/` slice owns
`/decks/:deckId/cards/bulk`, verifies deck ownership, and composes the separate
`features/bulk-generate-cards/` use case. The feature owns multiline parsing,
duplicate reporting, CARD-02 transport, the indeterminate batch state, and the
created/failed result. Its Redux slice keeps one latest workflow snapshot per
`deckId` across route unmounts, including an in-flight request and its eventual
result. `Generate more` resets that deck, a new request replaces its previous
snapshot, logout/session invalidation clears all snapshots, and a confirmed
missing or non-owned deck clears only its own snapshot. The state is intentionally
runtime-only: ordinary navigation does not clear it, while reload does, and no
`sessionStorage` persistence is used. `features/add-card/` contains no bulk state
or mutation. Both pages link to each other through card-creation mode navigation;
neither feature imports the other.

The implemented `pages/public-deck-details/` slice owns `/decks/:deckId`, reached
from Discover or by direct link. It consumes `DECK-02`, including its
current-user `isEnrolled` field, renders public content without learning
progress or social controls, and composes
`features/enroll-deck/` for the `LEARN-01` mutation. Start Learning is available
when the deck contains cards: for a new deck it enrolls first and then opens
`/study/:deckId`; for an existing enrollment it opens Study directly. An empty
deck instead explains that there is nothing to study yet and does not present a
ready-session action. Before enrollment, a separate Enroll action adds the deck
without leaving Public Deck Details. Successful enrollment invalidates the
detail, Learning and Discover caches. A `409` from enrollment is followed by a
fresh DECK-02 read; only confirmed `isEnrolled=true` continues the requested
action. Owner Deck Details does not link to this public surface.

The implemented `pages/creator-profile/` slice owns `/creators/:username` and
is reachable from the creator link on Public Deck Details. It combines the
`USER-03` profile query from `entities/user/` with the public-only `DECK-07`
collection from `entities/deck/`, keeps both responses as RTK Query server
state, and links each returned deck back to Public Deck Details. Social
controls remain outside the implemented contract.

Discover is now the public-detail entry route in both desktop and mobile shell
navigation. The authenticated shell exposes the existing local Logout action in
the desktop sidebar footer and mobile header; it clears token, session state and
RTK Query cache without a backend endpoint or Settings destination. The existing
Created navigation, enrollment, learning and study use cases remain the
implementation foundation.

The implemented `pages/study/` slice owns the contextual `/study/:deckId`
route. It consumes the `LEARN-02` response `{deckId, deckTitle, cards}` with a
backend-ordered, maximum-ten-card batch. The title comes from this response
without a Learning-list subscription. It keeps only transient
position/result/score state locally, and composes
`features/review-card/` for `LEARN-04`. Answer correctness always comes from
the review response; the page never compares answers itself. Reviews invalidate
the affected Learning card/detail caches, while the session advances through
its original batch and explicitly refetches when the user chooses to continue.
The route is entered contextually from Learning Deck Details or through Start
Learning on Public Deck Details, which auto-enrolls first when needed; it is not
a persistent shell destination.

### Slice internal segments

Standard segments inside a slice (use only those needed):

```text
slice-name/
├── ui/       ← React components
├── api/      ← RTK Query endpoint injection or API hooks
├── model/    ← types, stores/slices, selectors, business logic
├── lib/      ← pure utility functions for this slice
├── index.ts  ← default public API
└── store.ts  ← optional reducer-only public entry for eager store wiring
```

### Public APIs

- Every slice imported by other slices exposes its default API through
  `index.ts`; the reducer-only store exception is defined below.
- Internal implementation files should not be imported directly from outside the slice.
- Shared layer sub-folders (`shared/ui`, `shared/lib`, etc.) each have their own `index.ts`.
- A lazy feature may additionally expose a root-level `store.ts` public entry
  containing only its reducer when importing the default barrel from the eager
  app store would collapse the route split. This is a measured bundling
  exception, not permission for arbitrary secondary or internal imports.

## Naming

These rules apply to all new and refactored identifiers, including tests. Name
an identifier by its domain role and, when useful, its real processing state. A
reader must understand what the value represents without reconstructing that
meaning from its type or distant call sites.

### Variables and domain vocabulary

- Use `camelCase` and prefer the smallest precise domain term:
  `duplicateCount`, `sourceLineIndex`, `generationFailure`.
- Use plural nouns for collections and the matching singular domain term for an
  element: `titleEntries` / `titleEntry`, not `items` / `item`.
- Qualify identifiers when ownership or lifecycle matters: `deckOwnerId`,
  `submittedTitles`, `requestError`. Bare `id`, `error`, or `index` is acceptable
  only in a genuinely narrow scope where no other interpretation exists.
- Use processing qualifiers such as `raw`, `parsed`, `normalized`, `validated`,
  `submitted`, or `persisted` only when they distinguish real stages. Do not add
  `current`, `final`, or `processed` without a competing state in the same flow.
- State what a number counts and include units when they are not inherent:
  `duplicateCount`, `visibleEntryCount`, `timeoutMs`, `fileSizeBytes`.
- Reuse one domain vocabulary across types, state, props, tests, API adapters,
  and user-facing concepts. Do not use multiple synonyms for the same role.

### Boolean names and predicates

Every application-owned boolean variable, field, prop, selector, or predicate
must read as a yes/no question and use the prefix that expresses its semantics:

| Prefix | Meaning | Examples |
|---|---|---|
| `is` | current state or classification | `isLoading`, `isValid`, `isLimitExceeded` |
| `has` | possession or presence | `hasErrors`, `hasDuplicates`, `hasNextPage` |
| `can` | capability or permission | `canSubmit`, `canEdit` |
| `should` | decision or expected behavior | `shouldRefetch`, `shouldShowPreview` |
| `needs` | required follow-up action | `needsProfile`, `needsConfirmation` |

- Do not force every boolean under `is`: use `hasErrors`, not `isHasErrors`, and
  `canSubmit`, not `isSubmissionAllowed` when capability is the real meaning.
- Do not introduce naked boolean names such as `loading`, `filtered`, `applied`,
  `featured`, `success`, `flag`, or `enabled` in application-owned code.
- Predicate functions and selectors follow the same prefixes: `isApiError`,
  `hasActiveFilters`, `canAccessDeck`, `selectIsAuthenticated`.
- Preserve external wire fields and platform-native props such as `correct`,
  `retryable`, `open`, `required`, or `disabled`. Alias them to semantic local
  names when they leave that boundary and the distinction improves clarity.

### No opaque or “ninja” names

Do not use these as bare domain identifiers in state, props, public APIs, or
non-trivial functions:

`data`, `draft`, `text`, `value`, `item`, `result`, `response`, `payload`,
`info`, `object`, `temp`, `state`, `list`, `map`, `flag`, `handler`.

Replace them with the represented concept and state, for example:

| Avoid | Prefer |
|---|---|
| `draft` | `rawTitlesText`, `editableCard` |
| `text` | `searchText`, `errorMessage` |
| `item` | `titleEntry`, `deck` |
| `result` | `preparedTitles`, `generationResult` |
| `response` | `createdCard`, `reviewOutcome` |
| `value` | `sourceLanguage`, `normalizedTitle` |

Framework-owned signatures, external contracts, reducers, and small generic
utilities may retain conventional names when changing them would obscure the
boundary. Alias generic framework fields immediately when domain code consumes
them, for example `const { data: deck, error: deckError } = query`.

### Functions, events, and hooks

- Functions use `camelCase` verb phrases that describe the observable action:
  `prepareBulkTitles`, `removeTitleEntry`, `deckToFormValues`.
- Use conventional verbs consistently: `create`/`update`/`delete` for commands,
  `parse` for syntax, `normalize` for canonicalization, `validate` for checking,
  `to`/`from` for mappings, and `select` for Redux selectors.
- Do not use vague verbs such as `process`, `handle`, `manage`, `do`, or `run`
  without the domain action. `handle<Action>` is reserved for component-local
  event handlers; callback props use `on<Action>`.
- Hooks use the `use` prefix and name the owned behavior or resource:
  `useBulkGeneration`, not `useData`.
- Redux actions use completed domain events when that matches the transition:
  `bulkGenerationRequested`, `sessionCleared`.
- Do not add an `Async` suffix merely because a function returns a Promise; the
  domain action remains the primary name.

### Components, classes, and types

- Files and directories use `kebab-case`. Components and classes use
  `PascalCase` noun phrases; a component name describes its product or UI role,
  not its technical container.
- Types and interfaces use `PascalCase` noun phrases. Use precise role suffixes
  where applicable: `Props`, `State`, `Options`, `Args`, `Dto`, `Error`,
  `Service`, or `Repository`.
- Avoid vague type/class suffixes such as `Manager`, `Helper`, `Utils`,
  `Processor`, `Handler`, `Data`, `Info`, or `Model` unless that word describes
  a specific established architectural role.
- Component prop types end in `Props`. Error classes end in `Error`. Transport
  DTOs end in `Dto` when they model the HTTP boundary; internal domain types do
  not inherit the suffix.
- Prefer string unions or `as const` collections over TypeScript enums. If an
  enum is required by an external contract, its type uses `PascalCase` and its
  serialized values follow that contract.
- Acronyms use normal word casing inside identifiers: `Api`, `Dto`, `Url`, and
  `Id`, as in `ApiError`, `CardResponseDto`, and `deckId`.
- Extracted collection components follow the active platform's FSD collection-
  item naming rule.

### Constants, boundaries, and enforcement

- `UPPER_SNAKE_CASE` is for true module-level constants, fixed option sets, and
  immutable configuration keys. An ordinary local declared with `const` remains
  `camelCase`.
- Never rename backend DTO fields, DOM properties, or framework contracts merely
  to satisfy local style. Translate or alias them at the boundary instead.
- Naming-only refactors preserve behavior and update affected tests, selectors,
  actions, and public exports atomically. Repository-wide renames require a
  scoped task and verification.
- Keep this section as the single normative owner. Add ESLint naming rules only
  after auditing and migrating existing violations; do not introduce a noisy
  denylist or type-aware lint cost without a measured, separately reviewed
  change.

## Formatting

- Use four spaces for indentation; do not use tab characters.
- Prettier is the formatting source of truth. Its repository configuration preserves the established single-quote and no-semicolon style.
- Use `npm run format` to format frontend source files and `npm run format:check` for a non-mutating verification.

## Imports

- Absolute imports via path aliases.
- Alias: `@/` → `src/`.
- Import order: external libs → shared → entities → features → widgets → relative.
- No circular imports between slices.
- Import from the default slice public API (`index.ts`), or from its documented
  reducer-only `store.ts` entry when wiring the eager app store. Do not import
  internal files.

## Performance / Bundling

### Loading boundaries

- Route pages use React Router `route.lazy` with dynamic imports through their
  slice public API. Keep route paths, guards, session bootstrap, store, shell,
  loading and error boundaries eager. Downloading a page module is not an
  authorization check; backend access control remains mandatory.
- Consider dynamic imports for substantial, infrequently used functionality
  (editors, charts, export tools) when measurements show initial-load savings.
  Do not split every component, small utility, or immediately needed dependency:
  extra requests and waterfalls can outweigh the benefit.
- Each async boundary needs visible, accessible loading and recoverable error
  handling. Initial routing uses `RouteLoading`; later navigation keeps the
  current content with a pending announcement. Failed route imports reach
  `RouterErrorSurface` with a manual reload action, never an automatic reload loop.
- Keep FSD dependency direction and public APIs intact. Do not statically import
  a lazy page from an eager barrel, or move session/API initialization behind an
  optional UI action. Do not add manual vendor chunks without inspecting the
  resulting dependency graph and cold-route cost.
- When a lazy feature owns Redux workflow state, expose its reducer through a
  reducer-only root `store.ts` entry. The eager store must not import the
  feature's default UI barrel, because doing so collapses the lazy route into
  the entry graph.

### Measurement and dependencies

- `npm run build` creates the production manifest and runs `bundle:check`.
  `bundle-budget.json` is the sole owner of numeric limits: eager-entry gzip,
  cold-route gzip, and maximum raw JS chunk bytes. Initial limits include roughly
  15% headroom over the measured split build; changing them requires before/after
  evidence and a reason, not merely a failing build.
- The checker sums per-file Node gzip sizes across transitive **static** imports,
  deduplicates shared files, and includes both the entry and matched page for
  cold routes. It verifies every `src/pages/<slice>/index.ts` remains a dynamic
  boundary. Future non-route page slices or eager exceptions require an explicit
  checker/convention decision. These are JS transfer estimates, not total-page
  weight, browser timings, CSS/image budgets, or redirect-chain measurements.
- Run `npm run analyze` for route splitting, significant dependency changes or
  unexplained growth. Inspect `reports/bundle.html` for eager dependencies,
  duplicate package versions/modules and unexpected sharing; the report is
  ignored and outside deployment output. `npm run test:bundle` tests the budget
  graph/checking logic. Do not raise Vite's warning threshold to hide regressions.
- Before adding a dependency, consider platform APIs and existing dependencies;
  check maintained/supported versions, tree-shaking, duplication and actual
  production size after integration. Import only supported public entry points;
  prefer type-only imports for types. Large optional functionality belongs behind
  a measured async boundary, not in the application bootstrap.
- Before committing relevant changes, run build, lint and affected behavioral
  tests; for loading-boundary changes cover initial/direct load, in-app navigation,
  guard redirects and module-load failure. Record size changes and any intentional
  budget adjustment in the review. Measurement precedes memoization, prefetch or
  other speculative optimizations.

### Images and delivery

- Reserve image space using intrinsic `width`/`height` or a stable aspect ratio.
  Use appropriately sized assets, modern formats and responsive sources when
  available. Use native lazy loading for noncritical/below-the-fold images and
  async decoding where appropriate; never lazily load the primary above-the-fold
  / LCP image. Decorative images have empty alt text. Do not fabricate responsive
  variants of backend URLs when no resizing contract exists.
- Deployment contract: content-hashed static assets use
  `Cache-Control: public, max-age=31536000, immutable`; HTML (including SPA route
  fallbacks) uses `Cache-Control: no-cache` so new requests revalidate it. Unhashed
  public files need their own revalidation policy; do not apply immutable caching
  to them or to authenticated API responses.
- Deploy atomically and retain prior hashed assets for active clients during
  rollouts. Missing assets must return an actual 404, not the SPA HTML fallback.
  Verify headers, direct-route fallback and old-chunk availability on the real
  hosting origin/CDN; `vite preview` does not establish production caching.
  Hosting implementation and later delivery optimizations are tracked in
  `docs/roadmap/backlog.md`.

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
| Route-resilient feature workflow state | Redux Toolkit slice | `features/*/model/` |
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
`authenticated`. The `GET /api/v1/users/me` bootstrap and session-aware route
guards resolve persisted sessions without treating a token alone as proof that
a `User` profile exists.

**Bootstrap behavior:**

```text
No token                                  → anonymous
token + GET /api/v1/users/me → 200        → authenticated
token + GET /api/v1/users/me → 404        → needsProfile
token + GET /api/v1/users/me → 401        → clear token → anonymous
```

`GET /api/v1/users/me` is implemented on the backend with the `200`/`404`/controlled `401` semantics above. Its executable backend code remains authoritative; the repository-grounded frontend contract is recorded as `USER-07` in `BACKEND_CONTRACT_INVENTORY.md`.

- `entities/session` owns runtime client session lifecycle state (session status).
- User/profile data fetched from backend remains RTK Query server state and must not be duplicated into the session Redux slice.
- Authenticated `AppShell` maintains a `useGetCurrentUserQuery()` subscription for its entire mounted lifetime. This retains the shared profile cache across route changes, including pages that do not consume the profile. Page-level consumers keep the same hook and cache key; no second profile store or prop threading is needed. Login/bootstrap data is reused when cached; otherwise the subscription fetches `/users/me`. Logout/401 still clears the cache through the existing app-level lifecycle. Cache retention does not define freshness; a future revalidation policy is tracked in `docs/roadmap/backlog.md`.
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
- A synchronous mutation workflow may keep a minimal response snapshot in its
  feature slice when the result must survive route unmount and RTK Query has no
  backend job resource to refetch. This is not canonical server state: keep it
  runtime-only, scope it to the workflow, define explicit reset boundaries, and
  continue to use RTK Query for transport and cache invalidation. Bulk CARD-02
  is the current accepted case.

## RTK Query / API

- **Single `createApi` base:** Located in `shared/api/` with `fetchBaseQuery` configured for backend base URL.
- **Endpoint injection:** Domain endpoints inject into the base API from their respective entity/feature.
- **Implemented endpoint injections:** feature slices own auth/profile/create/add/enroll/review plus `DECK-04/05` and `CARD-05/06`; `entities/card` owns `CARD-03`; `entities/deck` owns `DECK-02`, the infinite-query `DECK-03`, `DECK-06`, and `DECK-07`; `entities/user` owns `USER-03` and `USER-07`; `entities/learning` owns `LEARN-02/05/06`. Response DTOs remain RTK Query server data and are not copied into ordinary Redux slices except for the narrowly scoped synchronous-mutation workflow snapshot documented under State Ownership.
- **Base URL:** `VITE_API_URL` environment variable, must align with backend `/api/v1`.
- **Auth headers:** Centralized via `prepareHeaders` in `fetchBaseQuery` — reads token through a business-agnostic token-storage adapter in `shared/api/`.
- **Error handling:**
  - `shared/api/` only normalizes transport errors into a consistent `ApiError` shape.
  - `shared/api/` does not perform logout, redirect, dispatch Redux actions, or any user-facing application side effects.
  - Application-level handling belongs to `app/` or relevant `features/`, as documented in the Authentication and Error Handling sections.

### Paginated collections

- Mirror the backend collection contract exactly in the owning entity or
  feature: Page responses include `items`, `page`, `size`, `totalElements`,
  `totalPages`, and `hasNext`; Slice responses omit totals; cursor responses use
  `nextCursor` instead of a page number.
- Use a regular RTK Query endpoint when the UI selects explicit pages. Use an
  RTK Query infinite endpoint only for append/load-more behavior.
- Derive the next request from the server response (`hasNext` plus `page`, or
  `nextCursor`); do not infer completion from `items.length`.
- Search, filters, and sorting belong to the query argument so changing them
  creates a fresh cache key and restarts pagination. Keep them in URL search
  parameters when they are part of the route's accepted navigable state.
- Render totals only from server-provided metadata. Do not compute collection
  totals from the currently loaded pages.
- Keep domain page DTOs in their owning slice. Move only a genuinely reused,
  business-agnostic pagination type to `shared/api/types/`.

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
- Keep distinct backend response shapes distinct (e.g. `PublicDeckListResponse` ≠ `OwnedDeckListResponse` ≠ `DeckResponse`).
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
- `/login` and `/register` are nested under `AuthRoute`; `/onboarding/profile` is nested under `OnboardingRoute`; `/`, `/learning`, `/created`, `/discover`, `/learning/:deckId`, `/decks/new`, `/decks/:deckId`, `/decks/:deckId/manage`, `/decks/:deckId/cards/new`, `/decks/:deckId/cards/bulk`, `/study/:deckId`, and the authenticated-only wildcard/not-found route are nested under `AuthenticatedRoute` and the responsive `AppShell`.
- `/` redirects to the implemented Learning list at `/learning`. The router provides a root route-level error surface and an explicit wildcard not-found page; the application root provides a global Error Boundary.
- The implemented `pages/not-found/` slice owns the basic wildcard route fallback and contains no session or domain behavior.
- **Pages do not own global router configuration.**
  Current runtime route tree remains temporary. Accepted product URLs are owned
  by FRONTEND_INTEGRATION_MAP.md §0.3 and are pending implementation.

## Forms and Validation

- **Library:** React Hook Form + Zod schemas.
- Zod schemas define both validation rules and TypeScript types.
- Form state is component-local (not Redux).
- Validation schemas live alongside the form component or in the feature's `model/` segment.
- Login, Register, and Complete Profile expose their backend-aligned form schemas and `z.infer`-derived value types through the feature public API. The Complete Profile form intentionally excludes `avatarUrl`; its submit mapping sends the API DTO's nullable field as `null`.
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
- MSW is started and reset from the Vitest setup file; each worker receives an
  isolated server lifecycle, so test files may execute in parallel.
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
