# Backend Contract Inventory — Phase 0.4A

> **Purpose:** Repository-grounded inventory of the actual backend HTTP contract, DTO shapes, auth/authorization model, error contract, and candidate discrepancies — as a foundation for the Global Frontend Integration Audit (Phase 0.4).
> **Scope:** Documentation/analysis only. No frontend runtime code, no backend runtime code, no DTOs/endpoints/routes/components, no Stitch changes.
> **Date:** 2026-08-22
> **Repository baseline:** `master` @ `c9e58a31d6ed8441f026db0486556db9d492b978` (verified via `git rev-parse HEAD`, matches expected).

## 1. Method and source precedence
1. **Executable backend code, `SecurityConfig`, and Liquibase migrations** — authoritative for behavior.
2. **Tests** (`@WebMvcTest`, unit) — supporting behavioral evidence; used to confirm observable HTTP contracts (status codes, body shape).
3. **Current backend/feature documentation** (`docs/architecture/current-architecture.md`, `docs/features/*.md`) — cross-checked against code, not trusted blindly.
4. **`docs/frontend/DESIGN.md` / `docs/frontend/design-reference/MANIFEST.md`** — product/UI intent only, never used to assert backend behavior.
5. **Roadmap documents** — planned behavior only, never presented as implemented.

Every row in the tables below traces to a repository path. No endpoint is marked `implemented` merely because a controller method exists — behavior was traced into `service` → `repository`/persistence.

## 2. Status definitions

| Status | Meaning |
|---|---|
| **implemented** | Controller → service → repository/persistence path traced end-to-end; behavior matches what the endpoint claims to do. |
| **partial** | Endpoint exists and does something real, but a documented/expected behavior (filtering, ownership, response shape) is missing or incomplete. |
| **planned** | No controller/route exists; only referenced in roadmap/design docs. |
| **missing** | No controller, route, service method, or persistence path exists at all. |
| **unclear** | Behavior cannot be fully resolved from code/tests/migrations alone (see §10 Unresolved Questions). |

## 3. Recalculated baselines

| Baseline | Expected | Recalculated | Match |
|---|---|---|---|
| Controllers | 5 | 5 (`AuthController`, `UserController`, `DeckController`, `CardController`, `LearningController`) | ✅ |
| HTTP operations | 23 | 23 (Auth 2, User 6, Deck 5, Card 6, Learning 4) | ✅ |
| Top-level request/response DTO records (excl. enums/nested) | 16 | 16 (Auth 3, User 3, Deck 3, Card 3, Learning 4) | ✅ |

DTO count excludes `DeckCardResponse.CardProgressInfo` (nested record, not top-level) and enums (`CardLearningStatus`, `UserDeckStatus`, `Language`).

## 4. Complete endpoint inventory

**Endpoint status summary (23 total):** `implemented` 16 · `partial` 7 · `planned` 0 · `missing` 0 · `unclear` 0. Every `Status` value in the table below sums to this total exactly. `missing` is reserved for product capabilities with no controller/route/service method at all (see §9); an existing HTTP operation with unsafe/incomplete behavior (e.g. `CARD-04`) is `partial`, never `missing`.

**Shared 401 contract:** every row with `Auth = JWT` inherits the shared authentication-error contract documented in §6 and §7 (missing/invalid Bearer token → 401, in two distinct sub-cases — see §6/§7). The `Errors` column below lists only errors *specific* to that endpoint beyond this shared 401 contract; it must not be read as implying that a JWT-protected operation cannot return 401.

