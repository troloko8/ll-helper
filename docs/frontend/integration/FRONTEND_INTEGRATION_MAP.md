# Frontend Integration Map — Phase 0.4B (historical) + Phase 0.4C (accepted decisions)

> **Purpose:** screen-by-screen map from the 26 canonical Stitch references to frontend routes and the backend contracts they require.
> **Scope:** documentation and analysis only. Phase 0.4C does not change backend behavior, DTOs, Stitch screens, routes, or frontend runtime code — it only records accepted product/routing decisions on top of the Phase 0.4B read-only snapshot below.
> **Phase 0.4B date:** 2026-08-23 (repository baseline: `master` after commit `758a565`). **§2–§7 below are preserved as the historical Phase 0.4B result and are not rewritten**, except where a specific field is explicitly superseded by an accepted §0 decision (marked inline, e.g. the `/decks/:deckId` route replacing the `/discover/decks/:deckId` candidate).
> **Phase 0.4C date:** 2026-08-24. §0 records the accepted Level 1 vertical MVP decisions; where §0 and §2–§7 disagree, §0 governs.

## 0. Phase 0.4C accepted decisions

This section supersedes the "candidate, not accepted" status stated in §1 item 5 for the routes/surfaces listed below. It does not change Stitch, `MANIFEST.md`, backend code, or frontend code.

### 0.1 Accepted Level 1 MVP surfaces

Login, Register, Complete Profile, Learning list, Create Deck, Owner Deck Details, Manual Add Card, Public Deck Details + Enroll, Learning Deck Details, Study.

### 0.2 Accepted deferred surfaces/functions

Created Decks list; Discover list/search; Creator Profile; aggregate Progress dashboard; Edit Deck; Edit Card (full Card Editor — target: after first deployment); single-card AI generation (optional, separate task after manual-add smoke succeeds — not bundled into the same PR); bulk AI generation; advanced AI partial-failure UX; pagination; refresh token; backend logout; social/ratings/likes/bookmarks.

### 0.3 Accepted route map

| Route | Status | Canonical screen | Notes |
|---|---|---|---|
| `/login` | accepted | `login_llhelper` | |
| `/register` | accepted | `register_llhelper_refined` | |
| `/onboarding/profile` | accepted | `onboarding_profile_setup_llhelper` / `complete_your_profile_mobile_base` | Canonical base/state references completed; see §0.5 and `MANIFEST.md`. |
| `/` → `/learning` | accepted | — | redirect |
| `/learning` | accepted | `learning_llhelper_refined_navigation` / `learning_mobile_dashboard` | G-06 backend contract implemented as LEARN-05 |
| `/learning/:deckId` | accepted | `learning_deck_details_llhelper_refined` | |
| `/decks/new` | accepted | `create_deck_llhelper` | |
| `/decks/:deckId` | accepted (**replaces `/discover/decks/:deckId` candidate in §5.8**) | `deck_details_public_llhelper_refined` | Public Deck Details; JWT-protected route, "public" is the product-surface name, not anonymous HTTP access; reachable only by direct link since Discover is deferred |
| `/decks/:deckId/manage` | accepted | `deck_details_owner_llhelper_refined` | Owner Deck Details |
| `/decks/:deckId/cards/new` | accepted | `add_edit_card_llhelper_refined` (manual portion) / `add_card_mobile` | Manual Add Card only; single-card AI is a separate optional task (§0.2) |
| `/study/:deckId` | accepted | `study_english_b1_llhelper_refined` / mobile | reached contextually from Learning Deck Details; a deck-less `/study` is not needed at Level 1 |
| `/created` | deferred | — | |
| `/discover` | deferred | — | |
| `/progress` | deferred | — | |
| `/creators/:username` | deferred | — | |
| `/decks/:deckId/edit` | deferred | — | |
| `/decks/:deckId/cards/:cardId/edit` | deferred | — | |

Product routes are owned by this map, not by `frontend/CONVENTIONS.md` (which owns routing mechanics only).

### 0.4 Blocker categorization (supersedes the flat gap list in §3 for sequencing purposes)

**Vertical implementation blockers** (required before the local single-user vertical smoke works at all):
- G-01 `GET /api/v1/users/me` — completed: JWT subject email resolves `AuthUser` → linked `User`, returns `UserResponse`, and does not auto-create a missing profile. `200`/`404`/shared controlled `401` semantics are verified by service, `@WebMvcTest`, and real `SecurityFilterChain` tests.
- [x] G-03 controlled 401 for expired/malformed/invalid JWT — done: `JwtAuthenticationFilter` catches `JwtException`/`IllegalArgumentException`, clears `SecurityContextHolder`, and delegates to the shared `RestAuthenticationEntryPoint`, returning the same `{"message":"Authentication required"}` 401 body as the missing-token case. Verified by `JwtSecurityFilterChainTest` (real `SecurityFilterChain`, not `addFilters=false`). No longer an active blocker.
- G-02 Register → Complete Profile orchestration (product decision accepted here; no backend code change required beyond already-implemented `USER-01`)
- [x] G-06 Learning Decks list endpoint — implemented as `GET /api/v1/learning/decks` (LEARN-05)
- G-08 Study selection must include `REVIEWING`
- G-12 `docs/features/learning-flow.md` must reflect the actual 409 (done — see that file)

G-05 is **not** described as a vertical-implementation necessity for the local single-user smoke: the current endpoints can already return the user's own deck/cards without ownership enforcement. It is placed early in the backend/security execution order anyway (§0.6, step 2) because the Owner/Public trust boundary must not ship publicly unenforced.

**Public deployment/security blockers** (not required for local vertical smoke; required before first public deployment):
- G-04 unfiltered `GET /api/v1/decks`
- `CARD-04` unfiltered `GET /api/v1/cards` (not "G-04 cards" — distinct endpoint, own inventory item)
- G-05 private visibility protection for `GET /decks/{id}` and `GET /cards/{id}`
- Catch-all `500` handler must not return the raw exception message (`GlobalExceptionHandler.handleException`)

**Deferred backend capabilities** (no accepted MVP flow depends on them):
- Owner-scoped Created list; public-only Discover list/search; aggregate Progress endpoint; creator-public-decks endpoint; bulk AI failed-titles response; pagination; refresh token; backend logout.

### 0.5 Accepted Stitch/design follow-up

- [x] **Complete Profile** — canonical desktop base, mobile base, validation error, username conflict, and submitting references exist and are registered in `docs/frontend/DESIGN.md` and `docs/frontend/design-reference/MANIFEST.md`. Fields: `username, firstName, lastName, nativeLanguage, targetLanguage, uiLanguage` (matches existing `USER-01 CreateUserRequest`; `avatarUrl` excluded from the MVP form).

