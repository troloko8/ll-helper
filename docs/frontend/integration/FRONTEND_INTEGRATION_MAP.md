# Frontend Integration Map — Phase 0.4B (historical) + Phase 0.4C (accepted decisions)

> **Purpose:** screen-by-screen map from the canonical Stitch references to frontend routes and the backend contracts they require.
> **Scope:** documentation and analysis only. Phase 0.4C does not change backend behavior, DTOs, Stitch screens, routes, or frontend runtime code — it only records accepted product/routing decisions on top of the Phase 0.4B read-only snapshot below.
> **Phase 0.4B date:** 2026-08-23 (repository baseline: `master` after commit `758a565`). **§2–§7 below are preserved as the historical Phase 0.4B result and are not rewritten**, except where a specific field is explicitly superseded by an accepted §0 decision (marked inline, e.g. the `/decks/:deckId` route replacing the `/discover/decks/:deckId` candidate).
> **Phase 0.4C date:** 2026-08-24. §0 records the accepted Level 1 vertical MVP decisions; where §0 and §2–§7 disagree, §0 governs.
> **User-requested scope revision (2026-09-20; ordering revised 2026-10-08):** §0.10 supersedes the original Created/Discover deferral and direct-link-only product path. The resulting Level 1 UI and DTOs are implemented; completion evidence belongs to `docs/roadmap/changelog.md`. The active Full Frontend scope belongs to `docs/roadmap/current-sprint.md`; public deployment remains a later optional release gate.

## 0. Phase 0.4C accepted decisions

This section supersedes the "candidate, not accepted" status stated in §1 item 5 for the routes/surfaces listed below. It does not change Stitch, `MANIFEST.md`, backend code, or frontend code.

### 0.1 Accepted Level 1 MVP surfaces

Login, Register, Complete Profile, Learning list, Created Decks list, Create Deck, Owner Deck Details, Manual Add Card, Discover public list, Public Deck Details + Enroll, Learning Deck Details, Study, and a visible local Logout action. Created/Discover/Logout UI completion is governed by §0.10.

### 0.2 Accepted deferred surfaces/functions

Discover search/filter/sort/load-more; Creator Profile; aggregate Progress dashboard; Edit Deck; read-only Card Details and Edit Card (implemented together with the full Card Editor in Sprint 1.1 — Full Frontend); bulk AI generation; advanced AI partial-failure UX; pagination; refresh token; backend logout; social/ratings/likes/bookmarks. Single-card AI remains optional and cannot substitute for manual-card acceptance; runtime status belongs to the current sprint. Basic Created and Discover lists are now in scope (§0.10).

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
| `/decks/:deckId` | accepted (**replaces `/discover/decks/:deckId` candidate in §5.8**) | `deck_details_public_llhelper_refined` | JWT-protected Public Deck Details; Discover now provides the implemented collection entry, while direct links remain valid. |
| `/decks/:deckId/manage` | accepted | `deck_details_owner_llhelper_refined` | Owner Deck Details |
| `/decks/:deckId/cards/new` | accepted | `add_edit_card_llhelper_refined` (manual portion) / `add_card_mobile` | Manual Add Card only; single-card AI is a separate optional task (§0.2) |
| `/decks/:deckId/cards/:cardId` | accepted, implementation deferred | `card_details_owner` / responsive mobile adaptation | Owner Deck Details card → read-only Card Details → Edit; runtime ships with the full Card Editor in Sprint 1.1 — Full Frontend. |
| `/study/:deckId` | accepted | `study_english_b1_llhelper_refined` / mobile | reached contextually from Learning Deck Details or Start Learning on Public/Owner Deck Details; a deck-less `/study` is not needed at Level 1 |
| `/created` | implemented | `created_decks_llhelper_refined_mvp` / `created_decks_mobile_with_bottom_nav` | Desktop/mobile navigation → owned public/private decks → Owner Deck Details; §0.10 |
| `/discover` | implemented | `discover_llhelper_refined` / `discover_mobile` | Desktop/mobile shell → DECK-03 public decks → Public Deck Details; bounded list adaptation, §0.10. Enrollment reconciliation remains a follow-up. |
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
- [x] G-08 Study selection includes `REVIEWING` — implemented as `LEARNING` → `REVIEWING` → `NEW`, max 10, with `MASTERED` excluded.
- G-12 `docs/features/learning-flow.md` must reflect the actual 409 (done — see that file)

G-05 was **not** a vertical-implementation necessity for the local single-user smoke, but is now resolved: `GET /decks/{id}` and `GET /cards/{id}` share `DeckAccessPolicy`; public content and owner-private content return 200, while another user's private content returns controlled 403. Service and `@WebMvcTest` coverage protect the rule.

**Public deployment/security blockers** (not required for local vertical smoke; required before first public deployment):
- [x] G-04 resolved: `GET /api/v1/decks` is repository-filtered to public decks only.
- [x] `CARD-04` resolved: `GET /api/v1/cards` is repository-filtered to cards from public decks only (not "G-04 cards" — distinct endpoint, own inventory item).
- [x] G-05 private visibility protection for `GET /decks/{id}` and `GET /cards/{id}`
- [x] Catch-all `500` raw exception message leak resolved; safe response contract documented in inventory §7, verified by `CardControllerTest`.

**Deferred backend capabilities** (no accepted MVP flow depends on them):
- Discover search; aggregate Progress endpoint; creator-public-decks endpoint; bulk AI failed-titles response; pagination; refresh token; backend logout. Collection `cardCount`, public-list owner and `isEnrolled` are implemented. Replacing the full public-list `UserResponse owner` with a compact representation is a follow-up. DECK-06 supplies the owner-scoped base collection with `cardCount`.

### 0.5 Accepted Stitch/design follow-up

- [x] **Complete Profile** — canonical desktop base, mobile base, validation error, username conflict, and submitting references exist and are registered in `docs/frontend/DESIGN.md` and `docs/frontend/design-reference/MANIFEST.md`. Fields: `username, firstName, lastName, nativeLanguage, targetLanguage, uiLanguage` (matches existing `USER-01 CreateUserRequest`; `avatarUrl` excluded from the MVP form).
- [x] **Card Details — Owner** — accepted entry point is a card in Owner Deck Details; accepted read-only route is `/decks/:deckId/cards/:cardId`, and Edit continues to `/decks/:deckId/cards/:cardId/edit`. Its exact Stitch resource is owned by `design-reference/MANIFEST.md`; mobile is the documented responsive adaptation under the canonical `DESIGN.md` theme. Runtime remains deferred with the full Card Editor in Sprint 1.1 — Full Frontend.