| ID | Domain | Method | Full path | Controller method | Auth | Input | Request DTO | Response DTO | Success | Errors | Status | Candidate product surface | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AUTH-01 | Auth | POST | `/api/v1/auth/login` | `AuthController.login` | Public | Body: email, password | `LoginRequest` | `AuthResponse` | 200 | 400 validation, 401 bad credentials, 429 rate limit | implemented | Login screen | `auth/controller/AuthController.java:24-27`, `auth/service/AuthServiceImpl.java:39-53`, `auth/controller/AuthControllerTest.java` | Rate limit `AUTH_LOGIN` 5/1min by email. |
| AUTH-02 | Auth | POST | `/api/v1/auth/register` | `AuthController.register` | Public | Body: email, password | `RegisterRequest` | `AuthResponse` | 200 | 400 validation, 409 email taken, 429 rate limit | partial | Register screen | `auth/service/AuthServiceImpl.java:55-75` | Creates only `AuthUser`, not `User` — see Discrepancy A. Frontend cannot obtain a usable profile without a follow-up `POST /users` call using data the canonical Register screen does not collect. |
| USER-01 | User | POST | `/api/v1/users` | `UserController.createUser` | JWT | Body + principal email | `CreateUserRequest` | `UserResponse` | 200 | 400 validation, 404 AuthUser not found, 409 user exists/username taken | implemented | Post-register profile creation step | `user/controller/UserController.java:45-50`, `user/service/UserServiceImpl.java:64-83` | No route currently calls this after register in any documented flow — see Discrepancy B. |
| USER-02 | User | GET | `/api/v1/users/{id}` | `UserController.getUserById` | JWT | Path: id | — | `UserResponse` | 200 | 404 | implemented | Own/other profile view | `user/service/UserServiceImpl.java:44-48` | No ownership check on read — any authenticated user can read any `id`. |
| USER-03 | User | GET | `/api/v1/users/username/{username}` | `UserController.getUserByUsername` | JWT | Path: username | — | `UserResponse` | 200 | 404 | implemented | Creator Profile lookup | `user/service/UserServiceImpl.java:50-55` | No ownership restriction (public lookup by design). |
| USER-04 | User | GET | `/api/v1/users/auth/{authUserId}` | `UserController.getUserByAuthUserId` | JWT | Path: authUserId | — | `UserResponse` | 200 | 404 | implemented | Internal/session bootstrap | `user/service/UserServiceImpl.java:57-62` | No ownership restriction. |
| USER-05 | User | PUT | `/api/v1/users/{id}` | `UserController.updateUser` | JWT | Path: id, Body | `UpdateUserRequest` | `UserResponse` | 200 | 400 validation, 403 not owner, 404, 429 rate limit | implemented | Edit profile | `user/service/UserServiceImpl.java:85-100`, `UserControllerTest.java:74-84` | Ownership enforced via `validateUserOwnership`. Rate limit `PROFILE_UPDATE` 5/1min. |
| USER-06 | User | DELETE | `/api/v1/users/{id}` | `UserController.deleteUser` | JWT | Path: id | — | 204 No Content | 204 | 403 not owner, 404 | implemented | Account deletion (no canonical UI screen) | `user/service/UserServiceImpl.java:102-111` | No rate limit configured for this action. |
| DECK-01 | Deck | POST | `/api/v1/decks` | `DeckController.create` | JWT | Body | `DeckRequest` | `DeckResponse` | 201 | 400 validation, 429 rate limit | implemented | Create Deck | `deck/service/DeckServiceImpl.java:53-64` | `isPublic` defaults to `true` if null. Owner set from `SecurityUtils.getCurrentUser()` — requires a `User` record (Discrepancy B). |
| DECK-02 | Deck | GET | `/api/v1/decks/{id}` | `DeckController.getById` | JWT | Path: id | — | `DeckResponse` (with `cards`) | 200 | 404 | partial | Owner/Public Deck Details | `deck/service/DeckServiceImpl.java:66-72` | No visibility check — private decks readable by any authenticated user (Discrepancy F). |
| DECK-03 | Deck | GET | `/api/v1/decks` | `DeckController.getAll` | JWT | — | — | `List<DeckListResponse>` (no cards) | 200 | — | partial | Discover / Created Decks (unsplit) | `deck/service/DeckServiceImpl.java:74-80` (`deckRepository.findAll()`) | No owner filter, no public-only filter, no pagination. Returns every deck in the DB to every authenticated user (Discrepancy C, D, E). |
| DECK-04 | Deck | PUT | `/api/v1/decks/{id}` | `DeckController.update` | JWT | Path: id, Body | `DeckRequest` | `DeckResponse` | 200 | 400 validation, 403 not owner, 404, 429 rate limit | implemented | Edit Deck | `deck/service/DeckServiceImpl.java:82-96`, `DeckServiceImplTest.java:77-90` | Ownership enforced via `validateDeckOwnership`. `isPublic` null → ignored (`NullValuePropertyMappingStrategy.IGNORE` in `DeckMapper`). |
| DECK-05 | Deck | DELETE | `/api/v1/decks/{id}` | `DeckController.delete` | JWT | Path: id | — | 204 No Content | 204 | 403 not owner, 404, 429 rate limit | implemented | Delete Deck | `deck/service/DeckServiceImpl.java:98-108`, `DeckServiceImplTest.java:93-103` | Ownership enforced. Cascade delete of cards/progress via V5 FK `ON DELETE CASCADE`. |
| CARD-01 | Card | POST | `/api/v1/cards` | `CardController.create` | JWT | Body | `CardRequest` | `CardResponse` | 201 | 400 validation, 403 not deck owner, 404 deck, 429 rate limit, 503 AI unavailable | implemented | Add/Edit Card (manual or `autoGenerate`) | `card/service/CardServiceImpl.java:84-113`, `CardControllerTest.java:63-73` | Deck-ownership enforced before create; AI path only triggered if `autoGenerate: true`. |
| CARD-02 | Card | POST | `/api/v1/cards/bulk-generate` | `CardController.createBulk` | JWT | Body | `BulkCardGenerateRequest` | `List<CardResponse>` (successes only) | 201 | 400 size limit, 403 not deck owner, 404 deck, 429 rate limit (endpoint + AI), 503 AI unavailable | partial | AI generate cards | `card/service/CardServiceImpl.java:115-157` | Failed titles are logged (`log.debug`/`log.warn`) but never returned to the client — Discrepancy N. |
| CARD-03 | Card | GET | `/api/v1/cards/{id}` | `CardController.getById` | JWT | Path: id | — | `CardResponse` | 200 | 404 | partial | Add/Edit Card prefill | `card/service/CardServiceImpl.java:159-164` | No ownership or deck-visibility check — any authenticated user can fetch any card by ID, including cards in private decks (Discrepancy H). |
| CARD-04 | Card | GET | `/api/v1/cards` | `CardController.getAll` | JWT | — | — | `List<CardResponse>` | 200 | — | partial | None documented | `card/service/CardServiceImpl.java:166-171` (`cardRepository.findAll()`) | Existing endpoint with a fully traced controller → service → repository path (`cardRepository.findAll()`); it is implemented but unsafe/incomplete, not absent. Returns every card globally, no deck/owner filter, no pagination (Discrepancy G). No deck-scoped owner card list endpoint exists (Discrepancy I) — distinct from `GET /decks/{deckId}/cards` (learning-scoped, see LEARN-03). |
| CARD-05 | Card | PUT | `/api/v1/cards/{id}` | `CardController.update` | JWT | Path: id, Body | `CardRequest` | `CardResponse` | 200 | 400 validation, 403 not deck owner, 404, 429 rate limit | implemented | Add/Edit Card | `card/service/CardServiceImpl.java:173-187` | Ownership resolved via parent deck (`validateCardOwnership`). |
| CARD-06 | Card | DELETE | `/api/v1/cards/{id}` | `CardController.delete` | JWT | Path: id | — | 204 No Content | 204 | 403 not deck owner, 404, 429 rate limit | implemented | Delete Card | `card/service/CardServiceImpl.java:189-199` | Ownership resolved via parent deck. |
| LEARN-01 | Learning | POST | `/api/v1/decks/{deckId}/enroll` | `LearningController.enrollDeck` | JWT | Path: deckId | — | `EnrollResponse { userDeckId }` | 201 | 403 private deck, 404 deck, 409 already enrolled | implemented | Enroll action (from Deck Details Public) | `learning/service/LearningServiceImpl.java:43-80`, `LearningServiceImplTest.java:116-170` | Duplicate-enroll caught via `DataIntegrityViolationException` message match on `uk_user_deck_progress_user_deck` — fragile (documented FIXME). |
| LEARN-02 | Learning | GET | `/api/v1/decks/{deckId}/study/cards` | `LearningController.getStudyCards` | JWT | Path: deckId | — | `List<DeckCardResponse>` | 200 | 409 not enrolled | partial | Study screen | `learning/service/LearningServiceImpl.java:82-110` | Selects only `LEARNING` then `NEW`, max 10 — `REVIEWING`/`MASTERED` excluded from study selection (Discrepancy K). |
| LEARN-03 | Learning | GET | `/api/v1/decks/{deckId}/cards` | `LearningController.getDeckCards` | JWT | Path: deckId | — | `List<DeckCardResponse>` | 200 | 409 not enrolled | implemented | Learning Deck Details (card list with progress) | `learning/service/LearningServiceImpl.java:112-120` | Returns all enrolled cards with `CardProgressInfo`. Not an owner content-management list — see Discrepancy I. |
| LEARN-04 | Learning | POST | `/api/v1/cards/{cardId}/review` | `LearningController.reviewCard` | JWT | Path: cardId, Body | `CardReviewRequest` | `CardReviewResponse` | 200 | 400 validation, 409 not enrolled, 404 card/progress | implemented | Study answer submission | `learning/service/LearningServiceImpl.java:122-159`, `LearningServiceImplTest.java` (status-transition tests) | Answer check: `userAnswer.trim().equalsIgnoreCase(card.title.trim())`. Correctness always backend-computed — matches `DESIGN.md` domain boundary. |

No separate "Created Decks" list, "Discover"/public search, aggregate "Progress"/"Learning Decks" list, or `/me`/refresh/logout endpoints exist in the controllers inspected (see §5, §9).

## 5. DTO catalogue

Only fields with non-trivial validation/default/nesting are annotated; trivial `String`/`Long` fields without constraints are listed for completeness only.

**Nullability method:** the `Required/nullable` column separates three distinct facts: (1) JSON property *presence* — every response DTO here is a Java `record`, so every declared component is always serialized (never omitted); (2) whether that JSON *value* can be `null`; (3) the persistence/mapping guarantee behind that value. Response fields below are annotated per-field rather than grouped under a single "always present" claim, so as not to conflate (1) with (2).

### Auth

| DTO | Direction | Field | JSON name | Java type | Required/nullable | Validation/default | Enum/nested shape | Evidence |
|---|---|---|---|---|---|---|---|---|
| `LoginRequest` | request | email | `email` | `String` | required | `@NotBlank @Email @Size(max=255)` | — | `auth/dto/request/LoginRequest.java` |
| `LoginRequest` | request | password | `password` | `String` | required | `@NotBlank` | — | same |
| `RegisterRequest` | request | email | `email` | `String` | required | `@NotBlank @Email @Size(max=255)` | — | `auth/dto/request/RegisterRequest.java` |
| `RegisterRequest` | request | password | `password` | `String` | required | `@NotBlank @Size(min=6,max=100)` | — | same |
| `AuthResponse` | response | accessToken | `accessToken` | `String` | always present | — | — | `auth/dto/response/AuthResponse.java` (comment: `// FIXME: why it's empty check later`) |

### User