### 0.6 Accepted backend → Stitch → frontend order

1. Backend: G-08 (G-01, G-03, and G-06 done — see §0.4).
2. Backend security (early, before any public-facing exposure): G-05.
3. Documentation correction: G-12 (done in this task — `docs/features/learning-flow.md`).
4. ~~Stitch: Complete Profile screens.~~ — completed; see §0.5.
5. Frontend: Auth + onboarding (`needsProfile` session state, §0.7).
6. Frontend: Learning list + Learning Deck Details.
7. Frontend: Create Deck + Owner Deck Details.
8. Frontend: Manual Add Card.
9. Frontend: Public Deck Details + Enroll.
10. Frontend: Study + per-card progress display (§0.8).
11. E2E manual smoke + Postman sync.
12. Release hardening: G-04, `CARD-04`, G-05 verification (regression test, not re-implementation, if already closed in step 2), safe 500 body.
13. First deployment.
14. Optional, separate task: single-card AI generation, after manual-add smoke succeeds; does not block step 13.

### 0.7 Session state (accepted)

```text
type SessionStatus = 'initializing' | 'anonymous' | 'needsProfile' | 'authenticated'
```

Implemented `GET /api/v1/users/me` bootstrap semantics:
- `200 UserResponse` → valid JWT, profile exists → `authenticated`.
- `404 {message}` → valid JWT, profile does not exist → `needsProfile`. No separate machine-readable error code is required for Level 1: a 404 from `GET /api/v1/users/me` specifically is unambiguous.
- `401 {message}` → missing/invalid/expired JWT → `anonymous`.

This is the implemented session-bootstrap contract.

### 0.8 Progress semantics (accepted, corrects any prior claim of a ready backend aggregate)

- Backend source of truth: `LEARN-03` (`GET /decks/{deckId}/cards`) and its per-card `CardLearningStatus` inside `DeckCardResponse.progress`. **`LEARN-03` does not return a per-deck aggregate summary field** — no such field exists on the current DTO.
- Frontend may compute **display-only** counts `{new, learning, reviewing, mastered}` from the full card array already returned by `LEARN-03` for the currently open deck. These derived counts are not persisted and do not become a new domain/server state.
- This is permitted only while `LEARN-03` returns the full, unpaginated card list for a deck. If pagination is introduced for this endpoint (currently deferred, Level 2), the aggregate must move to the backend.
- The separate cross-deck aggregate `/progress` dashboard remains deferred (G-07); it requires data across all of a user's decks, which no accepted Level 1 endpoint provides.

### 0.9 Audit document lifecycle

- **This document** stays active through implementation of the accepted Level 1 routes above; it then converts to a compact screen integration registry that does not duplicate Stitch IDs already owned by `docs/frontend/design-reference/MANIFEST.md`.
- **`docs/frontend/integration/BACKEND_CONTRACT_INVENTORY.md`** stays active as the repository-grounded HTTP-contract snapshot until OpenAPI adoption (`backend/IMPROVEMENTS.md`); after OpenAPI, it reduces to security semantics, integration warnings, and known gaps. OpenAPI itself is out of scope for Level 1/Phase 0.4C.
- No document is renamed or deleted now; `AGENTS.md` pointers and any validator checks are updated only at the actual retirement/conversion point.

## 1. Source precedence and boundaries

1. `docs/frontend/integration/BACKEND_CONTRACT_INVENTORY.md` owns the repository-grounded HTTP-contract snapshot and gap evidence.
2. `docs/frontend/DESIGN.md` owns product surfaces, shell rules, and canonical screen names.
3. `docs/frontend/design-reference/MANIFEST.md` owns exact Stitch project/screen IDs and state variants.
4. Executable backend code remains authoritative if the inventory becomes stale.
5. The routes and frontend phases in §2–§7 below were **candidates as of Phase 0.4B**. Phase 0.4C (§0) has since accepted the routes/phases listed in §0.1–§0.3 as decisions; any route or surface not listed in §0 remains a non-accepted candidate or deferred (§0.2).

The map preserves the content/learning boundary: `Deck`/`Card` are owner-managed content; `UserDeckProgress`/`UserCardProgress` are per-user learning state. Owner/Public Deck Details must not display learning progress, while Learning Deck Details may.

## 2. Status definitions

### Canonical-reference integration status

| Status | Meaning |
|---|---|
| **ready** | The screen-specific backend contract is sufficient for the intended surface. Shared platform prerequisites may still determine implementation order. |
| **partial** | A usable contract exists, but part of the screen, an important state, or a safe lookup/navigation path is incomplete. |
| **blocked** | The intended screen cannot be implemented safely or truthfully with the current backend contract. |
| **deferred** | A real surface exists, but it is a candidate to remain outside the first MVP; Phase 0.4C must confirm the deferral. *(Historical status-definition text — §0.2 has since confirmed deferral for the specific surfaces listed there.)* |

### Backend status

`implemented`, `partial`, and `missing` retain the definitions from the backend inventory. A screen may be `ready` against an implemented endpoint while still depending on a shared prerequisite such as completed authentication.

### Contract-local semantics (normative for this map)

Statuses in this map are **screen-contract-local**: they describe whether the screen's own required backend contract is sufficient, not whether every shared platform prerequisite has shipped yet.

- Shared blockers **G-01–G-03** (auth/session bootstrap: current-user identity, Register→Profile orchestration, invalid-token contract) determine *when in the build order* a screen can be safely reached with a trustworthy session. They do not, by themselves, downgrade a screen whose own contract is otherwise sufficient from `ready` to `partial`.
- A screen is `partial` only when its **own** screen-specific contract, an important state, or a safe lookup/navigation path is incomplete (e.g. an unprotected read, a missing per-screen field, an untruthful partial-failure response).
- Applying this distinction: Login (`AUTH-01`) and Create Deck (`DECK-01`) are `ready` — their own endpoints fully satisfy the screen's request/response contract. Auth bootstrap (G-01–G-03) gates *reaching* those screens with a session, not the screens' own contracts.

## 3. Shared prerequisites and gaps