### 0.6 Accepted backend → Stitch → frontend order

This section owns only the stable accepted sequence and dependency boundaries. Completed Level 1 evidence is owned by `docs/roadmap/changelog.md`; active executable checklists are owned by `docs/roadmap/current-sprint.md`. Do not copy progress markers into this section.

1. Backend vertical prerequisites: G-01, G-03, G-06, and G-08; readiness semantics remain in §0.4.
2. Backend security prerequisite: G-05 before public-facing exposure; release hardening later performs regression verification rather than redefining the rule.
3. Documentation prerequisite: G-12 keeps the learning-flow contract aligned with executable behavior.
4. Stitch prerequisite: Complete Profile desktop/mobile/base/error/submitting references registered through §0.5 and `MANIFEST.md`.
5. Frontend minimal UI/application-boundary foundation before feature components: canonical tokens/typography, form primitives and semantics, loading/error surfaces, responsive Auth/Onboarding base, global error boundary, bootstrap state, and not-found routing. Completed Sprint 1.0 evidence: `docs/roadmap/changelog.md`; canonical UI contract: `docs/frontend/DESIGN.md`.
6. Frontend Auth + onboarding: contract-first RTK Query integration, four-state session lifecycle (§0.7), route layouts/guards, cache-safe logout/401, and Login/Register/Complete Profile/Logout orchestration. Completed checklist and tests: `docs/roadmap/changelog.md`.
7. Reduced authenticated `AppShell` before Learning screens: only the accepted Level 1 navigation subset, with no deferred destinations or dead links. Completion evidence: `docs/roadmap/changelog.md`; shell scope: `docs/frontend/DESIGN.md`.
8. Frontend Learning list + Learning Deck Details.
9. Frontend Create Deck + Owner Deck Details.
10. Frontend Manual Add Card.
11. Frontend Public Deck Details + Enroll.
12. Frontend Study + per-card progress display (§0.8).
13. Close the UI reachability gaps under §0.10: validate manual creation → collection contracts → Created → Discover/Enroll → verify Study/progress → visible Logout/re-entry.
14. Manual end-to-end UI smoke, Postman verification, project AI workflow skill verification and sprint closure. Single-card AI is optional and does not replace manual-card verification.
15. Full Frontend: complete the deferred product routes and the contracts they require.
16. Optional release hardening and first public deployment only after Full Frontend and an explicit product decision.

### 0.7 Session state (accepted)

```text
type SessionStatus = 'initializing' | 'anonymous' | 'needsProfile' | 'authenticated'
```

Implemented `GET /api/v1/users/me` bootstrap semantics:
- `200 UserResponse` → valid JWT, profile exists → `authenticated`.
- `404 {message}` → valid JWT, profile does not exist → `needsProfile`. No separate machine-readable error code is required for Level 1: a 404 from `GET /api/v1/users/me` specifically is unambiguous.
- `401 {message}` → missing/invalid/expired JWT → `anonymous`.

The backend contract and frontend session lifecycle are implemented; completed live verification is recorded in `docs/roadmap/changelog.md`. An `AuthResponse` token alone is not sufficient to mark the session `authenticated`:

- Register stores the token, enters `needsProfile`, completes `POST /users`, then enters `authenticated` and navigates to `/learning`.
- Login stores the token and resolves `GET /users/me`: `200` navigates to `/learning`, `404` enters `needsProfile` and navigates to `/onboarding/profile`, and `401` clears the session and returns to `/login`.
- A validation or username-conflict response from Complete Profile keeps the valid token and `needsProfile` session so the user can correct and retry the form.
- Only a `404` from `GET /users/me` has `needsProfile` semantics; other 404 responses remain ordinary feature/resource errors.
- Level 1 logout is local: clear token, session state, and RTK Query cache, then let routing return the user to `/login`; backend logout remains deferred.

### 0.8 Progress semantics (accepted, corrects any prior claim of a ready backend aggregate)

- Backend source of truth: `LEARN-06` (`GET /learning/decks/{deckId}`), including server `progress {masteredCount,totalCount}` and per-card `CardLearningStatus` in `cards[].progress`.
- Frontend may compute **display-only** counts `{new, learning, reviewing, mastered}` from the full card array already returned for the currently open deck. These derived status-bucket counts are not persisted and do not replace the server aggregate.
- This is permitted only while LEARN-06 returns the full, unpaginated card list. If pagination is introduced (currently deferred, Level 2), the server aggregate remains authoritative and per-status totals need a backend contract.
- The separate cross-deck aggregate `/progress` dashboard remains deferred (G-07); it requires data across all of a user's decks, which no accepted Level 1 endpoint provides.

### 0.9 Audit document lifecycle

- **This document** stays active through implementation of the accepted Level 1 routes above; it then converts to a compact screen integration registry that does not duplicate Stitch IDs already owned by `docs/frontend/design-reference/MANIFEST.md`.
- **`docs/frontend/integration/BACKEND_CONTRACT_INVENTORY.md`** stays active as the repository-grounded HTTP-contract snapshot until OpenAPI adoption (`backend/IMPROVEMENTS.md`); after OpenAPI, it reduces to security semantics, integration warnings, and known gaps. OpenAPI itself is out of scope for Level 1/Phase 0.4C.
- No document is renamed or deleted now; `AGENTS.md` pointers and any validator checks are updated only at the actual retirement/conversion point.

### 0.10 Reachable Level 1 product flow — accepted scope revision

The user requested that the complete Level 1 path be executable through visible UI. This replaces the original Created/Discover deferral and the assumption that manually constructing a public-deck URL is sufficient for product acceptance. It does not require the full future product or change runtime code by itself.