| DTO | Direction | Field | JSON name | Java type | Required/nullable | Validation/default | Enum/nested shape | Evidence |
|---|---|---|---|---|---|---|---|---|
| `CreateUserRequest` | request | firstName | `firstName` | `String` | required | `@NotBlank @Size(2,100)` | — | `user/dto/request/CreateUserRequest.java` |
| `CreateUserRequest` | request | lastName | `lastName` | `String` | required | `@NotBlank @Size(2,100)` | — | same |
| `CreateUserRequest` | request | username | `username` | `String` | required | `@NotBlank @Size(3,50)`, unique (checked in service + DB `uk_users_username`) | — | same |
| `CreateUserRequest` | request | nativeLanguage | `nativeLanguage` | `String` | required | `@NotBlank @Size(2,10) @Pattern(ISO code)` | — | same (not the `Language` enum — plain validated string) |
| `CreateUserRequest` | request | targetLanguage | `targetLanguage` | `String` | required | same pattern | — | same |
| `CreateUserRequest` | request | avatarUrl | `avatarUrl` | `String` | nullable, no constraint | — | — | same |
| `CreateUserRequest` | request | uiLanguage | `uiLanguage` | `String` | required | `@NotBlank @Size(2,10) @Pattern(ISO code)` | — | same |
| `UpdateUserRequest` | request | firstName, lastName, nativeLanguage, targetLanguage, uiLanguage | same names | `String` | required | same patterns as `CreateUserRequest` (no `Size` message on first/last name) | — | `user/dto/request/UpdateUserRequest.java` |
| `UpdateUserRequest` | request | avatarUrl | `avatarUrl` | `String` | nullable | — | — | same |
| `UpdateUserRequest` | — | username | — | — | **not present** | `UserMapper.updateEntity` explicitly `@Mapping(target="username", ignore=true)` | — | `user/mapper/UserMapper.java:29-34` — username is immutable via update. |
| `UserResponse` | response | id, username, firstName, lastName, nativeLanguage, targetLanguage, uiLanguage, createdAt, updatedAt | same | `Long`/`String`/`Instant` | JSON property always present; value non-null | `User` entity: `firstName`, `lastName`, `username`, `nativeLanguage`, `targetLanguage`, `uiLanguage` are all `@Column(nullable=false)`; `id`/`createdAt`/`updatedAt` are non-null generated/DB-managed columns | — | `user/dto/response/UserResponse.java`, `user/entity/User.java:26-64` |
| `UserResponse` | response | avatarUrl | `avatarUrl` | `String` | JSON property always present; value may be `null` | `User.avatarUrl` (`user/entity/User.java:55`) has no `@Column(nullable=false)`; neither `CreateUserRequest.avatarUrl` nor `UpdateUserRequest.avatarUrl` is `@NotBlank`, so it can legitimately be persisted/returned as `null` | — | `user/entity/User.java:55`, `user/dto/request/CreateUserRequest.java:18`, `user/dto/request/UpdateUserRequest.java:16` |

### Deck

| DTO | Direction | Field | JSON name | Java type | Required/nullable | Validation/default | Enum/nested shape | Evidence |
|---|---|---|---|---|---|---|---|---|
| `DeckRequest` | request | title | `title` | `String` | required | `@NotBlank @Size(1,100)` | — | `deck/dto/request/DeckRequest.java` |
| `DeckRequest` | request | description | `description` | `String` | nullable | `@Size(max=500)` | — | same |
| `DeckRequest` | request | sourceLanguage | `sourceLanguage` | `Language` | required | `@NotNull` | enum `Language` (ISO 639-1, `common/model/Language.java`) | same |
| `DeckRequest` | request | targetLanguage | `targetLanguage` | `Language` | required | `@NotNull` | enum `Language` | same |
| `DeckRequest` | request | isPublic | `isPublic` | `Boolean` | nullable | no annotation; **default in service**: `deck.setIsPublic(request.isPublic() != null ? request.isPublic() : true)` on create; on update, null is mapped-ignored (`NullValuePropertyMappingStrategy.IGNORE`), i.e. unset `isPublic` leaves existing value unchanged | — | `DeckServiceImpl.java:59`, `DeckMapper.java:41` |
| `DeckListResponse` | response | id, title, sourceLanguage, targetLanguage, createdAt, updatedAt, owner, isPublic | same | mixed | JSON property always present; value non-null | `Deck` entity: `title` (`@Column(nullable=false)`), `sourceLanguage`/`targetLanguage` (`@Enumerated`, `@Column(nullable=false)`), `owner` (`@ManyToOne(optional=false)`), `isPublic` (`@Column(nullable=false)`); `id`/`createdAt`/`updatedAt` non-null generated/DB-managed | nested `UserResponse owner` | `deck/dto/response/DeckListResponse.java`, `deck/entity/Deck.java:33-71` — **no `cards` field.** `// FIXME: add cardCount` comment present, not implemented. |
| `DeckListResponse` | response | description | `description` | `String` | JSON property always present; value may be `null` | `Deck.description` (`deck/entity/Deck.java:42-43`) is `@Column(columnDefinition="TEXT")` with no `nullable=false`; `DeckRequest.description` has no `@NotBlank` | — | `deck/entity/Deck.java:42-43`, `deck/dto/request/DeckRequest.java:11-12` |
| `DeckResponse` | response | id, title, sourceLanguage, targetLanguage, createdAt, updatedAt, owner, isPublic | same | mixed | JSON property always present; value non-null | same entity guarantees as `DeckListResponse` above | nested `UserResponse owner` | `deck/dto/response/DeckResponse.java` |
| `DeckResponse` | response | description | `description` | `String` | JSON property always present; value may be `null` | same as `DeckListResponse.description` above | — | same |
| `DeckResponse` | response | cards | `cards` | `List<CardResponse>` | JSON property always present; the collection itself is non-null (`Deck.cards` initialized to `new ArrayList<>()`, `@OneToMany(mappedBy="deck")`) and may legitimately be an **empty list**; each element's field nullability follows the `CardResponse` row below | Sourced directly from the `Deck.cards` relationship | nested `List<CardResponse>` | `deck/entity/Deck.java:59-60`, `deck/dto/response/DeckResponse.java` |

**`DeckListResponse` vs `DeckResponse`:** identical scalar fields plus `owner` (`UserResponse`); the sole difference is `DeckResponse` additionally carries `List<CardResponse> cards`. `GET /decks` (list) uses `DeckListResponse` (no cards, lighter payload); `GET/POST/PUT /decks/{id}` use `DeckResponse` (full card list included).

### Card