| ID | Prerequisite / gap | Affected surfaces | Phase 0.4B conclusion |
|---|---|---|---|
| G-01 | No `GET /api/v1/users/me`; JWT subject is email and the frontend has no current `User.id` after login. | All authenticated shell/session bootstrap; especially Created and owner routing. | Backend blocker before Auth integration. |
| G-02 | Register creates `AuthUser` only; no accepted Register → Profile flow or canonical Complete Profile screen exists. *(Historical Phase 0.4B finding; the flow and canonical references are now resolved by §0.3/§0.5.)* | Register and every new-user authenticated flow. | Backend + product + Stitch blocker before Auth integration. *(Historical status; superseded by §0.)* |
| G-03 | Expired/malformed/invalid-signature JWT has no controlled, verified 401 contract. | Every JWT screen and app-level session-expiry handling. | Backend/error-contract blocker before Auth integration. |
| G-04 | `GET /decks` returns every deck; no owner-scoped or public-only list contract. Client-side filtering is prohibited because it transmits private data. | Created, Discover, Creator Profile. | Security/backend blocker. |
| G-05 | `GET /decks/{id}` and `GET /cards/{id}` do not enforce owner/public visibility. | Public Deck Details, owner/edit prefill trust boundary, card edit. | Security/backend blocker for public-facing flows; partial gap for owner tooling. |
| G-06 | Learning Decks list contract. | Learning dashboard and navigation into enrolled decks. | ✅ Resolved by LEARN-05: active current-user enrollments, deterministic Continue/Start ordering, and mastered/total aggregation. |
| G-07 | No aggregate Progress contract. | Progress. | Backend blocker. |
| G-08 | Study selection excludes `REVIEWING`. | Study and truthful all-caught-up state. | Backend correctness gap before Study MVP. |
| G-09 | Bulk AI response omits failed titles/reasons. | Add/Edit Card AI partial-failure UX. | Partial gap; manual cards are not blocked. |
| G-10 | No creator-scoped public-deck list contract. | Creator Profile. | Backend blocker if the surface enters MVP. |
| G-11 | `isPrivate` UI control maps inversely to wire field `isPublic`. | Create/Edit Deck. | Required frontend boundary mapping: `isPublic = !isPrivate`; not a backend gap. |
| G-12 | Learning "not enrolled" is actually 409 while learning-flow prose says 403. | Learning Deck Details, Study, review submission. | Documentation-sync gap; frontend must follow the actual 409 contract until corrected. |

Shared JWT errors on every authenticated endpoint: missing Bearer token → controlled `401 {message}`; expired/malformed token → unresolved G-03. Shared controller errors where applicable: validation `400 {errors}`, malformed body `400 {message}`, authorization `403 {message}`, missing resource `404 {message}`, state conflict `409 {message}`, rate limit `429 {error,message,timestamp}`, AI unavailable `503 {message}`, and catch-all `500 {message}`.

## 4. Coverage summary

| Integration status | Canonical references | Count |
|---|---|---:|
| **ready** | Login; Learning desktop/mobile; Create Deck desktop/mobile; Learning Deck Details desktop/mobile; Add Card mobile | 8 |
| **partial** | Edit Deck desktop/mobile; Owner Deck Details desktop/mobile; Add/Edit Card desktop; Study desktop/mobile | 7 |
| **blocked** | Register; Created desktop/mobile; Public Deck Details desktop/mobile; Discover desktop/mobile; Progress desktop/mobile | 9 |
| **deferred** | Creator Profile desktop/mobile | 2 |
| **Total** | All canonical references from the manifest | **26** |

`deferred` for Creator Profile was provisional as of Phase 0.4B, not a final MVP decision at that time. *(Historical — §0.1/§0.2 has since confirmed Creator Profile as deferred.)*

## 5. Screen-by-screen integration map

Every subsection applies its contract fields to every canonical reference in its local reference table. State IDs are trailing Stitch screen IDs under canonical project `projects/8241473581937023308`.

### 5.1 Login

| Field | Mapping |
|---|---|
| Product surface | Login |
| Candidate route | `/login` (public; anonymous-only redirect behavior to decide in 0.4C) |
| Auth | Public request; successful response starts a JWT session. |
| Domain owner | Auth + app-level session bootstrap |
| Endpoint | `AUTH-01` — `POST /api/v1/auth/login` |
| Request / response DTO | `LoginRequest {email,password}` → `AuthResponse {accessToken}` |
| Errors | 400 field validation; 401 invalid credentials; 429 rate limit. Post-login session calls additionally inherit G-03. |
| Loading / error / empty | Submit-button loading; field errors for 400; form-level message for 401/429/5xx. Empty state not applicable. No canonical state variant. |
| Backend status | `AUTH-01` implemented and sufficient for the Login screen's own request/response contract. Authenticated identity bootstrap (G-01) and the invalid-token contract (G-03) are shared prerequisites gating the destination authenticated shell, not the Login screen's own contract. |
| Candidate frontend phase | Phase 0.5 Auth; G-01/G-03 gate the post-login authenticated shell, not the Login form itself. |
| Blocker / gap | None specific to this screen's own contract. G-01/G-03 are shared sequencing prerequisites for the authenticated session the login redirects into. |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop + responsive mobile adaptation | `login_llhelper` | `a7a9bbf0f06b4ce4823a38fd35ac0849` | None; responsive mobile must reuse this visual language. | **ready** |

### 5.2 Register

| Field | Mapping |
|---|---|
| Product surface | Register |
| Candidate route | `/register` |
| Auth | Public registration; returned JWT is insufficient for authenticated domain work until a `User` profile exists. |
| Domain owner | Auth → onboarding/profile |
| Endpoint | `AUTH-02` — `POST /api/v1/auth/register`; required follow-up capability currently `USER-01` — `POST /api/v1/users`. |
| Request / response DTO | `RegisterRequest {email,password}` → `AuthResponse {accessToken}`; follow-up `CreateUserRequest` → `UserResponse`. |
| Errors | Register: 400, 409 email taken, 429. Profile creation: 400, 404 AuthUser, 409 user/username conflict; shared JWT errors. |
| Loading / error / empty | Submit loading; field validation; email-conflict and rate-limit messages. Empty not applicable. Missing canonical profile-setup validation/conflict/submitting references. *(Historical Phase 0.4B finding; references now exist — see §0.5.)* |
| Backend status | `AUTH-02` partial; `USER-01` implemented but no accepted orchestration. |
| Candidate frontend phase | Phase 0.5 Auth/Onboarding after 0.4C selects the flow and Stitch adds Complete Profile references. *(Historical sequencing condition satisfied; see §0.5.)* |
| Blocker / gap | G-02; G-01; G-03. The canonical Register form does not collect `CreateUserRequest` fields. |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop + responsive mobile adaptation | `register_llhelper_refined` | `b8c691aab5f94c62854de10febfc4a1f` | None; responsive mobile must reuse this visual language. | **blocked** |

### 5.3 Learning dashboard