**Accepted navigation and transitions:**
- Persistent destinations: Learning, Created, Discover, using the shell contract in `DESIGN.md`. Add each entry with its working route. Study remains contextual; aggregate Progress and Settings are not added.
- Created → Create Deck → Owner Deck Details → Add Card → Owner Deck Details; Created provides a way back to existing owned decks. Create Deck is available for empty and populated lists.
- Discover → Public Deck Details → Start Learning or Enroll → Study/Learning. Created → Owner Deck Details offers the same learning actions, including owner enrollment for a private deck. For a nonempty deck, Start Learning is available and auto-enrolls before opening Study when needed; the separate Enroll action only adds the deck and remains on its details page. An empty deck instead shows a clear no-cards state and does not offer Start Learning. Created never substitutes for the Learning collection.
- Public Deck Details derives enrollment from the current-user `isEnrolled` field in DECK-02, including after refresh/direct entry; it does not fetch the full LEARN-05 collection or rely on state passed from Discover. Enroll is hidden after enrollment while Start Learning remains available for nonempty decks. Reconcile 409 conflicts before treating them as existing enrollment. New enrollment invalidates detail, Discover and Learning caches.
- Visible local Logout → Login → reopen Created/Learning and continue. A manual token clear does not meet the user-facing logout criterion.
- No Owner → Public shortcut is required to pass the revised public flow: Discover is the entry. A private deck remains visible only to its owner in Created; Owner Deck Details can enroll it and open Study, while every non-owner enrollment attempt remains `403`.

**Collection data contract (implemented):**
- DECK-03 remains server-filtered to public decks; DECK-06 remains scoped to the current owner's public/private decks.
- `OwnedDeckListResponse` supplies Created with `id`, title, language pair, visibility and backend `cardCount` (content cards, zero for empty decks). Owner is implied by the authenticated endpoint and is omitted.
- `PublicDeckListResponse` supplies Discover with `id`, title, language pair, full `UserResponse owner`, `cardCount` and `isEnrolled` for the current user's ACTIVE enrollment, independent of deck ownership. Only a future compact replacement for the owner representation is deferred.
- Create/add-card mutations must refresh affected list counts and detail caches; enrollment refreshes the public collection's enrollment state and Learning list. Do not copy server collection data into ordinary Redux slices.

**Stitch evidence and bounded adaptation:**
- Canonical project metadata and Created/Discover desktop/mobile screens were retrieved via Stitch MCP; both HTML and screenshots were inspected on 2026-09-20. Exact resource IDs remain owned by `docs/frontend/design-reference/MANIFEST.md`.
- Created desktop/mobile show language pair, title, card count, Public/Private, Open and Create New Deck. This confirms cardCount is needed for Created too, superseding the earlier uncertainty in §5.4.
- Discover desktop shows title/creator search, Public/Enrolled badges, language pair, creator, card count and Load Additional Decks. Mobile includes search, filter/topic/level chips, cover images, bookmark controls and Load more; these extra controls are not proof of backend support.
- Accepted first implementation is the list/card/navigation subset: title, languages, owner identity, count, truthful enrollment indication and detail link. The response currently carries the full `UserResponse owner`; replacing it with a compact owner shape follows later. Search, filters, sorting, load-more/pagination, topic/level chips, cover imagery and bookmarks are omitted on both devices. Reuse canonical layout/tokens and state references; do not invent metadata or ship non-working prototype controls. This bounded adaptation is owned by `DESIGN.md` and does not require changing remote Stitch screens in this planning task.

**Acceptance boundary:** Sprint 1.0 completion evidence in `docs/roadmap/changelog.md` distinguishes automated checks and user-verified behavior. Study/review/per-card progress and live UI re-entry are complete. A successful AI card creation still does not substitute for the verified manual-card path.

## 1. Source precedence and boundaries

1. `docs/frontend/integration/BACKEND_CONTRACT_INVENTORY.md` owns the repository-grounded HTTP-contract snapshot and gap evidence.
2. `docs/frontend/DESIGN.md` owns product surfaces, shell rules, and canonical screen names.
3. `docs/frontend/design-reference/MANIFEST.md` owns exact Stitch project/screen IDs and state variants.
4. Executable backend code remains authoritative if the inventory becomes stale.
5. The routes and frontend phases in §2–§7 below were **candidates as of Phase 0.4B**. Phase 0.4C (§0) has since accepted the routes/phases listed in §0.1–§0.3 as decisions; any route or surface not listed in §0 remains a non-accepted candidate or deferred (§0.2).

The map preserves the content/learning boundary: `Deck`/`Card` are owner-managed content; `UserDeckProgress`/`UserCardProgress` are per-user learning state. Owner/Public Deck Details must not display learning progress, while Learning Deck Details may.

## 2. Status definitions

> Sections 2–7 preserve the Phase 0.4B status labels and counts as a historical snapshot. Inline **Superseded scope** notes record current decisions and contract readiness; preserved `blocked` and `deferred` cells must not be read as current implementation status.

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
| G-04 | `GET /decks` previously returned every deck. | Created, Discover, Creator Profile. | ✅ Resolved: the existing endpoint now uses a repository-enforced `isPublic=true` query, and DECK-06 provides the separate owner-scoped Created collection. Richer Discover and creator-scoped contracts remain separate gaps. |
| G-05 | `GET /decks/{id}` and `GET /cards/{id}` previously lacked owner/public visibility. | Public Deck Details, owner/edit prefill trust boundary, card edit. | ✅ Resolved by shared `DeckAccessPolicy`: public or owner-private reads succeed; another user's private content returns 403. |
| G-06 | Learning Decks list contract. | Learning dashboard and navigation into enrolled decks. | ✅ Resolved by LEARN-05: active current-user enrollments, deterministic Continue/Start ordering, and mastered/total aggregation. |
| G-07 | No aggregate Progress contract. | Progress. | Backend blocker. |
| G-08 | Study selection previously excluded `REVIEWING`. | Study and truthful all-caught-up state. | ✅ Resolved: `LEARNING` → `REVIEWING` → `NEW`, max 10; `MASTERED` excluded. |
| G-09 | Bulk AI response omits failed titles/reasons. | Add/Edit Card AI partial-failure UX. | Partial gap; manual cards are not blocked. |
| G-10 | No creator-scoped public-deck list contract. | Creator Profile. | Backend blocker if the surface enters MVP. |
| G-11 | `isPrivate` UI control maps inversely to wire field `isPublic`. | Create/Edit Deck. | Required frontend boundary mapping: `isPublic = !isPrivate`; not a backend gap. |
| G-12 | Learning "not enrolled" was documented as 403 instead of the actual 409 contract. | Learning Deck Details, Study, review submission. | ✅ Resolved: learning-flow documentation and frontend integration now consistently use `409 Conflict` for missing/inactive enrollment. |