| DTO | Direction | Field | JSON name | Java type | Required/nullable | Validation/default | Enum/nested shape | Evidence |
|---|---|---|---|---|---|---|---|---|
| `CardRequest` | request | title | `title` | `String` | required | `@NotBlank @Size(max=100)` | — | `card/dto/request/CardRequest.java` |
| `CardRequest` | request | definition | `definition` | `String` | nullable | `@Size(max=1000)` | — | same |
| `CardRequest` | request | synonyms | `synonyms` | `List<String>` | nullable | `@Size(max=20)` list, each item `@NotBlank @Size(max=100)` | — | same |
| `CardRequest` | request | examples | `examples` | `List<String>` | nullable | `@Size(max=20)` list, each item `@NotBlank @Size(max=500)` | — | same |
| `CardRequest` | request | translation | `translation` | `String` | nullable | `@Size(max=200)` | — | same |
| `CardRequest` | request | deckId | `deckId` | `Long` | required | `@NotNull @Positive` | — | same |
| `CardRequest` | request | autoGenerate | `autoGenerate` | `Boolean` | nullable | no annotation; `Boolean.TRUE.equals(...)` treats null/false identically | — | `CardServiceImpl.java:97` |
| `BulkCardGenerateRequest` | request | titles | `titles` | `List<String>` | required | `@NotNull @Size(min=1,max=100)`, each `@NotBlank`; **also** re-validated in service against `AiProperties.maxBulkSize` (default 100) — DTO annotation alone would not enforce a lower configured max | — | `card/dto/request/BulkCardGenerateRequest.java`, `CardServiceImpl.validateBulkSize()` |
| `BulkCardGenerateRequest` | request | deckId | `deckId` | `Long` | required | `@NotNull @Positive` | — | same |
| `CardResponse` | response | id, deckId, title, createdAt, updatedAt | same | mixed | JSON property always present; value non-null | `Card` entity: `title` (`@Column(nullable=false)`), `deck`/`deckId` (`@ManyToOne(optional=false)`, `deckId` mapped from `card.deck.id`); `id`/`createdAt`/`updatedAt` non-null generated/DB-managed | — | `card/entity/Card.java:27-66`, `card/dto/response/CardResponse.java`, `card/mapper/CardMapper.java:22` |
| `CardResponse` | response | definition, synonyms, examples, translation | same | `String`/`List<String>` | JSON property always present; value may be `null` | `Card.definition` (TEXT, no `nullable=false`), `Card.synonyms`/`Card.examples` (`text[]`, no `nullable=false`), `Card.translation` (no `nullable=false`); none of `CardRequest.definition`/`synonyms`/`examples`/`translation` are `@NotBlank`/`@NotNull` | — | `card/entity/Card.java:36-48`, `card/dto/request/CardRequest.java:13-20` |

### Learning

| DTO | Direction | Field | JSON name | Java type | Required/nullable | Validation/default | Enum/nested shape | Evidence |
|---|---|---|---|---|---|---|---|---|
| `CardReviewRequest` | request | userAnswer | `userAnswer` | `String` | required | `@NotBlank @Size(max=100)` | — | `learning/dto/request/CardReviewRequest.java` |
| `CardReviewResponse` | response | correct, correctAnswer, status, correctStreak, totalCorrect | same | `boolean`/`String`/`CardLearningStatus`/`Integer` | always present | `correctAnswer` = `card.title` (not the definition/translation) | enum `CardLearningStatus` | `learning/dto/response/CardReviewResponse.java`, `LearningMapper.java:59-64` |
| `EnrollResponse` | response | userDeckId | `userDeckId` | `Long` | always present | — | — | `learning/dto/response/EnrollResponse.java` (comment: `// FIXME: maybe need to add something else or delete it`) |
| `DeckCardResponse` | response | id, title | same | `Long`/`String` | JSON property always present; value non-null | mirrors `Card.id`/`Card.title` non-null guarantees (see `CardResponse` above) | — | `learning/dto/response/DeckCardResponse.java`, `learning/mapper/LearningMapper.java:43-50` |
| `DeckCardResponse` | response | definition, synonyms, examples, translation | same | `String`/`List<String>` | JSON property always present; value may be `null` | mirrors `Card.definition`/`synonyms`/`examples`/`translation` nullability (see `CardResponse` above) — mapped 1:1 by `LearningMapper.toDeckCardResponse` with no defaulting/null-handling | — | same |
| `DeckCardResponse` | response | progress | `progress` | `CardProgressInfo` | JSON property always present; value non-null | `LearningServiceImpl.loadDeckCardsWithProgress`/`reviewCard` always resolve an existing `UserCardProgress` before building the response; `LearningMapper.toDeckCardResponse` maps it directly with no null-handling branch — non-null is guaranteed by the current service flow, not by a DB constraint | nested `CardProgressInfo` | `learning/service/LearningServiceImpl.java:173-193`, `learning/mapper/LearningMapper.java:43-50` |
| `DeckCardResponse.CardProgressInfo` (nested) | response | status, timesSeen, timesCorrect, timesWrong, correctStreak | same | `CardLearningStatus`/`Integer` | JSON property always present; value non-null | Defaults on enroll: `timesSeen=0, timesCorrect=0, timesWrong=0, correctStreak=0, status=NEW` (`LearningMapper.toUserCardProgress`); all subsequently mutated in place, never nulled | enum `CardLearningStatus`: `NEW, LEARNING, REVIEWING, MASTERED` | `learning/dto/response/DeckCardResponse.java:16-23`, `LearningMapper.java:29-41` |

### Enum `Language`

`common/model/Language.java` — ISO 639-1 codes; used by `Deck.sourceLanguage`/`targetLanguage` (JPA `@Enumerated(STRING)`) and `DeckRequest`/`DeckListResponse`/`DeckResponse`. Not used for `User.nativeLanguage`/`targetLanguage`/`uiLanguage`, which are plain validated strings (pattern-only, no enum).

## 6. Authentication / authorization model

- **Public endpoints:** only `/api/v1/auth/**` (`SecurityConfig.java:33` — `requestMatchers("/api/v1/auth/**").permitAll()`). Every other endpoint is `anyRequest().authenticated()`.
- **JWT processing:** `JwtAuthenticationFilter` (`common/security/JwtAuthenticationFilter.java`) reads `Authorization: Bearer <token>`, extracts username (email) via `JwtService.extractUsername`, loads `UserDetails`, validates via `JwtService.isTokenValid`, and populates `SecurityContextHolder` if valid. If no header or no `Bearer ` prefix, the filter simply passes through unauthenticated (`filterChain.doFilter`) — Spring Security then rejects via the entry point.
- **401, case 1 — missing Bearer token (confirmed controlled 401):** `SecurityConfig.java:36-42` — a custom `authenticationEntryPoint` writes `{"message":"Authentication required"}` with status 401, for requests with **no** `Authorization` header or no `Bearer ` prefix. This is confirmed by code inspection: `JwtAuthenticationFilter` never throws on this path — it simply calls `filterChain.doFilter` and lets Spring Security's normal unauthenticated flow reach the entry point.
- **401, case 2 — malformed/expired/invalid-signature JWT (observable contract unclear):** `JwtAuthenticationFilter.doFilterInternal` (`common/security/JwtAuthenticationFilter.java:29-60`) calls `jwtService.extractUsername(jwt)` → `Jwts.parser()...parseSignedClaims(token)` with **no `try`/`catch`**. `jjwt` throws unchecked exceptions for expired/malformed/invalid-signature tokens, and this filter is registered via `.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)` (`SecurityConfig.java:43`) — **before** Spring Security's `ExceptionTranslationFilter` in the default chain. Confirmed facts: no catch/translation exists here, and no test exercises the real filter chain (every `@WebMvcTest` uses `@AutoConfigureMockMvc(addFilters=false)`). **Not confirmed:** the exact resulting HTTP status/body — do not assume it is the `{"message":"Authentication required"}` body from case 1. See Discrepancy O, §7, §10.
- **JWT subject:** email (not `userId`) — documented known issue (`current-architecture.md` §14).
- **Ownership checks:** performed in service layer, not in `SecurityConfig`/controllers:
  - Deck: `DeckServiceImpl.validateDeckOwnership` — `Objects.equals(deck.getOwner().getId(), currentUserId)`, else `403` (`AccessDeniedException`).
  - Card: `CardServiceImpl.validateCardOwnership` — resolves parent deck, then same deck-ownership check.
  - User: `UserServiceImpl.validateUserOwnership` — `Objects.equals(user.getId(), currentUserId)`, else `403`.
- **Public/private Deck access:**
  - `POST /decks/{id}/enroll` — checks `deck.getIsPublic()`, else `403` (`LearningServiceImpl.java:51-53`).
  - `GET /decks/{id}` and `GET /decks/{id}/study/cards`, `GET /decks/{id}/cards` (learning) — **no explicit public/private gate** on read for `GET /decks/{id}` (Discrepancy F); the two learning-scoped GETs are implicitly gated by the enrollment requirement (§ below), not by deck visibility itself.