| Field | Mapping |
|---|---|
| Product surface | My Decks — Learning list/dashboard |
| Candidate route | `/learning` |
| Auth | JWT |
| Domain owner | Learning (`UserDeckProgress` collection), not content ownership |
| Endpoint | `LEARN-05 GET /api/v1/learning/decks` |
| Request / response DTO | No request body. `List<LearningDeckResponse>`: `deckId`, `title`, `sourceLanguage`, `targetLanguage`, `enrolledAt`, nullable `lastStudiedAt`, `progress { masteredCount, totalCount }`. |
| Errors | Shared JWT `401`; page-level `5xx`. Successful empty state is `200 []`. |
| Loading / error / empty | Canonical loading, API-error, and empty states exist on both platforms. Empty means no enrolled decks, not no created decks. |
| Backend status | Implemented (LEARN-05; G-06 resolved). |
| Candidate frontend phase | After Auth/onboarding, per accepted Phase 0.5 order. |
| Blocker / gap | No screen-specific backend blocker remains; shared Auth/onboarding prerequisites still apply. |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop | `learning_llhelper_refined_navigation` | `0cb72b02b5db416ea2f8e5b6b33a03cb` | loading `1e7961cc60a04ae38b3caa66ffff0c36`; API error `0189efb46e3e43b8b507897f1ed95c04`; empty `7b1ecb8bc1644f8e727449c11e566e` | **ready** |
| Mobile | `learning_mobile_dashboard` | `48477ef15ed64daeb0bf12cb3d8f8fcf` | loading `4e1f1dd85a7241f8b203043770210d24`; API error `bf694bc2ed3e41c599becdd220607d18`; empty `a887cc6f03dd4b6699e58ba76658270f` | **ready** |

**Implemented DTO mapping** (`learning_llhelper_refined_navigation` and `learning_mobile_dashboard` show a Continue/Start highlight plus a Learning Decks list):

| Field | Status | Note |
|---|---|---|
| `deckId`, `title` | Existing (`Deck`) | Already returned by `DeckListResponse`/`DeckResponse`. |
| `sourceLanguage`, `targetLanguage` | Existing (`Deck`) | Already returned by `DeckListResponse`. |
| Per-deck aggregate learning progress | Implemented | LEARN-05 returns `progress.masteredCount` and `progress.totalCount`, aggregated server-side in one batch read. |
| "Continue Learning" / "Start Learning" highlight selection | Implemented contract | Response order is authoritative: studied decks first by `lastStudiedAt DESC`; if none has been studied, the newest `enrolledAt` is first. The UI labels a first item with non-null `lastStudiedAt` as Continue Learning, otherwise Start Learning. |
| Ratings/likes/popularity/follower badges | Not in MVP | Not present on the canonical screen; must not be added. |

Implemented response: `List<{deckId, title, sourceLanguage, targetLanguage, enrolledAt, lastStudiedAt, progress: {masteredCount, totalCount}}>`. Only `ACTIVE` enrollments are returned; `id ASC` is the deterministic final tie-breaker.

### 5.4 Created Decks

| Field | Mapping |
|---|---|
| Product surface | My Decks — Created list |
| Candidate route | `/created` |
| Auth | JWT |
| Domain owner | Deck content ownership |
| Endpoint | Missing owner-scoped list. `DECK-03 GET /api/v1/decks` is globally unfiltered and prohibited for this use. |
| Request / response DTO | Required owner-scoped list request/response not defined. Existing unsafe response is `List<DeckListResponse>`. |
| Errors | Cannot finalize until endpoint exists; must cover shared JWT, 5xx, and any future query validation. |
| Loading / error / empty | Desktop has API-error and empty; mobile has loading, API-error, empty. Desktop loading uses the shared `Skeleton` pattern because no dedicated state reference exists. |
| Backend status | Missing safe contract; existing `DECK-03` partial/unsafe (G-04). |
| Candidate frontend phase | After Auth, `GET /api/v1/users/me`, and owner-scoped backend contract. |
| Blocker / gap | Client filtering is a privacy leak. Current-user identity is also missing (G-01). |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop | `created_decks_llhelper_refined_mvp` | `9ed6baf88f8748c68dee4082ec6a5c31` | API error `c12fdcbaff4e4a8bb5cab608841fdc5e`; empty `6ef12dc0e96d4ac4acc333c420481898`; no dedicated loading reference | **blocked** |
| Mobile | `created_decks_mobile_with_bottom_nav` | `2588b0e2fa8c4bdc9eb27bb0462d8856` | loading `c4fcfe553ca4466db388967a669ba494`; API error `b909ce2e83cc473d8e0565b18c194ece`; empty `4ac98a6a78fa442193a1da411859ade7` | **blocked** |

**Missing DTO — minimal required shape** (read-only review of `created_decks_llhelper_refined_mvp` and `created_decks_mobile_with_bottom_nav`, which show only deck titles plus a "Create New Deck" action):