Shared JWT errors on every authenticated endpoint: missing Bearer token → controlled `401 {message}`; expired/malformed token → unresolved G-03. Shared controller errors where applicable: validation `400 {errors}`, malformed body `400 {message}`, authorization `403 {message}`, missing resource `404 {message}`, state conflict `409 {message}`, rate limit `429 {error,message,timestamp}`, AI unavailable `503 {message}`, and catch-all `500 {message}`.

## 4. Coverage summary

| Integration status | Canonical references | Count |
|---|---|---:|
| **ready** | Login; Learning desktop/mobile; Create Deck desktop/mobile; Learning Deck Details desktop/mobile; Add Card mobile; Study desktop/mobile | 10 |
| **partial** | Edit Deck desktop/mobile; Owner Deck Details desktop/mobile; Add/Edit Card desktop | 5 |
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
| Desktop + responsive mobile adaptation | `login_llhelper` | See manifest | None; responsive mobile must reuse this visual language. | **ready** |

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
| Desktop + responsive mobile adaptation | `register_llhelper_refined` | See manifest | None; responsive mobile must reuse this visual language. | **blocked** |

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
| Desktop | `learning_llhelper_refined_navigation` | See manifest | State inventory: manifest | **ready** |
| Mobile | `learning_mobile_dashboard` | See manifest | State inventory: manifest | **ready** |

**Implemented DTO mapping** (`learning_llhelper_refined_navigation` and `learning_mobile_dashboard` show a Continue/Start highlight plus a Learning Decks list):

| Field | Status | Note |
|---|---|---|
| `deckId`, `title` | Existing (`Deck`) | Already returned by the deck list/detail responses. |
| `sourceLanguage`, `targetLanguage` | Existing (`Deck`) | Already returned by the deck list responses. |
| Per-deck aggregate learning progress | Implemented | LEARN-05 returns `progress.masteredCount` and `progress.totalCount`, aggregated server-side in one batch read. |
| "Continue Learning" / "Start Learning" highlight selection | Implemented contract | Response order is authoritative: studied decks first by `lastStudiedAt DESC`; if none has been studied, the newest `enrolledAt` is first. The UI labels a first item with non-null `lastStudiedAt` as Continue Learning, otherwise Start Learning. |
| Ratings/likes/popularity/follower badges | Not in MVP | Not present on the canonical screen; must not be added. |

Implemented response: `List<{deckId, title, sourceLanguage, targetLanguage, enrolledAt, lastStudiedAt, progress: {masteredCount, totalCount}}>`. Only `ACTIVE` enrollments are returned; `id ASC` is the deterministic final tie-breaker.

### 5.4 Created Decks

> **Superseded scope:** basic Created is accepted by §0.10; the deferred labels below describe the earlier snapshot. Current implementation/verification tasks are in the sprint. Screenshot + HTML inspection confirmed cardCount on both canonical devices; the backend collection now supplies it.

| Field | Mapping |
|---|---|
| Product surface | My Decks — Created list |
| Candidate route | `/created` |
| Auth | JWT |
| Domain owner | Deck content ownership |
| Endpoint | `DECK-06 GET /api/v1/decks/mine`; distinct from public-only `DECK-03 GET /api/v1/decks`. |
| Request / response DTO | No request body; `List<OwnedDeckListResponse>` includes title, language pair, visibility and `cardCount`. |
| Errors | Shared JWT; 404 when the authenticated account has no linked `User` profile; catch-all 5xx. |
| Loading / error / empty | Desktop has API-error and empty; mobile has loading, API-error, empty. Desktop loading uses the shared `Skeleton` pattern because no dedicated state reference exists. |
| Backend status | Implemented: DECK-06 returns all public/private decks owned by the current user; DECK-03 remains safe and public-only. |
| Accepted frontend phase | Level 1 Created flow; route and collection page implemented. |
| Blocker / gap | None for collection freshness: successful deck creation invalidates `Deck/LIST`; manual and AI card creation invalidate `Deck/{deckId}`, refreshing both owner detail and the matching Created count. Cross-account/mobile/keyboard smoke completed in Sprint 1.0; see changelog. |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop | `created_decks_llhelper_refined_mvp` | See manifest | State inventory: manifest | **implemented; live smoke pending** |
| Mobile | `created_decks_mobile_with_bottom_nav` | See manifest | State inventory: manifest | **implemented; live smoke pending** |

**Implemented DTO shape** (canonical Created desktop/mobile show title, language pair, card count, visibility, Open and Create New Deck):