- **Enrollment requirement:** `getStudyCards`/`getDeckCards`/`reviewCard` all require an existing `UserDeckProgress` for `(userId, deckId)`; if absent, `LearningServiceImpl.loadDeckCardsWithProgress`/`reviewCard` throw `IllegalStateException("Deck not enrolled. Please enroll first.")` (`learning/service/LearningServiceImpl.java:131-132,176-177`), which `GlobalExceptionHandler.handleIllegalState` maps to **`409 Conflict`** — not `403`. `docs/features/learning-flow.md` §5.2 describes this same case as `403` in prose; that external doc's wording does not match the actual exception type used here. Flagged as a documentation mismatch in §9.
- **401 vs 403 vs 409 boundary:** 401 = no/invalid authentication reaches the security layer (entry point — see the two distinct 401 cases above). 403 = authenticated but not authorized for the specific resource (`AccessDeniedException` from ownership/visibility checks, e.g. not deck owner, not user owner, enrolling in a private deck). 409 = authenticated and authorized, but the request conflicts with current server state (`IllegalStateException`, e.g. duplicate enrollment, email/username already taken, or the deck-not-enrolled case above) — **not** an authorization failure.
- **User profile dependency after registration:** `SecurityUtils.getCurrentUser()`/`getCurrentUserId()` require a `User` row keyed by `authUserId`; if absent, both throw `EntityNotFoundException` → `404`. Since `AuthServiceImpl.register()` creates only `AuthUser` (Discrepancy A), any endpoint that calls `SecurityUtils.getCurrentUser()`/`getCurrentUserId()` (Deck create, Card create, Learning enroll/review, User update/delete) will return `404` for a freshly registered user who has not yet called `POST /users`.
- **No `/me` endpoint** — no controller method returns "current user" from a bearer token alone; the closest equivalents are `GET /users/{id}`, `GET /users/username/{username}`, `GET /users/auth/{authUserId}`, all requiring a known identifier.
- **No refresh token — confirmed absent, out of current scope:** `JwtService` only issues a single token via `generateToken`; no refresh endpoint or refresh-token entity exists. Explicitly deferred to Level 3 (`docs/roadmap/roadmap.md:26`, `docs/architecture/current-architecture.md:46,482`, `frontend/AGENTS.md` "No refresh token" hard gate) — not a candidate MVP backend gap.
- **No backend logout endpoint — confirmed absent, out of current scope:** no controller method invalidates/blacklists a JWT; logout is intentionally a frontend-only token-discard operation under the current Level 1 client-token model (`frontend/AGENTS.md` "Auth architecture (Level 1)"; `docs/architecture/current-architecture.md:683-686`) — not a candidate backend gap.

## 7. Error contract catalogue

| HTTP | Body shape | Trigger | Operations | Handler/exception | Test evidence |
|---|---|---|---|---|---|
| 400 | `{"errors": {field: message}}` | Bean validation failure (`@Valid` request body) | All endpoints with `@Valid @RequestBody` | `GlobalExceptionHandler.handleMethodArgumentNotValid` (`MethodArgumentNotValidException`) | `DeckControllerTest.create_shouldReturn400_whenTitleBlank`, `CardControllerTest.generateBulk_shouldReturn400_whenSizeExceedsLimit`, `AuthControllerTest.register_shouldReturn400_whenEmailInvalid`, `UserControllerTest.update_shouldReturn400_whenFirstNameBlank` |
| 400 | `{"message": "Invalid request body: ..."}` | Malformed JSON / unreadable body | Any `@RequestBody` endpoint | `GlobalExceptionHandler.handleHttpMessageNotReadable` | No direct test found; code path only (`GlobalExceptionHandler.java:49-53`) |
| 400 | `{"message": "..."}` | `IllegalArgumentException` (e.g. bulk size exceeds configured `ai.max-bulk-size`) | `POST /cards/bulk-generate` | `GlobalExceptionHandler.handleIllegalArgument`, `CardServiceImpl.validateBulkSize` | Service-level `IllegalArgumentException` behavior **is** directly tested: `CardServiceImplTest.generateBulk_shouldThrowBadRequest_whenSizeExceedsLimit` (above the configured limit throws) and `generateBulk_shouldNotThrow_whenSizeEqualsLimit` (at-limit boundary does not throw). `GlobalExceptionHandler.handleIllegalArgument`'s `IllegalArgumentException → 400` mapping is proven by code inspection only (`GlobalExceptionHandler.java:73-77`), not a dedicated test. No `@WebMvcTest`/controller-level test exercises the complete HTTP path for this specific `validateBulkSize` scenario — `CardControllerTest.generateBulk_shouldReturn400_whenSizeExceedsLimit` exercises a different validation layer (the DTO-level `@Size(max=100)` on `titles`). |
| 401 | `{"message":"Authentication required"}` | Missing Bearer token (no `Authorization` header, or no `Bearer ` prefix) — `JwtAuthenticationFilter` passes through unauthenticated, request reaches `FilterSecurityInterceptor` unauthenticated | Any secured endpoint (shared contract for every `Auth = JWT` row in §4 — see §6) | `SecurityConfig` custom `authenticationEntryPoint` | Confirmed by code inspection (this path never throws). No test exercises the real filter chain (`AuthControllerTest`/`DeckControllerTest`/etc. all use `@AutoConfigureMockMvc(addFilters=false)`) |
| 401 | **status/body unclear** | Malformed, expired, or invalid-signature Bearer token — `jjwt` throws an unchecked exception inside `JwtAuthenticationFilter` before Spring Security's `ExceptionTranslationFilter` can translate it | Any secured endpoint with an invalid (not missing) JWT | No handler catches this — uncaught exception propagates up the filter chain | **Confirmed code-path risk** (no `try/catch`; filter registered before `ExceptionTranslationFilter`); **observable HTTP response contract not confirmed** — no filter-chain test exists. Do not assume this returns the `{"message":"Authentication required"}` body above. See Discrepancy O, §10 |
| 401 | `{"message": "Invalid email or password"}` | `BadCredentialsException` from login | `POST /auth/login` | `GlobalExceptionHandler.handleAuthentication` (`AuthenticationException` superclass) | `AuthControllerTest.login_shouldReturn401_whenInvalidCredentials` |
| 403 | `{"message": "..."}` | `AccessDeniedException` — ownership/visibility violation | Deck update/delete, Card create/update/delete/bulk-generate, User update/delete, Deck enroll (private deck) | `GlobalExceptionHandler.handleAccessDenied` | `DeckControllerTest.update_shouldReturn403_whenNotOwner`, `CardControllerTest.create_shouldReturn403_whenNotDeckOwner`, `UserControllerTest.update_shouldReturn403_whenNotSelf`, `DeckServiceImplTest` (update/delete forbidden) |
| 404 | `{"message": "..."}` | `EntityNotFoundException` — resource not found | Deck/Card/User get/update/delete, enroll (deck not found), review (card/progress not found) | `GlobalExceptionHandler.handleEntityNotFound` | `DeckControllerTest.getById_shouldReturn404...`, `UserControllerTest.getById_shouldReturn404...`, `LearningControllerTest.enroll_shouldReturn404...`, `LearningControllerTest.review_shouldReturn404...` |
| 409 | `{"message": "..."}` | `IllegalStateException` — duplicate enroll, email/username taken, "not enrolled" | Register (email taken), User create (already exists/username taken), Learning enroll (already enrolled), Learning study/deck-cards/review (not enrolled) | `GlobalExceptionHandler.handleIllegalState` | `AuthControllerTest.register_shouldReturn409_whenEmailAlreadyRegistered`, `LearningControllerTest.enroll_shouldReturn409_whenAlreadyEnrolled` |
| 409 | `{"message": "Data integrity violation"}` | `DataIntegrityViolationException` not matching the specific duplicate-enroll constraint text | Any DB constraint violation not explicitly translated | `GlobalExceptionHandler.handleDataIntegrityViolation` | `LearningControllerTest.enroll_shouldReturn409_whenDataIntegrityViolation` |
| 429 | `{"error":"RATE_LIMIT_EXCEEDED","message":"...","timestamp":"..."}` | `RateLimitExceededException` — per-user (`UserRateLimiter`) or AI provider (`AiRateLimiter`) limit exceeded | Login, Register, Profile update, Deck create/update/delete, Card create/update/delete, Card bulk-generate (both endpoint and provider layer) | `GlobalExceptionHandler.handleRateLimitExceeded` | `AuthControllerTest.login_shouldReturn429_whenRateLimitExceeded` |
| 503 | `{"message": "AI service unavailable: ..."}` | `AiServiceException` — API key missing, OpenAI HTTP error, JSON parse failure | Card create with `autoGenerate:true`, bulk-generate | `GlobalExceptionHandler.handleAiServiceException` | No `@WebMvcTest` evidence found for the 503 HTTP mapping specifically; unit-level evidence in `AiCardGenerationServiceTest`/`OpenAiProviderTest` for the exception itself |
| 500 | `{"message": <exception message, possibly null>}` | Any uncaught `Exception` | Any endpoint | `GlobalExceptionHandler.handleException` (catch-all) | No test evidence found; code path only (`GlobalExceptionHandler.java:92-96`) |