| Field | Status | Note |
|---|---|---|
| `id`, `title`, `description`, `sourceLanguage`, `targetLanguage`, `isPublic`, `owner` | Existing (`DeckListResponse`) | No new response field needed. |
| Owner-scoped filter (only the current user's decks) | Missing | No query param or endpoint filters by owner; `DECK-03` returns every deck to every authenticated user (G-04). |
| Per-deck card count | Unresolved | `DeckListResponse` already carries a known `// FIXME: add cardCount` backend gap; whether the canonical screen requires a visible count could not be confirmed from the extracted screen text alone. |

Minimal required response: `List<DeckListResponse>` reused as-is, behind a new owner-scoped query (e.g. `GET /api/v1/decks?owner=me` or `GET /api/v1/decks/mine`), which also requires resolving current-user identity server-side (G-01). No new response fields are required.

### 5.5 Create Deck

| Field | Mapping |
|---|---|
| Product surface | Create Deck |
| Candidate route | `/decks/new` |
| Auth | JWT; requires an existing `User` profile. |
| Domain owner | Deck content ownership |
| Endpoint | `DECK-01` — `POST /api/v1/decks` |
| Request / response DTO | `DeckRequest {title,description,sourceLanguage,targetLanguage,isPublic}` → `DeckResponse` with `cards`. UI `isPrivate` must invert to `isPublic` (G-11). |
| Errors | 400 validation/malformed body; 404 current User absent; 429; shared JWT; catch-all 500. |
| Loading / error / empty | Submitting state; field validation; submission error. Empty not applicable. Desktop has validation/submission references; mobile uses the same semantic patterns without dedicated variants. |
| Backend status | `DECK-01` implemented and sufficient for the screen's own contract. The new-user prerequisite (G-01/G-02) is a shared sequencing blocker on when Create Deck can be reached with a valid session, not a gap in the Create Deck contract itself. |
| Candidate frontend phase | After Auth/Onboarding (sequencing only), before Created list UI if direct post-create navigation is accepted. |
| Blocker / gap | None specific to this screen's own contract. G-01/G-02/G-03 are shared sequencing prerequisites; G-11 is a required mapping, not a blocker. |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop | `create_deck_llhelper` | `316d55fea52c4c0c9dd310cd3d503d04` | validation `22e2d42dcc26455784ceb583e30aea30`; submission error `e6d5d6fdb3ed40cda47504e1621e95ff`; submitting uses button loading | **ready** |
| Mobile | `create_deck_refined_mobile_state` | `5240c4fae5304c46ab191e32263c8bc8` | No dedicated variants; use canonical form semantics. | **ready** |

### 5.6 Edit Deck

| Field | Mapping |
|---|---|
| Product surface | Edit Deck |
| Candidate route | `/decks/:deckId/edit` |
| Auth | JWT; owner-only mutation |
| Domain owner | Deck content ownership |
| Endpoint | Prefill `DECK-02 GET /api/v1/decks/{id}`; submit `DECK-04 PUT /api/v1/decks/{id}`; optional delete `DECK-05 DELETE /api/v1/decks/{id}`. |
| Request / response DTO | Prefill `DeckResponse`; update `DeckRequest` → `DeckResponse`; delete → no content. Apply G-11 inversion. |
| Errors | Prefill 404 plus G-05 visibility gap; update 400/403/404/429; delete 403/404/429; shared JWT. |
| Loading / error / empty | Initial prefill loading; load error; field validation; submitting/submission error; destructive confirmation/delete error. Empty not applicable. No dedicated canonical state variants. |
| Backend status | Mutations implemented; read contract partial (G-05). |
| Candidate frontend phase | Content management after Auth and security read fix. |
| Blocker / gap | Owner edit can mutate safely, but prefill read is not an owner-scoped trust boundary and navigation from Created is blocked by G-04. |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop | `edit_deck_llhelper_refined_1` | `b4ba921c83ff451093153a41164070ab` | None; use shared skeleton/form/error/dialog patterns. | **partial** |
| Mobile | `edit_deck_refined_mobile_state` | `09f1d4e790ea4296938b95b95372a884` | None; use shared skeleton/form/error/dialog patterns. | **partial** |

### 5.7 Deck Details — Owner

| Field | Mapping |
|---|---|
| Product surface | Owner Deck Details and card inventory; no learning progress |
| Candidate route | `/decks/:deckId/manage` |
| Auth | JWT; intended for owner |
| Domain owner | Deck/Card content ownership |
| Endpoint | `DECK-02 GET /api/v1/decks/{id}` supplies deck plus `CardResponse[]`; mutations link to `DECK-04/05` and `CARD-05/06`. Do not use `CARD-04` or learning `LEARN-03` for owner inventory. |
| Request / response DTO | `DeckResponse {…,owner,isPublic,cards: CardResponse[]}`; mutations use `DeckRequest`/`CardRequest`. |
| Errors | Load 404 plus shared JWT and G-05; mutations 400/403/404/429. |
| Loading / error / empty | Canonical loading, API-error, and empty-card-inventory states exist on both platforms. |
| Backend status | Detail read partial; owner mutations implemented. |
| Candidate frontend phase | Content management after Auth; safe navigation depends on Created contract. |
| Blocker / gap | Contract contains the needed owner card list, but read lacks visibility enforcement and the frontend cannot establish owner identity without G-01. |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop | `deck_details_owner_llhelper_refined` | `b713dd7ed4ae482ba0d1dddc4b91c31f` | loading `6824accdee2b4c318950af1d2ead2e52`; API error `7f45c3d2132046b39ecfff39a892d786`; empty `2a52cd2db39445bcb9d7662e75fa8226` | **partial** |
| Mobile | `deck_details_owner_mobile_2` | `ccdfafe064aa4365ba041ed02607151b` | loading `3fd36bb548eb463c8c3d55aa9af7cedf`; API error `350c42b842964c4fa6748332714a62d6`; empty `3487d49d5ba7464484f4891eec8c1c8e` | **partial** |

### 5.8 Deck Details — Public

| Field | Mapping |
|---|---|
| Product surface | Public Deck Details and enroll action; no learning progress |
| Route (**accepted, Phase 0.4C** — supersedes the `/discover/decks/:deckId` candidate below) | `/decks/:deckId` — reachable only by direct link since Discover is deferred; no dedicated navigation action from Owner Deck Details is required. Still a JWT-protected frontend route; "Public" names the product surface (public deck), not anonymous HTTP access. |
| Auth | JWT under current backend; enroll requires JWT. |
| Domain owner | Public Deck content + Learning enrollment boundary |
| Endpoint | Detail `DECK-02 GET /api/v1/decks/{id}`; enroll `LEARN-01 POST /api/v1/decks/{deckId}/enroll`. |
| Request / response DTO | Detail `DeckResponse`; enroll has no body and returns `EnrollResponse {userDeckId}`. |
| Errors | Detail 404 but lacks private visibility enforcement; enroll 403 private, 404 deck, 409 already enrolled; shared JWT. **Private decks cannot be enrolled by any user under current `LEARN-01`** — `LearningServiceImpl.enrollDeck()` checks `isPublic` only and rejects with 403; there is no owner-bypass or auto-enroll path. |
| Loading / error / empty | Detail loading; page API error; empty card inventory; enroll-button loading and inline 403/409/5xx feedback. No dedicated state variants. |
| Backend status | Enroll implemented; detail read partial (G-05 — not a vertical-implementation necessity for a single user viewing their own deck, but a required release/security blocker before public-facing exposure, see §0.4); safe discovery entry point missing (G-04, deferred — not required for the accepted direct-link-only MVP flow). |
| Accepted frontend phase (Phase 0.4C) | Included in Level 1 MVP; see §0.1/§0.3. The accepted Level 1 flow uses the direct URL; no Owner Deck Details shortcut is required. |
| Blocker / gap | Vertical: none blocking (owner viewing/enrolling their own deck works against current endpoints). Release/security: G-05 (full private-deck/card visibility enforcement) and G-04 (unfiltered `GET /decks`, not used by this screen but a standing exposure) must be closed before public deployment. |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop | `deck_details_public_llhelper_refined` | `90c46e8a1e2946ad84fa8cffd3ecc210` | None; use shared skeleton/page-state/inline-error patterns. | **partial (accepted Level 1 MVP — see §0; direct-link-only, `blocked`-on-Discover superseded)** |
| Mobile | `deck_details_public_mobile_refined` | `06388e7896124660b6830e9291cb9f74` | None; use shared skeleton/page-state/inline-error patterns. | **partial (accepted Level 1 MVP — see §0; direct-link-only, `blocked`-on-Discover superseded)** |

### 5.9 Learning Deck Details

| Field | Mapping |
|---|---|
| Product surface | Enrolled deck details with per-card learning progress |
| Candidate route | `/learning/:deckId` |
| Auth | JWT + existing enrollment |
| Domain owner | Learning (`UserDeckProgress`/`UserCardProgress`) |
| Endpoint | Cards/progress `LEARN-03 GET /api/v1/decks/{deckId}/cards`; optional metadata `DECK-02 GET /api/v1/decks/{id}`. |
| Request / response DTO | `List<DeckCardResponse {id,title,definition,synonyms,examples,translation,progress}>`; metadata `DeckResponse`. |
| Errors | 409 not enrolled (not 403; G-12), shared JWT, possible 404 for optional metadata. |
| Loading / error / empty | Initial skeleton; page API error; empty cards state. No dedicated variants; use shared patterns without borrowing Owner details' learning-free content semantics. |
| Backend status | `LEARN-03` implemented; list navigation source implemented separately as LEARN-05 (G-06 resolved). |
| Candidate frontend phase | Learning flow after Auth and Learning dashboard contract. |
| Blocker / gap | Screen-specific data contract and reachability source are sufficient; shared Auth/onboarding prerequisites still apply. |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop | `learning_deck_details_llhelper_refined` | `3386e5e8e70b4cdbb18051e660b3da83` | None; use shared learning-aware skeleton/page states. | **ready** |
| Mobile | `learning_deck_details_mobile_refined_2` | `cac865fc9ea94e2abcad0a2af3ac0922` | None; use shared learning-aware skeleton/page states. | **ready** |

### 5.10 Add / Edit Card

| Field | Mapping |
|---|---|
| Product surface | Manual Add Card, Edit Card, and optional AI generation |
| Candidate route | Add `/decks/:deckId/cards/new`; edit `/decks/:deckId/cards/:cardId/edit` |
| Auth | JWT; deck-owner mutation |
| Domain owner | Card content; AI generation is backend-owned |
| Endpoint | Add/manual or single AI `CARD-01 POST /api/v1/cards`; edit prefill `CARD-03 GET /api/v1/cards/{id}`; update `CARD-05 PUT`; optional delete `CARD-06 DELETE`; bulk AI `CARD-02 POST /api/v1/cards/bulk-generate`. |
| Request / response DTO | `CardRequest` → `CardResponse`; bulk `BulkCardGenerateRequest` → `List<CardResponse>` successes only. |
| Errors | 400/403/404/429; AI 503; edit prefill has G-05; shared JWT. Bulk partial failures are not represented (G-09). |
| Loading / error / empty | Form submit/validation/submission errors; AI loading/error; edit prefill loading/error; empty not applicable. Desktop has all form/AI variants; mobile Add has none. |
| Backend status | Manual create/update/delete implemented; edit read partial; bulk response partial. |
| Candidate frontend phase | Manual Cards immediately after Create/Owner Details; AI enhancement after manual flow. |
| Blocker / gap | Desktop reference spans modes with different readiness. AI partial-failure UX cannot be truthful; card read needs visibility enforcement. |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop Add/Edit/AI | `add_edit_card_llhelper_refined` | `3166a46c0529467f972671db8357463c` | AI loading `2260370d74d94d279e5662f4fdccede6`; AI error `64cf5e689b9a4566b8f4376bc9102bfd`; submission error `e6d7a5851d2947ca96c41481becd0f0f`; validation `7f79f0550f2041ff815c9604dabb44f5` | **partial** |
| Mobile Add only | `add_card_mobile` | `87e6c8d854a34b95829ea88d11997d2d` | None; use shared form patterns. Non-canonical `1f9f…` must not be used. | **ready** |

**Operation-level breakdown** (the desktop reference spans all of these; readiness differs per operation):

| Operation | Endpoint | Backend status | Blocker / gap | MVP readiness |
|---|---|---|---|---|
| Manual add | `CARD-01 POST /api/v1/cards` (`autoGenerate` omitted/false) | implemented | None | Ready |
| Edit prefill | `CARD-03 GET /api/v1/cards/{id}` | partial | No ownership/deck-visibility check (G-05) | Partial |
| Manual update | `CARD-05 PUT /api/v1/cards/{id}` | implemented | None | Ready |
| Manual delete | `CARD-06 DELETE /api/v1/cards/{id}` | implemented | None | Ready |
| Single-card AI generation | `CARD-01 POST /api/v1/cards` (`autoGenerate: true`) | implemented | Shared AI 429/503 errors only | Ready |
| Bulk AI generation | `CARD-02 POST /api/v1/cards/bulk-generate` | partial | Response returns successful cards only; failed titles/reasons are lost (G-09) | Partial (partial-failure UX not truthful) |

The canonical desktop reference stays `partial` at the reference level because it spans mixed-readiness operations. Phase 0.4C may split the runtime implementation so manual add/update/delete and single-card AI ship as part of the manual Cards MVP, while bulk AI partial-failure UX is deferred separately without blocking the rest of this reference.

### 5.11 Study

| Field | Mapping |
|---|---|
| Product surface | Study session, answer review, all-caught-up, session complete |
| Candidate route | `/study/:deckId`; `/study` entry behavior requires 0.4C decision |
| Auth | JWT + enrollment |
| Domain owner | Learning |
| Endpoint | Load `LEARN-02 GET /api/v1/decks/{deckId}/study/cards`; submit `LEARN-04 POST /api/v1/cards/{cardId}/review`. |
| Request / response DTO | Load `List<DeckCardResponse>`; submit `CardReviewRequest {userAnswer}` → `CardReviewResponse {correct,correctAnswer,status,correctStreak,totalCorrect}`. |
| Errors | Load/review 409 not enrolled; review 400/404; shared JWT. Answer correctness must come only from response. |
| Loading / error / empty | Canonical loading, API-error, all-caught-up, and session-complete states on both platforms. Empty study response maps to all-caught-up only after G-08 is fixed. |
| Backend status | Review implemented; study selection partial (G-08). |
| Candidate frontend phase | After enrollment and Learning Deck Details; before aggregate Progress UI. |
| Blocker / gap | Current selection omits `REVIEWING`, so all-caught-up can be false and core spaced-practice behavior is incomplete. |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop | `study_english_b1_llhelper_refined` | `28d18c4a73b547fb92fc949a6bc5d4a8` | loading `b21ae87df0b646bc90ca84af7888d97e`; API error `a031c3ee82f1463f8aa29b77a7d3d96b`; caught up `82a546b4a81049b9b92d144a0e00ba1c`; complete `b1b0f012a4e142de90776804ae47f022` | **partial** |
| Mobile | `study_english_b1_mobile` | `32b53362748742a19dfc7b4cc15b1a97` | loading `2894882fd954456a8ffc5eda7e95fe65`; API error `b5f6562b8ff3464b8d1bd25f0390f510`; caught up `6d42f1332a8b409cb376c7b81cc6f4e8`; complete `ae6e28fd937b4d2e8bf96fa1d7098745` | **partial** |

### 5.12 Discover

| Field | Mapping |
|---|---|
| Product surface | Discover public decks/search |
| Candidate route | `/discover` |
| Auth | JWT under current backend |
| Domain owner | Public Deck content discovery |
| Endpoint | Missing public-only list/search contract. `DECK-03 GET /api/v1/decks` is globally unfiltered and prohibited. |
| Request / response DTO | Required public-list query/response not defined. Existing unsafe response is `List<DeckListResponse>` with no search/sort/pagination parameters. |
| Errors | Cannot finalize until endpoint exists; must include shared JWT, query validation if added, and page-level 5xx. |
| Loading / error / empty | Canonical loading, API-error, and no-results/empty states on both platforms. No-results must be driven by server-safe public results, not client filtering. |
| Backend status | Missing safe contract; `DECK-03` partial/unsafe (G-04), detail security also G-05. |
| Candidate frontend phase | After public-only contract and private read protection. |
| Blocker / gap | Implementing against `GET /decks` would expose private decks. No search contract exists. |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop | `discover_llhelper_refined` | `97b05b9f24f84410845beb00803e26df` | loading `5a3ee7028bcb4b7d9b8d3ecebfa41231`; API error `7d6fc47e2a4d487789efb22fe6ba0009`; empty/no results `c93b42eb746249e3b5f06cd7d2ec47e6` | **blocked** |
| Mobile | `discover_mobile` | `9aaf765ffdfb4a0595da18e8c28d0bb6` | loading `6ab80ffecc5d40c6ac73f3684a6f764b`; API error `f87fd1a533a4495194720d6d3a3d065a`; empty/no results `6332e210465d47d58f011bc22a663d72` | **blocked** |

**Missing DTO — minimal required shape** (read-only review of `discover_llhelper_refined`, which lists per-deck title, source/target language, card count, owner `@username`, a `Public` badge, and an `Enrolled` badge on at least one card):

| Field | Status | Note |
|---|---|---|
| `id`, `title`, `sourceLanguage`, `targetLanguage`, `owner.username`, `owner.avatarUrl` | Existing (`DeckListResponse`) | `owner` is already a nested `UserResponse` carrying `username`/`avatarUrl`. |
| Public-only filter | Missing | No query/endpoint returns only `isPublic=true` decks; `DECK-03` is unfiltered (G-04). |
| `cardCount` per deck | Missing | Canonical UI displays a card count per deck (e.g. "842 Cards"). `DeckListResponse` has the known `// FIXME: add cardCount` gap; not implemented anywhere. Required in the minimal response shape. |
| `isEnrolled` per deck | Missing | Canonical UI shows an `Enrolled` badge on at least one deck. Requires cross-referencing each public deck against the current user's `UserDeckProgress`; no endpoint returns this combined shape today. This reflects the existing enrollment domain (not a social feature), but the join does not exist. Required in the minimal response shape. |
| Search/sort/language-filter controls | Unresolved | Not confirmed as an interactive control from the extracted screen content; do not invent a search/pagination contract on this basis alone. |

Minimal required response: `List<DeckListResponse & {cardCount, isEnrolled}>`, behind a new public-only query (e.g. `GET /api/v1/decks?public=true`). `cardCount` requires resolving the existing `DeckListResponse` FIXME; `isEnrolled` requires a per-user join against `UserDeckProgress` for each returned deck — both are concrete required fields, not open design questions. Ratings/likes/popularity sort remain explicitly out of scope per `DESIGN.md`.

### 5.13 Creator Profile

| Field | Mapping |
|---|---|
| Product surface | Creator profile plus that creator's public decks; no social/follow behavior |
| Candidate route | `/creators/:username` |
| Auth | JWT under current backend |
| Domain owner | User profile + public Deck content |
| Endpoint | Profile `USER-03 GET /api/v1/users/username/{username}`; creator-public-decks endpoint missing. |
| Request / response DTO | Profile `UserResponse`; creator deck list DTO/query missing. Existing `DECK-03` is prohibited. |
| Errors | Profile 404 plus shared JWT; future collection errors unknown. |
| Loading / error / empty | Profile loading/error; creator-decks loading/error/empty. No canonical state variants. Follow/follower states are explicitly excluded. |
| Backend status | Profile lookup implemented; required creator deck collection missing (G-10) and affected by G-04/G-05. |
| Candidate frontend phase | Candidate post-MVP deferral as of Phase 0.4B. *(Historical — §0.1/§0.2 has since confirmed Creator Profile as deferred.)* |
| Blocker / gap | The visual surface cannot be completed with public creator decks. If kept in MVP, it becomes blocked rather than deferred. |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop | `creator_profile_llhelper_refined` | `8df316a65ffe4ed9b54799830d854dad` | None; use shared page/list states. | **deferred** |
| Mobile | `creator_profile_mobile` | `87d2a4d2e36940c6b8fb7299259a23a4` | None; use shared page/list states. | **deferred** |

**Missing DTO — minimal required shape, for Phase 0.4C reference only; does not change the `deferred` status** (read-only review of `creator_profile_llhelper_refined`, which shows the creator's `@username` and a "Public Decks" count plus per-deck language pair, card count, and a `Public` badge):

| Field | Status | Note |
|---|---|---|
| Creator profile (`username`, name, avatar) | Existing (`UserResponse` via `USER-03`) | No new field needed. |
| Creator's public deck list (`id`, `title`, `sourceLanguage`, `targetLanguage`) | Missing | No endpoint filters decks by a given owner plus `isPublic=true` (G-10); would reuse `DeckListResponse` fields. |
| `cardCount` per deck | Missing | Canonical UI shows a per-deck card count (e.g. "1,250 Cards"). Same `// FIXME: add cardCount` gap as Discover/Created Decks — not implemented anywhere. |
| Follow/follower counts, social behavior | Excluded | Forbidden per `DESIGN.md`; must not be added regardless of the 0.4C MVP decision. |

Minimal required response if this surface enters MVP: existing `UserResponse` + `List<DeckListResponse & {cardCount}>`, behind a creator-scoped and public-only query. This sketch does not resolve the `deferred` status. *(Historical — §0.1/§0.2 has since confirmed Creator Profile remains deferred, not entering MVP.)*

### 5.14 Progress

| Field | Mapping |
|---|---|
| Product surface | Aggregate Learning Progress |
| Candidate route | `/progress` |
| Auth | JWT |
| Domain owner | Learning aggregate |
| Endpoint | Missing aggregate Progress contract. `LEARN-03` is one enrolled deck at a time and is not a safe substitute for a user-wide aggregate. |
| Request / response DTO | Missing aggregate response DTO. Required dimensions must be confirmed from the canonical UI during backend contract design; frontend must not compute unsupported totals from inaccessible lists. |
| Errors | Cannot finalize until endpoint exists; must cover shared JWT and page-level 5xx. |
| Loading / error / empty | Canonical loading, API-error, and empty states on both platforms. Empty means no learning progress/enrollments. |
| Backend status | Missing (G-07). |
| Candidate frontend phase | After Study persistence and aggregate backend contract. |
| Blocker / gap | No endpoint can populate the surface; client-side aggregate is unavailable and would create multiple-source consistency problems. |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop | `learning_progress_llhelper_mvp` | `e13aff5d17fc4a1e8fece209220f277f` | loading `497786dcf61d42fe81c04e706284646c`; API error `b31bc072d6d34cc8bf38b8669cf1c9dd`; empty `4c31e4fbed824d3e972ed3ef6ee6c792` | **blocked** |
| Mobile | `learning_progress_mobile_2` | `786fef679a554769bdf277a497e261c9` | loading `0e6da83508d24bf9a569afe4b85bf2e5`; API error `61efdd5100f7452eab64285063da4702`; empty `0579e6f9cf6a4646b07247abe3b2dbc5` | **blocked** |

**Missing DTO — minimal required shape** (re-checked read-only review of `learning_progress_llhelper_mvp`; canonical page subtitle is "Overview of your current learning status and card distribution", with a "Progress by Deck" section below it):

| Field | Status | Note |
|---|---|---|
| Per-deck breakdown by `CardLearningStatus` (`NEW`/`LEARNING`/`REVIEWING`/`MASTERED` counts) | Existing data, missing aggregate | Confirmed required by the page subtitle ("current learning status and card distribution") plus the "Progress by Deck" heading. `CardLearningStatus` and per-card progress already exist on `UserCardProgress`/`DeckCardResponse.CardProgressInfo`; no endpoint aggregates them per deck or per user. |
| Deck identity per row (`deckId`, `title`, `sourceLanguage`, `targetLanguage`) | Existing (`Deck`) | Reuse existing deck fields; required to label each "Progress by Deck" row. |
| Any single top-line aggregate percentage, streak summary, or other numeric/graphical widget beyond the per-status counts above | Excluded pending 0.4C at the time of Phase 0.4B | The canonical screenshot's exact rendered numbers/percentages/charts could not be read in this text-based review (image fetch of the canonical screenshot returned `403 Forbidden` when re-checked); they must not be assumed or invented. 0.4C must either (a) confirm these are computed client-side from the per-status counts above, with no new backend field, or (b) specify additional named fields after a proper visual design review — no such field is included in the minimal required response until then. *(Historical — §0.8 has since confirmed option (a): client-side, display-only, no new backend field for Level 1.)* |

Minimal required response: `List<{deckId, title, sourceLanguage, targetLanguage, cardsByStatus: {new, learning, reviewing, mastered}, totalCards}>`, aggregated server-side from existing `UserCardProgress` rows. No new domain concept is introduced; this is a new aggregation endpoint over existing data. Any additional summary/percentage widget beyond this is explicitly deferred to 0.4C per the row above.

## 6. Phase 0.4C decision queue — resolved

This queue was open as of Phase 0.4B. All seven items are now resolved by §0 — either accepted as a decision or resolved by explicit deferral (item 4 mixes both); each row below points to where.

1. ~~Confirm the MVP surfaces and whether Creator Profile remains deferred.~~ Resolved — §0.1/§0.2 (Creator Profile deferred).
2. ~~Accept the separate `/onboarding/profile` flow ... and add its canonical Stitch references.~~ Resolved — flow accepted in §0.3/§0.7 and canonical references completed in §0.5.
3. ~~Approve the exact route map, including owner/public detail separation and `/study` entry behavior.~~ Resolved — §0.3 (`/decks/:deckId` public, `/decks/:deckId/manage` owner, `/study/:deckId` contextual only).
4. ~~Define the response shapes for current user, Created, Discover, Learning list, Progress aggregate, and optionally creator-public-decks.~~ Resolved: current-user (`GET /api/v1/users/me`, §0.7) and Progress (§0.8, frontend-derived, no new DTO for Level 1) have accepted semantics. Created, Discover, Progress-aggregate, and creator-public-decks response shapes are **resolved by explicit deferral; shape intentionally not accepted** (§0.2) — no accepted MVP flow needs them, so no shape is defined.
5. ~~Confirm private-deck/card read protection as a release blocker.~~ Resolved — §0.4 (G-05 is a release/security blocker; not a vertical-implementation blocker).
6. ~~Decide whether AI generation ships with manual Cards MVP or follows after a truthful partial-failure contract.~~ Resolved — §0.1/§0.2/§0.6: manual Add Card is the Level 1 requirement; single-card AI is a separate optional task after manual smoke; bulk AI remains deferred pending the partial-failure contract.
7. ~~Order backend → Stitch → frontend work and update roadmap/current sprint before Phase 0.5 runtime implementation.~~ Resolved — §0.6, and reflected in `docs/roadmap/current-sprint.md`.

## 7. Phase 0.4B conclusion (historical, superseded by §0)

> This section is the historical Phase 0.4B result, preserved as-read and not rewritten (see header note). Its counts and evidence below are historical and unchanged. Where it calls for a future decision (e.g. "Phase 0.4C must..."), that decision has since been made in §0 — this section is not the current target.

- All **26** canonical references are mapped: 14 desktop and 12 mobile.
- Using contract-local semantics (§2), the map now identifies **8 ready**, **7 partial**, **9 blocked**, and **2 deferred** references after G-06 resolution.
- For the five surfaces with no backend contract at all (Learning dashboard, Created Decks, Discover, Creator Profile, Progress), read-only review of the canonical Stitch base screens produced minimal required request/response field sketches (§5.3, §5.4, §5.12–§5.14), explicitly separating fields that already exist on current DTOs from fields that are missing or unresolved. No social/ratings/likes/popularity/bookmark/follower/pagination contract was invented.
- The Add/Edit Card reference (§5.10) is split into six operations; manual add/update/delete and single-card AI are independently `Ready`, edit prefill and bulk AI remain `Partial` for their own reasons (G-05, G-09).
- No existing endpoint, DTO, route, Stitch screen, or runtime implementation was changed.
- The remaining highest-impact blockers are unfinished Auth/profile UI orchestration (G-02), private-data exposure/list scoping (G-04–G-05), the deferred aggregate Progress contract (G-07), and Study selection correctness (G-08). G-01, G-03, and G-06 are resolved.
- Phase 0.4C must turn the candidate routes/phases, provisional deferral, and the missing-DTO sketches above into accepted product, backend, and execution decisions before Phase 0.5 begins. *(Historical requirement — already fulfilled by §0.)*