| Field | Status | Note |
|---|---|---|
| `id`, `title`, `sourceLanguage`, `targetLanguage`, `isPublic`, `cardCount` | Implemented (`OwnedDeckListResponse`) | Owner is implied by the authenticated endpoint; description and timestamps remain detail-only fields. |
| Owner-scoped filter (only the current user's decks) | Implemented | DECK-06 resolves the current user server-side and filters by `ownerId`; `DECK-03` remains public-only. |
| Per-deck card count | Implemented | `OwnedDeckListResponse.cardCount` is calculated from content cards, including `0`, by one owner-scoped aggregate query. |

Implemented response: `DECK-06 GET /api/v1/decks/mine` returns minimal `List<OwnedDeckListResponse>` with visibility and `cardCount`, and resolves current-user identity server-side. Its aggregate query includes the owner's public and private decks without joining users or loading card collections.

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
| Accepted frontend phase | Implemented after Auth/Onboarding; a successful create navigates directly to `/decks/:deckId/manage` so the owner can add cards. |
| Blocker / gap | None specific to this screen's own contract. G-01/G-02/G-03 are shared sequencing prerequisites; G-11 is a required mapping, not a blocker. |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop | `create_deck_llhelper` | See manifest | State inventory: manifest | **ready** |
| Mobile | `create_deck_refined_mobile_state` | See manifest | State inventory: manifest | **ready** |

### 5.6 Edit Deck

| Field | Mapping |
|---|---|
| Product surface | Edit Deck |
| Candidate route | `/decks/:deckId/edit` |
| Auth | JWT; owner-only mutation |
| Domain owner | Deck content ownership |
| Endpoint | Prefill `DECK-02 GET /api/v1/decks/{id}`; submit `DECK-04 PUT /api/v1/decks/{id}`; optional delete `DECK-05 DELETE /api/v1/decks/{id}`. |
| Request / response DTO | Prefill `DeckResponse`; update `DeckRequest` → `DeckResponse`; delete → no content. Apply G-11 inversion. |
| Errors | Prefill 403 private deck owned by another user / 404; update 400/403/404/429; delete 403/404/429; shared JWT. |
| Loading / error / empty | Initial prefill loading; load error; field validation; submitting/submission error; destructive confirmation/delete error. Empty not applicable. No dedicated canonical state variants. |
| Backend status | Read and mutations implemented; G-05 resolved. |
| Candidate frontend phase | Content management after Auth and security read fix. |
| Blocker / gap | Screen-local read/mutation contract is sufficient; navigation from Created remains unavailable only because that UI route is product-deferred, not because of a backend contract gap. |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop | `edit_deck_llhelper_refined_1` | See manifest | Shared skeleton/form/error/dialog patterns. | **partial** |
| Mobile | responsive adaptation | See manifest | No live Stitch reference; use the desktop hierarchy and canonical mobile shell. | **partial** |

### 5.7 Deck Details — Owner

| Field | Mapping |
|---|---|
| Product surface | Owner Deck Details, card inventory and enrollment/Start Learning controls; no learning-progress display |
| Candidate route | `/decks/:deckId/manage` |
| Auth | JWT; intended for owner |
| Domain owner | Deck/Card content ownership |
| Endpoint | `DECK-02 GET /api/v1/decks/{id}` supplies deck plus `CardResponse[]` and `isEnrolled`; `LEARN-01 POST /api/v1/decks/{deckId}/enroll` supports owner enrollment for private/public decks; mutations link to `DECK-04/05` and `CARD-05/06`. Do not use `CARD-04` or learning `LEARN-03` for owner inventory. |
| Request / response DTO | `DeckDetailsResponse {…,owner,isPublic,cards: CardResponse[],isEnrolled}`; enroll returns `EnrollResponse {userDeckId}`; mutations use `DeckRequest`/`CardRequest`. |
| Errors | Load 403 for another user's private deck / 404; enroll 404/409/429 (403 remains the server boundary for a non-owner direct request); mutations 400/403/404/429; shared JWT. |
| Loading / error / empty | Canonical loading, API-error, and empty-card-inventory states exist on both platforms. |
| Backend status | Detail read, owner enrollment and owner mutations implemented; G-05 resolved. |
| Candidate frontend phase | Content management after Auth; safe navigation depends on Created contract. |
| Blocker / gap | None. Owner private-deck enrollment and Start Learning are covered by RTL/MSW; G-01 supplies owner identity for frontend routing. |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop | `deck_details_owner_llhelper_refined` | See manifest | State inventory: manifest | **partial** |
| Mobile | `deck_details_owner_mobile_2` | See manifest | State inventory: manifest | **partial** |

### 5.8 Deck Details — Public

> **Superseded scope:** §0.10 requires Discover → Public Deck Details with enrollment-aware paths into Study and Learning. The direct-link-only statements below describe the runtime baseline before that work, not the final acceptance requirement.

| Field | Mapping |
|---|---|
| Product surface | Public Deck Details and enroll action; no learning progress |
| Route (**accepted, Phase 0.4C** — supersedes the `/discover/decks/:deckId` candidate below) | `/decks/:deckId` — reachable from Discover and by direct link; no dedicated navigation action from Owner Deck Details is required. Still a JWT-protected frontend route; "Public" names the product surface (public deck), not anonymous HTTP access. |
| Auth | JWT under current backend; enroll requires JWT. |
| Domain owner | Public Deck content + Learning enrollment boundary |
| Endpoint | Detail and current-user enrollment state `DECK-02 GET /api/v1/decks/{id}`; enroll `LEARN-01 POST /api/v1/decks/{deckId}/enroll`. |
| Request / response DTO | Detail `DeckDetailsResponse` with `isEnrolled`; enroll has no body and returns `EnrollResponse {userDeckId}`. |
| Errors | Detail 403 for another user's private deck / 404; enroll 403 for another user's private deck, 404 deck, 409 already enrolled; shared JWT. Owner-private enrollment is handled from Owner Deck Details; Public Deck Details remains scoped to public decks. |
| Loading / error / empty | Combined detail/enrollment-state loading; retryable page API error; empty card inventory with no Start Learning action; enroll-button loading and inline unconfirmed-409/403/5xx feedback. No dedicated state variants. |
| Backend status | Enroll, detail visibility, DECK-02 detail enrollment state, Discover collection and LEARN-05 Learning list are implemented; G-04, G-05 and G-06 are resolved. |
| Accepted frontend phase (Phase 0.4C/4D) | Included in Level 1 MVP; see §0.1/§0.3/§0.10. The accepted flow enters through Discover; direct links and refresh remain supported. |
| Blocker / gap | None; Sprint 1.0 browser acceptance is recorded in `docs/roadmap/changelog.md`. |

**Runtime status:** Public Deck Details is reachable from Discover and directly
at `/decks/:deckId`. The page consumes the current-user `isEnrolled` field from
DECK-02 and does not load the full LEARN-05 collection.
Start Learning is available for a non-empty deck: it invokes `LEARN-01` first
when needed and then opens `/study/:deckId`; an existing enrollment opens Study
without another enroll request. An empty deck states that there are no cards to
study and does not offer Start Learning. Before enrollment, a separate Enroll
action invokes `LEARN-01`, stays on Public Deck Details and disappears after the
detail, Learning and Discover caches refresh. A `409` triggers a fresh DECK-02
read; only confirmed `isEnrolled=true` continues as success.

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop | `deck_details_public_llhelper_refined` | See manifest | Shared skeleton/page-state/inline-error patterns. | **implemented; both enrollment branches, cache refresh, repeat entry, 409 reconciliation, and empty-deck CTA verified with RTL/MSW** |
| Mobile | `deck_details_public_mobile_refined` | See manifest | Shared skeleton/page-state/inline-error patterns. | **implemented responsive adaptation; shared enrollment behavior verified with RTL/MSW** |

### 5.9 Learning Deck Details

| Field | Mapping |
|---|---|
| Product surface | Enrolled deck details with per-card learning progress |
| Candidate route | `/learning/:deckId` |
| Auth | JWT + existing enrollment |
| Domain owner | Learning (`UserDeckProgress`/`UserCardProgress`) |
| Endpoint | Unified `LEARN-06 GET /api/v1/learning/decks/{deckId}`. |
| Request / response DTO | `LearningDeckDetailsResponse {deckId,title,sourceLanguage,targetLanguage,enrolledAt,lastStudiedAt,progress,cards[]}`. |
| Errors | 409 missing/inactive enrollment, including an unknown deck id at this learning-scoped boundary (not 403); shared JWT errors. |
| Loading / error / empty | Initial skeleton; page API error; empty cards state. No dedicated variants; use shared patterns without borrowing Owner details' learning-free content semantics. |
| Backend status | `LEARN-06` implemented as the single detail source; LEARN-03 remains available for compatibility. List navigation source is LEARN-05. |
| Candidate frontend phase | Learning flow after Auth and Learning dashboard contract. |
| Blocker / gap | Screen-specific data contract and reachability source are sufficient; shared Auth/onboarding prerequisites still apply. |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop | `learning_deck_details_llhelper_refined` | See manifest | Shared learning-aware skeleton/page states. | **ready** |
| Mobile | `learning_deck_details_mobile_refined_2` | See manifest | Shared learning-aware skeleton/page states. | **ready** |

### 5.9A Card Details — Owner

| Field | Mapping |
|---|---|
| Product surface | Read-only card content opened from the card inventory on Owner Deck Details |
| Route (**accepted**) | `/decks/:deckId/cards/:cardId` |
| Entry and next action | Selecting a card in `/decks/:deckId/manage` opens this read-only surface; **Edit Card** continues to `/decks/:deckId/cards/:cardId/edit`. |
| Auth | JWT; owner flow. Backend visibility remains enforced by the parent deck policy. |
| Domain owner | Card content only; no `UserCardProgress` or study state |
| Endpoint | `CARD-03 GET /api/v1/cards/{id}` |
| Response DTO | `CardResponse` fields displayed as available: title, definition, translation, synonyms, and usage examples. |
| Errors and states | Shared skeleton while loading; page-level 403/404/5xx presentation. Missing optional sections are omitted without placeholder data. |
| Backend status | Read contract implemented; parent-deck visibility enforced by `DeckAccessPolicy`. |
| Runtime status | **Deferred to Sprint 1.1 — Full Frontend**, to ship with the full Card Editor rather than add a temporary navigation slice. |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop | `card_details_owner` | See manifest | No dedicated variants; use shared skeleton and page-error patterns. | **design/route accepted; runtime deferred** |
| Mobile | Responsive adaptation of `card_details_owner` under the canonical mobile shell | — | No separate Stitch resource; `DESIGN.md` tokens and mobile rules govern. | **design contract accepted; runtime deferred** |

### 5.10 Add / Edit Card

| Field | Mapping |
|---|---|
| Product surface | Manual Add Card, Edit Card, and optional AI generation |
| Candidate route | Add `/decks/:deckId/cards/new`; edit `/decks/:deckId/cards/:cardId/edit` |
| Auth | JWT; deck-owner mutation |
| Domain owner | Card content; AI generation is backend-owned |
| Endpoint | Manual `CARD-01 POST /api/v1/decks/{deckId}/cards`; single AI `CARD-07 POST /api/v1/card-generations`; edit prefill `CARD-03 GET /api/v1/cards/{id}`; update `CARD-05 PUT`; optional delete `CARD-06 DELETE`; bulk AI `CARD-02 POST /api/v1/card-generations/bulk`. |
| Request / response DTO | Manual POST/PUT `CardRequest`; AI `GenerateCardRequest` → `CardResponse`; bulk `BulkCardGenerateRequest` → `List<CardResponse>` successes only. |
| Errors | 400/403/404/429; AI 503; edit prefill returns 403 for another user's private parent deck; shared JWT. Bulk partial failures are not represented (G-09). |
| Loading / error / empty | Form submit/validation/submission errors; AI loading/error; edit prefill loading/error; empty not applicable. Desktop has all form/AI variants; mobile Add has none. |
| Backend status | Manual create/read/update/delete implemented; bulk response partial. |
| Candidate frontend phase | Manual Cards immediately after Create/Owner Details; AI enhancement after manual flow. |
| Blocker / gap | Desktop reference spans modes with different readiness. AI partial-failure UX cannot be truthful; G-05 card visibility is resolved. |

**Runtime status:** Manual Add Card and optional single-card AI generation are
implemented at the accepted `/decks/:deckId/cards/new` route. Manual creation
uses `POST /decks/{deckId}/cards` and requires Translation; Definition is optional.
AI creation sends only title and deckId to `POST /card-generations`;
the backend rejects a generated result without a non-blank translation; dedicated pending and `429`/`503` error states remain in place.
Both paths save immediately, invalidate the deck cache, and return to Owner
Deck Details. Edit, delete, and bulk AI remain outside this runtime slice; their
operation-level readiness below is unchanged.

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop Add/Edit/AI | `add_edit_card_llhelper_refined` | See manifest | State inventory: manifest | **partial** |
| Mobile Add only | `add_card_mobile` | See manifest | Shared form patterns; supplementary mobile variant is non-canonical. | **ready** |

**Operation-level breakdown** (the desktop reference spans all of these; readiness differs per operation):

| Operation | Endpoint | Backend status | Blocker / gap | MVP readiness |
|---|---|---|---|---|
| Manual add | `CARD-01 POST /api/v1/decks/{deckId}/cards` | implemented | None | Ready |
| Edit prefill | `CARD-03 GET /api/v1/cards/{id}` | implemented | Parent-deck visibility enforced by `DeckAccessPolicy` | Ready |
| Manual update | `CARD-05 PUT /api/v1/cards/{id}` | implemented | None | Ready |
| Manual delete | `CARD-06 DELETE /api/v1/cards/{id}` | implemented | None | Ready |
| Single-card AI generation | `CARD-07 POST /api/v1/card-generations` | implemented | Shared AI 429/503 errors only | Ready |
| Bulk AI generation | `CARD-02 POST /api/v1/card-generations/bulk` | partial | Response returns successful cards only; failed titles/reasons are lost (G-09) | Partial (partial-failure UX not truthful) |

The canonical desktop reference stays `partial` at the reference level because it spans mixed-readiness operations. Phase 0.4C may split the runtime implementation so manual add/update/delete and single-card AI ship as part of the manual Cards MVP, while bulk AI partial-failure UX is deferred separately without blocking the rest of this reference.

### 5.11 Study

| Field | Mapping |
|---|---|
| Product surface | Study session, answer review, all-caught-up, session complete |
| Candidate route | `/study/:deckId`; a deck-less `/study` is not required at Level 1 |
| Auth | JWT + enrollment |
| Domain owner | Learning |
| Endpoint | Load `LEARN-02 GET /api/v1/decks/{deckId}/study`; submit `LEARN-04 POST /api/v1/cards/{cardId}/review`. |
| Request / response DTO | Load `StudySessionResponse {deckId, deckTitle, cards}`; submit `CardReviewRequest {userAnswer}` → `CardReviewResponse {correct,correctAnswer,status,correctStreak,totalCorrect}`. |
| Errors | Load/review 409 not enrolled; review 400/404; shared JWT. Answer correctness must come only from response. |
| Loading / error / empty | Canonical loading, API-error, all-caught-up, and session-complete states on both platforms. With G-08 resolved, an empty study response truthfully means no `LEARNING`, `REVIEWING`, or `NEW` cards remain. |
| Backend status | Review and study selection implemented; G-08 resolved. |
| Candidate frontend phase | After enrollment through Public/Owner Deck Details Start Learning or from Learning Deck Details; before aggregate Progress UI. |
| Blocker / gap | None specific to the Study selection contract for Level 1. Advanced due-date scheduling remains out of scope. |

**Runtime status:** Study is implemented at the accepted contextual
`/study/:deckId` route and is linked from Learning Deck Details when a
non-`MASTERED` card exists and from Public/Owner Deck Details through Start Learning,
which auto-enrolls first when needed. The page renders the backend-ordered `LEARN-02`
batch and deck title from one response without subscribing to the Learning list, submits each answer through `LEARN-04`, derives correctness only from
the backend response, and covers loading, API error, all-caught-up, per-answer
result, and session-complete states. No persistent Study navigation destination
was added.

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop | `study_english_b1_llhelper_refined` | See manifest | State inventory: manifest | **ready** |
| Mobile | `study_english_b1_mobile` | See manifest | State inventory: manifest | **ready** |

### 5.12 Discover

> **Superseded scope:** §0.10 accepts the basic list and explicitly defers search/filter/load-more and other unsupported prototype controls. `owner`, `cardCount` and `isEnrolled` are implemented. This is no longer a deferred product screen.

| Field | Mapping |
|---|---|
| Product surface | Discover public decks/search |
| Candidate route | `/discover` |
| Auth | JWT under current backend |
| Domain owner | Public Deck content discovery |
| Endpoint | `DECK-03 GET /api/v1/decks` is a safe public-only list. Search/filter parameters are not defined. |
| Request / response DTO | `List<PublicDeckListResponse>` includes title, language pair, full `UserResponse owner`, `cardCount` and current-user `isEnrolled`; it has no search/sort/pagination parameters. |
| Errors | Shared JWT `401`; `404` when the authenticated account has no linked `User` profile; page-level `5xx`. Search/query-validation errors are not part of the accepted bounded list because search and filters are deferred. |
| Loading / error / empty | Canonical loading, API-error, and no-results/empty states on both platforms. No-results must be driven by server-safe public results, not client filtering. |
| Backend status | Public-only filtering, full owner, aggregate `cardCount` and current-user ACTIVE `isEnrolled` are implemented; detail security G-05 is resolved. |
| Candidate frontend phase | Backend contract is ready for the accepted first Discover implementation. |
| Blocker / gap | No backend collection blocker for the accepted first list. No search contract exists because search is deferred. |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop | `discover_llhelper_refined` | See manifest | State inventory: manifest | **implemented; RTL/MSW verified** |
| Mobile | `discover_mobile` | See manifest | State inventory: manifest | **implemented responsive adaptation; RTL/MSW verified** |

**Implemented DTO shape** (the `discover_llhelper_refined` reference lists per-deck title, source/target language, card count, owner `@username`, a `Public` badge, and an `Enrolled` badge on at least one card):

| Field | Status | Note |
|---|---|---|
| `id`, `title`, `sourceLanguage`, `targetLanguage`, `owner.id`, `owner.username`, `owner.avatarUrl` | Implemented (`PublicDeckListResponse`) | `owner` is the full nested `UserResponse`; Discover consumes the listed subset. A compact replacement is deferred, not owner identity itself. |
| Public-only filter | Implemented | `DECK-03` uses the native SQL projection `DeckRepository.findPublicDecks()` with `d.is_public = true`; private decks never reach the response. |
| `cardCount` per deck | Implemented | A single public-only aggregate query calculates content-card count, including `0`, without loading card collections or issuing per-deck queries. |
| `isEnrolled` per deck | Implemented | One current-user-aware aggregate query checks ACTIVE `UserDeckProgress` while preserving public-only results. |
| Search/filter/load-more controls | Visible in screenshot/HTML; deferred by §0.10 | Desktop has search and Load Additional Decks; mobile also has filter/topic/level chips. Their presence does not create an HTTP contract. Omit these controls in the accepted first list implementation. |

Implemented required response: public-only DECK-03 returns `PublicDeckListResponse` with full `UserResponse owner`, `cardCount` and current-user ACTIVE `isEnrolled` in one aggregate query. Ratings/likes/popularity sort remain explicitly out of scope per `DESIGN.md`.

### 5.13 Creator Profile

| Field | Mapping |
|---|---|
| Product surface | Creator profile plus that creator's public decks; no social/follow behavior |
| Candidate route | `/creators/:username` |
| Auth | JWT under current backend |
| Domain owner | User profile + public Deck content |
| Endpoint | Profile `USER-03 GET /api/v1/users/username/{username}`; creator-public-decks endpoint missing. |
| Request / response DTO | Profile `UserResponse`; creator-scoped deck list DTO/query missing. Existing `DECK-03` is public-only but not creator-scoped. |
| Errors | Profile 404 plus shared JWT; future collection errors unknown. |
| Loading / error / empty | Profile loading/error; creator-decks loading/error/empty. No canonical state variants. Follow/follower states are explicitly excluded. |
| Backend status | Profile lookup implemented; required creator-scoped deck collection remains missing (G-10). G-04 and G-05 are resolved. |
| Candidate frontend phase | Candidate post-MVP deferral as of Phase 0.4B. *(Historical — §0.1/§0.2 has since confirmed Creator Profile as deferred.)* |
| Blocker / gap | The visual surface cannot be completed with public creator decks. If kept in MVP, it becomes blocked rather than deferred. |

| Platform | Canonical reference | Stitch ID | State references | Integration status |
|---|---|---|---|---|
| Desktop | `creator_profile_llhelper_refined` | See manifest | Shared page/list states. | **deferred** |
| Mobile | `creator_profile_mobile` | See manifest | Shared page/list states. | **deferred** |

**Missing DTO — minimal required shape, for Phase 0.4C reference only; does not change the `deferred` status** (read-only review of `creator_profile_llhelper_refined`, which shows the creator's `@username` and a "Public Decks" count plus per-deck language pair, card count, and a `Public` badge):

| Field | Status | Note |
|---|---|---|
| Creator profile (`username`, name, avatar) | Existing (`UserResponse` via `USER-03`) | No new field needed. |
| Creator's public deck list (`id`, `title`, `sourceLanguage`, `targetLanguage`) | Missing | No endpoint filters decks by a given owner plus `isPublic=true` (G-10); a future endpoint can reuse the compact public-list fields. |
| `cardCount` per deck | Aggregate pattern exists; creator-scoped contract missing | `PublicDeckListResponse.cardCount` is available for DECK-03; a future creator-scoped endpoint can reuse the aggregate pattern without selecting full entities. |
| Follow/follower counts, social behavior | Excluded | Forbidden per `DESIGN.md`; must not be added regardless of the 0.4C MVP decision. |

Minimal required response if this surface enters MVP: existing `UserResponse` + a creator-scoped public list using the compact deck fields and `cardCount`. This sketch does not resolve the `deferred` status. *(Historical — §0.1/§0.2 has since confirmed Creator Profile remains deferred, not entering MVP.)*

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
| Desktop | `learning_progress_llhelper_mvp` | See manifest | State inventory: manifest | **blocked** |
| Mobile | `learning_progress_mobile_2` | See manifest | State inventory: manifest | **blocked** |

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
4. ~~Define the response shapes for current user, Created, Discover, Learning list, Progress aggregate, and optionally creator-public-decks.~~ Resolved: current-user (`GET /api/v1/users/me`, §0.7) and Progress (§0.8, frontend-derived, no new DTO for Level 1) have accepted semantics. Created uses the implemented DECK-06 `List<OwnedDeckListResponse>` contract, and Discover uses DECK-03 `List<PublicDeckListResponse>`. The creator-scoped public list remains deferred with Creator Profile (§0.2).
5. ~~Confirm private-deck/card read protection as a release blocker.~~ Resolved — §0.4 (G-05 is a release/security blocker; not a vertical-implementation blocker).
6. ~~Decide whether AI generation ships with manual Cards MVP or follows after a truthful partial-failure contract.~~ Resolved — §0.1/§0.2/§0.6: manual Add Card is the Level 1 requirement; single-card AI is a separate optional task after manual smoke; bulk AI remains deferred pending the partial-failure contract.
7. ~~Order backend → Stitch → frontend work and update roadmap/current sprint before Phase 0.5 runtime implementation.~~ Resolved — §0.6; completed execution is recorded in `docs/roadmap/changelog.md`.

## 7. Phase 0.4B conclusion (historical, superseded by §0)

> This section is the historical Phase 0.4B result, preserved as-read and not rewritten (see header note). Its counts and evidence below are historical and unchanged. Where it calls for a future decision (e.g. "Phase 0.4C must..."), that decision has since been made in §0 — this section is not the current target.

- All **26** canonical references are mapped: 14 desktop and 12 mobile.
- Using contract-local semantics (§2), the map now identifies **8 ready**, **7 partial**, **9 blocked**, and **2 deferred** references after G-06 resolution.
- For the surfaces reviewed in the historical snapshot, minimal request/response field sketches were recorded (§5.3, §5.4, §5.12–§5.14), explicitly separating existing fields from missing or unresolved ones. Learning, Created and the accepted bounded Discover collection contracts have since been implemented; Creator Profile deck listing and aggregate Progress remain without complete backend contracts. No social/ratings/likes/popularity/bookmark/follower/pagination contract was invented.
- The Add/Edit Card reference (§5.10) is split into six operations; manual add/read/update/delete and single-card AI are independently `Ready`; bulk AI remains `Partial` because of G-09.
- No existing endpoint, DTO, route, Stitch screen, or runtime implementation was changed.
- The Phase 0.4B snapshot originally identified Auth/profile orchestration, unfiltered deck/card collections, and aggregate Progress as its highest-impact blockers. Current status: G-01–G-06, G-08, and `CARD-04` are resolved, including the public-only DECK-03, public-deck-only CARD-04, and owner-scoped DECK-06 contracts; the deferred aggregate Progress contract (G-07) remains open.
- Phase 0.4C must turn the candidate routes/phases, provisional deferral, and the missing-DTO sketches above into accepted product, backend, and execution decisions before Phase 0.5 begins. *(Historical requirement — already fulfilled by §0.)*