**Every JWT-protected operation in §4 implicitly carries both 401 rows above as possible responses**, in addition to whatever endpoint-specific errors are listed in its `Errors` column (see the shared-401-contract note in §4).

**Note:** the catch-all 500 handler returns `exception.getMessage()` directly in the body, which can leak internal exception text to the client — flagged as a candidate gap in §9, not a discrepancy item requested in §8.

## 8. Candidate discrepancy investigation (Task items A–P)

| Item | Claim | Result | Evidence | Frontend impact |
|---|---|---|---|---|
| A | `register()` creates only `AuthUser`, architecture doc says `AuthUser + User` | **confirmed** | `AuthServiceImpl.register()` (`auth/service/AuthServiceImpl.java:55-75`) only builds/saves `AuthUser`; no `User` creation anywhere in the method. `current-architecture.md:211` states `Create AuthUser + User`. | Register flow cannot produce a usable `User` profile by itself; every downstream authenticated action requiring `SecurityUtils.getCurrentUser()`/`getCurrentUserId()` (Deck create, Card create, Enroll, Review, User update/delete) will 404 until a separate `POST /users` call succeeds. Blocks Register → Create Deck flow design. |
| B | Deck creation / learning operations require a `User` record via `SecurityUtils`, but canonical Register UI has only email/password | **confirmed** | `SecurityUtils.getCurrentUser()`/`getCurrentUserId()` (`common/security/SecurityUtils.java:42-77`) throw `EntityNotFoundException` if no `User` row exists for the `AuthUser`. `RegisterRequest` (`auth/dto/request/RegisterRequest.java`) has only `email`/`password`; `docs/frontend/design-reference/MANIFEST.md` Register entry references only "register form layout," and `docs/frontend/DESIGN.md` does not list a profile-creation screen. | An explicit Profile-creation step (calling `POST /users`, `CreateUserRequest`) is a required, currently undesigned, product surface between Register and any Deck/Learning action. |
| C | `GET /api/v1/decks` returns every Deck via `findAll()`, no owner/public filtering | **confirmed** | `DeckServiceImpl.getAll()` — `deckRepository.findAll().stream().map(deckMapper::toListResponse).toList()` (`deck/service/DeckServiceImpl.java:76-80`). No `WHERE` clause, no `isPublic` filter, no owner filter. | Cannot safely back either a "Created Decks" list or a "Discover" list: frontend-side filtering of the unfiltered result set is **not an acceptable authorization/privacy solution**, since private decks of other users would already have been transmitted to the client before any filtering happens. Both surfaces are blocked pending an owner-scoped and/or public-only backend contract (dedicated endpoint(s) or backend-enforced query filtering). |
| D | No separate Created Decks list endpoint | **confirmed** | Only `DeckController` GET methods are `getById` and `getAll` (`deck/controller/DeckController.java:35-43`); no owner-scoped query method exists in `DeckRepository`/`DeckServiceImpl`. | "Created Decks" screen has no dedicated backend contract. It cannot be safely implemented by client-side filtering of the unfiltered `GET /decks` result (see Discrepancy C) — the screen is **blocked** pending an owner-scoped backend contract (dedicated endpoint or query filtering), which would also need a way to resolve the current `User.id` (see the `/me` gap in §9). |
| E | No separate Discover/public Deck list/search endpoint | **confirmed** | Same as D — `GET /decks` is the only list endpoint, unfiltered. No search/query parameters accepted. | Discover screen has no dedicated backend contract. It cannot be safely implemented by client-side filtering of the unfiltered `GET /decks` result (see Discrepancy C) — the screen is **blocked** pending a public-only backend contract (dedicated endpoint or query filtering); no search/sort/pagination support exists either way. |
| F | `DeckServiceImpl.getById()` does not enforce private-deck visibility | **confirmed** | `DeckServiceImpl.getById()` (`deck/service/DeckServiceImpl.java:66-72`) only checks existence, no `isPublic`/ownership check. | Any authenticated user can fetch full deck content (including cards, via `DeckResponse.cards`) for a private deck belonging to another user by guessing/enumerating IDs. Blocks safely exposing `deck_details_public` vs `deck_details_owner` as distinct trust boundaries without a frontend-side guard (which is not a substitute for backend authorization). |
| G | `GET /api/v1/cards` returns every Card globally | **confirmed** | `CardServiceImpl.getAll()` — `cardRepository.findAll().stream().map(cardMapper::toResponse).toList()` (`card/service/CardServiceImpl.java:166-171`). No deck/owner filter. | Cannot be used as a deck-scoped or owner-scoped card list without exposing all cards in the system, including private-deck cards belonging to other users. |
| H | `CardServiceImpl.getById()` does not enforce ownership/visibility | **confirmed** | `CardServiceImpl.getById()` (`card/service/CardServiceImpl.java:159-164`) only checks existence, no `validateCardOwnership`/visibility check (unlike `update`/`delete`, which do call `validateCardOwnership`). | Any authenticated user can fetch full content of any card by ID, including cards in private decks not owned by them. |
| I | No deck-scoped owner Card list endpoint; distinguish from `GET /decks/{deckId}/cards` | **confirmed** | No controller method exists for "list cards in deck X as its owner for management purposes." `LearningController.getDeckCards` → `GET /decks/{deckId}/cards` (`learning/controller/LearningController.java:37-40`) requires enrollment (`UserDeckProgress` lookup) and returns cards **with learning progress** (`DeckCardResponse`), which is a Learning-Layer view, not a Content-Layer owner-management view. An owner viewing their own deck's cards for editing currently relies on `DeckResponse.cards` (from `GET /decks/{id}`), which returns `CardResponse` (no progress) — functionally usable, but is not a dedicated "owner card list" endpoint and is not deck-scoped in the `CardController`. | Deck Details (Owner) screen's card management list must be sourced from `DeckResponse.cards` (via `DECK-02`), not from `CardController` or the Learning endpoint. This distinction must be preserved when designing the frontend data-fetching layer. |
| J | No Learning Decks list or aggregate Progress endpoint | **confirmed** | No controller/service method returns "all decks the current user is enrolled in" or "aggregate progress across decks." `LearningController` only exposes deck-scoped (`{deckId}`) and card-scoped (`{cardId}`) operations (`learning/controller/LearningController.java`). `UserDeckProgressRepository`/`UserCardProgressRepository` were inspected via their usage in `LearningServiceImpl` — only per-deck/per-user lookup methods are used (`findByUserIdAndDeckId`, `findAllByUserDeckProgressId`), no "find all progress for user" aggregate method is called anywhere. | "Learning" (My Decks — Learning) and "Progress" screens have **no backend list/aggregate contract** at all — this is a missing-endpoint gap, not merely a filtering gap (see §9). |
| K | `getStudyCards()` selects only LEARNING and NEW, excluding REVIEWING/MASTERED | **confirmed** | `LearningServiceImpl.getStudyCards()` (`learning/service/LearningServiceImpl.java:84-110`) filters `CardLearningStatus.LEARNING` then `CardLearningStatus.NEW` only. `docs/features/learning-flow.md` §6 documents this explicitly as a known gap. | Study screen will never re-surface `REVIEWING` cards for spaced practice; "all caught up" state may trigger prematurely while `REVIEWING` cards still exist. |
| L | UI contract uses `isPrivate`, `DeckRequest` uses `isPublic` | **confirmed** | `DeckRequest.isPublic` (`deck/dto/request/DeckRequest.java:17`). `docs/frontend/DESIGN.md` §"Domain / UI boundaries" states: "Create/Edit Deck includes the Private Deck / `isPrivate` control." No backend `isPrivate` field exists anywhere. | Frontend must invert the boolean at the form/DTO boundary (`isPrivate` UI state ↔ `isPublic` wire field) — a required, currently undocumented, mapping. Not implemented in Phase 0.4A per task instructions. |
| M | Creator Profile has User lookup endpoints but no confirmed creator-owned/public Decks endpoint | **confirmed** | `UserController` provides `GET /users/{id}`, `GET /users/username/{username}`, `GET /users/auth/{authUserId}` (`user/controller/UserController.java:30-43`) — profile data only. No endpoint accepts a creator/owner ID to list that creator's public decks; `GET /decks` returns everything unfiltered (see C/D/E). | Creator Profile screen's "decks by this creator" section has no dedicated or safely filterable backend contract. Client-side filtering of the unfiltered `GET /decks` result is **not an acceptable workaround** — it would transmit private decks of other owners to the client (compounding F). This surface is **blocked** pending a creator-scoped backend contract. |
| N | Bulk AI generation returns only successful cards, no failed-titles report | **confirmed** | `CardServiceImpl.createBulk()` (`card/service/CardServiceImpl.java:118-157`) — `failedTitles` list is built and logged (`log.warn`) but never included in the `List<CardResponse>` return value; no wrapper DTO with `created`/`failed` exists. `docs/features/ai-generation-flow.md` §5.2 and §11 document this as a known, unresolved issue. | AI generation screen cannot inform the user which titles failed or why; a silent partial-success UX gap. |
| O | Invalid/expired JWT exceptions may occur inside the filter before MVC exception handling | **confirmed code-path risk; observable HTTP response contract unclear** | `JwtAuthenticationFilter.doFilterInternal()` (`common/security/JwtAuthenticationFilter.java:29-60`) calls `jwtService.extractUsername(jwt)` → `JwtService.extractAllClaims()` → `Jwts.parser()...parseSignedClaims(token)` with **no try/catch**. The `jjwt` library throws unchecked exceptions (e.g. expired/malformed/signature) from this call. Since this filter is registered via `.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)` (`SecurityConfig.java:43`), it runs **before** Spring Security's `ExceptionTranslationFilter` in the default chain — confirmed by code inspection. No test exercises this: every `@WebMvcTest` in the repository uses `@AutoConfigureMockMvc(addFilters = false)`, which disables the entire Spring Security filter chain including `JwtAuthenticationFilter` itself — also confirmed. | The absence of a catch/translation for this case, and the absence of any filter-chain-level test, are **confirmed**. The exact resulting HTTP status/body is **not confirmed** either way — it must not be assumed to be the custom `{"message":"Authentication required"}` 401 body from the missing-Bearer case (§6/§7), nor assumed to be a generic Spring Boot error page, without a dedicated integration test or manual verification. This is an **unresolved question** — see §10. |
| P | Stale statements in `current-architecture.md`/`current-sprint.md` | **confirmed** (see below) | See list below | Documentation accuracy risk for future frontend work; not rewritten in this task per instructions. |

**Stale statements identified (not rewritten, per task scope):**
- `docs/architecture/current-architecture.md:211` — `"Create AuthUser + User"` contradicts actual `AuthServiceImpl.register()` behavior (Discrepancy A).
- `docs/architecture/current-architecture.md:274` — API surface table does not flag `GET /decks` as globally unfiltered (only notes "no cards", not the missing owner/public filter — Discrepancy C).
- `docs/roadmap/current-sprint.md:67` — `"scaffold ✅, Technical Foundation next"` is stale; `current-architecture.md:7` and `:643` already state Technical Foundation is complete (frontend scaffold, path aliases, RTK Query, Redux/session, React Router, testing infra all done per `current-sprint.md`'s own checked items in Группа 0). This line was corrected as part of the minimal `current-sprint.md` update in this task (§ below).

## 9. Candidate backend gaps

**Count: 16 confirmed candidate backend gaps** (main table below). Items that are frontend integration mappings, confirmed absent/out-of-current-scope capabilities, or known deferred limitations are listed separately in §9.1–§9.3 and are **not** included in this count.

| Gap | Classification | Description | Evidence |
|---|---|---|---|
| Register does not create `User` | incomplete operation | See Discrepancy A. | `AuthServiceImpl.register()` |
| No Created Decks list endpoint | missing endpoint | See Discrepancy D. | `DeckController` |
| No Discover/public Deck list endpoint | missing endpoint | See Discrepancy E. | `DeckController` |
| No Learning Decks list endpoint | missing endpoint | See Discrepancy J. | `LearningController` |
| No aggregate Progress endpoint | missing endpoint | See Discrepancy J. | `LearningController` |
| No Creator-owned/public Decks endpoint | missing endpoint | See Discrepancy M. | `UserController`, `DeckController` |
| `GET /decks` unfiltered | filtering/access gap | See Discrepancy C. | `DeckServiceImpl.getAll()` |
| `GET /cards` unfiltered | filtering/access gap | See Discrepancy G. | `CardServiceImpl.getAll()` |
| `GET /decks/{id}` no visibility check | filtering/access gap | See Discrepancy F. | `DeckServiceImpl.getById()` |
| `GET /cards/{id}` no ownership/visibility check | filtering/access gap | See Discrepancy H. | `CardServiceImpl.getById()` |
| Bulk generation drops failed titles | incomplete DTO | See Discrepancy N. | `CardServiceImpl.createBulk()` |
| Study excludes `REVIEWING` cards | incomplete operation | See Discrepancy K. | `LearningServiceImpl.getStudyCards()` |
| JWT filter exception path — observable contract unclear | error-contract gap | See Discrepancy O, §6, §7. | `JwtAuthenticationFilter` |
| No `/me` (current-user) endpoint | missing endpoint | No controller returns "current user" from a bearer token alone. **Concrete blocking reason:** the JWT subject is the user's email, not a `User.id`/`authUserId` (§6); the only lookup endpoints (`GET /users/{id}`, `GET /users/username/{username}`, `GET /users/auth/{authUserId}`) all require an identifier the frontend does not yet possess immediately after login/registration — no endpoint accepts "the current token" and returns the corresponding `UserResponse`. | `UserController`, `SecurityUtils` |
| "Not enrolled" mapped to 409, docs say 403 | documentation mismatch | See §6 correction note. | `LearningServiceImpl`, `GlobalExceptionHandler`, `docs/features/learning-flow.md` §5.2 |
| Catch-all 500 leaks exception message | error-contract gap | `GlobalExceptionHandler.handleException` returns raw `exception.getMessage()`. | `GlobalExceptionHandler.java:92-96` |

### 9.1 Frontend integration mapping (not a backend gap)

| Mapping | Description | Evidence |
|---|---|---|
| `isPublic` (backend) ↔ `isPrivate` (UI) | `DeckRequest`/`DeckListResponse`/`DeckResponse` use `isPublic`; `docs/frontend/DESIGN.md` describes a "Private Deck / `isPrivate`" UI control. This is a **required frontend-side boundary mapping** (`isPrivate = !isPublic`) at the form/DTO boundary — the backend field itself is complete and functional, so this is not a missing backend capability. Not implemented in Phase 0.4A per task scope. | Discrepancy L; `deck/dto/request/DeckRequest.java:17` |

### 9.2 Confirmed absent / out of current scope (not candidate MVP gaps)

| Capability | Status | Evidence |
|---|---|---|
| Refresh token | Confirmed absent; explicitly deferred to Level 3 | `docs/roadmap/roadmap.md:26`; `docs/architecture/current-architecture.md:46,482`; `frontend/AGENTS.md` "No refresh token" hard gate |
| Backend logout endpoint | Confirmed absent; intentional for the current Level 1 client-token model | `frontend/AGENTS.md` "Auth architecture (Level 1)"; `docs/architecture/current-architecture.md:683-686` |

### 9.3 Known deferred limitations

| Limitation | Status | Evidence |
|---|---|---|
| No pagination on any list endpoint | Known, already documented, deferred to Level 2 — not an unresolved product decision | `docs/architecture/current-architecture.md:403` ("No pagination for list endpoints \| 🟡 Medium \| Level 2") |

## 10. Unresolved questions

**Count: 4 unresolved questions.**

| Question | Blocks | Why unresolved from code alone |
|---|---|---|
| What is the actual observed HTTP response body/status for an expired or malformed (not missing) JWT? | Any authenticated screen's 401-handling/session-expiry UX (`app`-level error listener design) | No test exercises the live Spring Security filter chain (`JwtAuthenticationFilter` + `ExceptionTranslationFilter` ordering); requires either a dedicated integration test or manual `curl`/Postman verification against a running instance. |
| Should Register collect full profile fields (username, names, languages) directly, or should a separate mandatory "Complete your profile" step exist before any Deck/Learning action? | Register screen scope, routing after registration (Discrepancy A/B) | This is a product decision not resolvable from repository evidence — `CreateUserRequest` exists and is callable, but no code or doc states which UX sequence is intended. |
| Should `GET /decks` be split into distinct Created/Discover backend contracts (dedicated endpoints), or should the existing endpoint gain backend-enforced filtering (query parameters/ownership scoping)? Client-side filtering of the unfiltered list is not an acceptable alternative (see Discrepancy C). | Created Decks screen, Discover screen data-fetching design | No roadmap or design doc commits to either backend approach; this is the kind of backend-gap decision Phase 0.4A intentionally defers ("Do not yet decide the final MVP scope"). |
| Is the private-deck exposure via `GET /decks/{id}` and `GET /cards/{id}` (Discrepancies F, H) an accepted temporary Level-1 gap, or a blocking security issue that must be fixed before any public-facing frontend ships? | Deck Details (Public), Discover, Creator Profile screens | No accepted-decision entry in `current-architecture.md` §16 addresses this; it is absent from `backend/IMPROVEMENTS.md` per this task's read scope. |

## 11. Domain capability summary

| Capability | Status | Backend contract |
|---|---|---|
| Auth (login/register) | partial | AUTH-01 implemented; AUTH-02 partial (no `User` created) |
| User profile | implemented | USER-01..06 |
| Created/owned Decks (list) | missing | No dedicated endpoint; DECK-03 unfiltered |
| Public/private Decks (list) | missing | No dedicated endpoint; DECK-03 unfiltered |
| Deck CRUD | partial | DECK-01,04,05 implemented; DECK-02 (read) missing visibility enforcement |
| Manual Card CRUD | partial | CARD-01,05,06 implemented; CARD-03 (read) missing ownership/visibility enforcement; CARD-04 (list) unfiltered/missing deck-scoping |
| AI generation | partial | CARD-01 (`autoGenerate`), CARD-02 (bulk) implemented; CARD-02 drops failed-title reporting |
| Discover | missing | No dedicated endpoint |
| Creator Profile | partial | User lookup implemented (USER-02..04); creator-owned deck list missing |
| Enrollment | implemented | LEARN-01 |
| Learning Decks (list) | missing | No dedicated endpoint |
| Learning Deck Details | implemented | LEARN-03 (`DeckCardResponse` with progress) |
| Study | partial | LEARN-02 implemented but excludes `REVIEWING` cards |
| Answer review | implemented | LEARN-04 |
| Progress (aggregate) | missing | No dedicated endpoint; per-card progress only exists nested inside `DeckCardResponse` |

Preserved boundaries (per `docs/frontend/DESIGN.md` and `docs/architecture/current-architecture.md` §8):
- `Deck`/`Card` = content (owner-mutable, no per-user state).
- `UserDeckProgress`/`UserCardProgress` = learning state (created on enroll, mutated on review).
- "Created" (owner content management) and "Learning" (enrolled study) are distinct product collections with no backend endpoint currently unifying or listing either collection directly. Created/Discover surfaces cannot be safely derived by client-side filtering of the unfiltered `GET /decks` (see Discrepancy C) and are **blocked** pending a backend fix; a Learning Decks list is entirely absent (no endpoint exists at all).

## 12. Phase 0.4A summary

- **23 existing HTTP operations:** 16 `implemented`, 7 `partial`, 0 `planned`, 0 `missing`, 0 `unclear` (§4). `CARD-04` is `partial`, not `missing` — it is an existing, unsafe/unfiltered endpoint with a fully traced controller → service → repository path.
- **Missing product capabilities/backend contracts (6):** Created Decks list, Discover/public Deck list, Learning Decks list, aggregate Progress endpoint, Creator-owned/public Decks endpoint, `/me` current-user endpoint (§9).
- **Confirmed security/filtering gaps (4):** `GET /decks` unfiltered, `GET /cards` unfiltered, `GET /decks/{id}` no visibility check, `GET /cards/{id}` no ownership/visibility check (§9). Two additional error-contract gaps — the JWT filter exception path and the catch-all 500 message leak — are documented in §9 but are not privacy/filtering gaps specifically.
- **Frontend integration mappings (1):** `isPublic` (backend) ↔ `isPrivate` (UI) inversion — a required frontend-side mapping, not a backend gap (§9.1).
- **Confirmed absent/out-of-scope capabilities (2):** refresh token (deferred to Level 3), backend logout endpoint (intentional for Level 1) (§9.2). Pagination is a related but distinct **known deferred limitation** (Level 2, §9.3), not an out-of-scope capability and not an unresolved product decision.
- **Unresolved questions (4):** expired/malformed JWT observable response; Register→Profile UX sequence; `GET /decks` split-vs-filter backend approach; whether private-deck exposure via `GET /decks/{id}`/`GET /cards/{id}` is an accepted temporary gap or a blocking issue (§10).

Total candidate backend gaps counted in §9's main table: **16**. Endpoint-operation counts (23 total, 16 implemented / 7 partial) and domain-capability counts (§11) are tracked separately and must not be summed together.
