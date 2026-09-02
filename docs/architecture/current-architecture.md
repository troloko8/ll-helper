# Current Architecture

> **Project:** LLHelper — AI Language Cards
> **Current level:** Level 1 — Vertical Full-Stack Flow
> **Current sprint:** see `docs/roadmap/current-sprint.md`
> **Last updated:** 2026-08-30
> **Status:** Backend foundation complete (Level 0). Frontend Technical Foundation complete (path aliases, strict TS, Vite proxy, `.env.example`, RTK Query, Redux/session, React Router, testing infrastructure). Auth/product flow screens next.

---

## 1. Project Overview

**LLHelper** — language learning application for vocabulary study via flashcards. Users create decks, add cards with translations and examples, and go through study sessions with progress tracking.

**Core concept:** Two-layer architecture — Content Layer (decks and cards) and Learning Layer (user progress).

---

## 2. Current Level / Scope

**Level 1 — Vertical Full-Stack Flow**

**Backend (Level 0 — complete):**
- ✅ Spring Boot backend with JWT authentication
- ✅ CRUD for decks
- ✅ CRUD for cards
- ✅ AI card generation via OpenAI API
- ✅ Learning Flow: enroll, study, review with progress tracking
- ✅ Mapper layer, rate limiting, ownership checks completed
- ✅ Liquibase schema control and Level 0 integrity constraints/cascades (V1–V11 defined; V11 adds G-06 enrollment ordering support)
- ⏸ Additional performance indexes deferred to Level 2

**Frontend (Level 1 — in progress):**
- ✅ React/TypeScript/Vite scaffold initialized
- ✅ Frontend architecture decisions approved and documented
- ✅ Technical Foundation scaffold/config normalization (path aliases, strict TS, Vite proxy, `.env.example`, RTK Query, Redux/session, React Router)
- ✅ Testing infrastructure (Vitest, jsdom, React Testing Library, MSW)
- [ ] Auth flow screens
- [ ] Deck & cards flow screens
- [ ] Study flow screens
- [ ] End-to-end vertical flow

**Out of scope for Level 1:**
- OpenAPI/Swagger (Level 2)
- Docker/CI (Level 2)
- Refresh tokens (Level 3)

---

## 3. Technology Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Java 21, Spring Boot 4.0.6 |
| **Database** | PostgreSQL, Spring Data JPA (Hibernate), Liquibase |
| **Security** | Spring Security, JWT (jjwt 0.12.6) |
| **AI** | OpenAI API (gpt-4o-mini), WebFlux HTTP client |
| **Mapper** | MapStruct 1.6.3 |
| **Build** | Maven |
| **API Docs** | Postman collection (`LLHelper.postman_collection.json`) |
| **Frontend (installed)** | React 19, TypeScript 6, Vite 8, Redux Toolkit 2, React Router 7, React Hook Form 7, Zod 4, Vitest 4 |
| **Frontend (configured)** | Path alias `@/*` → `src/*`, `strict: true`, Vite dev proxy `/api` → `http://localhost:8080`, `.env.example`, Vitest + jsdom + React Testing Library + MSW |
| **Frontend (approved target, not yet configured)** | CSS Modules / design tokens, Playwright (E2E) |

---

## 4. High-Level Architecture

```text
┌─────────────────────────────────────────────────────────┐
│          Client / Postman / Future Frontend             │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Spring Boot Backend                        │
│                                                         │
│   Auth        User        Deck/Card        Learning     │
│   Module      Module      Module           Module       │
│                                                         │
│   AI Module              Common / Security / Exception  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL (Local / Dev)                   │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Architecture Principles

1. Content and progress are separated — Learning Layer reads content but never mutates it.
2. Controllers hold no business logic — only routing and request/response mapping.
3. Services own business use cases and transactions.
4. Repositories only access the database.
5. API always returns DTOs, never entities.
6. AI module generates raw data; Card/Deck services own persistence.
7. Each domain module is self-contained — controller, service, repository, entity, DTOs in one package.

---

## 6. Domain Modules

The backend follows a **package-by-feature** (domain-oriented modular monolith) structure, where each domain module is self-contained.

| Module | Package | Responsibility |
|--------|---------|----------------|
| `auth` | `com.llhelper.auth` | Registration, login, JWT |
| `user` | `com.llhelper.user` | User profile |
| `deck` | `com.llhelper.deck` | Deck content management |
| `card` | `com.llhelper.card` | Cards |
| `learning` | `com.llhelper.learning` | Enrollment, study, progress |
| `ai` | `com.llhelper.ai` | Card generation via OpenAI |
| `common` | `com.llhelper.common` | Security, exceptions, config |

**Each module internal structure:**

```text
module/
├── controller/
├── service/
├── repository/
├── entity/
├── mapper/
├── dto/
│   ├── request/
│   └── response/
└── enums/  (if applicable)
```

---

## 7. Main Domain Model

### Content Layer

```text
AuthUser ──1:1──▶ User ──1:N──▶ Deck ──1:N──▶ Card
```

| Entity | Table | Key Fields |
|--------|-------|------------|
| `AuthUser` | `auth_users` | email (unique), passwordHash, role |
| `User` | `users` | firstName, lastName, username (unique), nativeLanguage, targetLanguage, uiLanguage |
| `Deck` | `decks` | title, description, sourceLanguage, targetLanguage, isPublic, owner → User |
| `Card` | `cards` | title, definition, synonyms[], examples[], translation, deck → Deck |

### Learning Layer

```text
User ──1:N──▶ UserDeckProgress ──1:N──▶ UserCardProgress
                    │                           │
                    ▼                           ▼
               Deck               Card
```

| Entity | Table | Key Fields |
|--------|-------|------------|
| `UserDeckProgress` | `user_deck_progress` | userId, deckId, status, enrolledAt, lastStudiedAt |
| `UserCardProgress` | `user_card_progress` | userId, cardId, userDeckProgressId, timesSeen, timesCorrect, timesWrong, correctStreak, status, lastReviewedAt |

### Enums

- `CardLearningStatus`: `NEW` → `LEARNING` → `REVIEWING` → `MASTERED`
- `UserDeckStatus`: `ACTIVE`, `PAUSED`, `ARCHIVED`

---

## 8. Content Layer vs Learning Layer

| Aspect | Content Layer | Learning Layer |
|--------|---------------|----------------|
| **Entities** | Deck (Deck), Card | UserDeckProgress, UserCardProgress |
| **Lifecycle** | Created by deck owner | Created on enroll |
| **Mutability** | Modified by owner | Modified on review |
| **Access control** | Public/private via `isPublic` | Enrolled users only |

**Current delete behavior:** hard delete with database-level `ON DELETE CASCADE` for Deck/Card and related progress records, implemented in V4/V5. Soft delete is deferred to Level 1.

Progress entities must not modify content entities.

---

## 9. Request Lifecycle

Typical secured request:

1. Client sends HTTP request with `Authorization: Bearer <JWT>`.
2. `JwtAuthenticationFilter` validates the token.
3. `SecurityContext` is populated with `UserDetails`.
4. Controller receives request DTO and delegates to service.
5. Service executes business logic.
6. Repository loads/saves entities.
7. **Mapper** converts entity → response DTO (MapStruct).
8. Controller returns `ResponseEntity<ResponseDTO>`.

**Mapper layer:**
- Services no longer contain private `toResponse()` methods
- MapStruct mappers are injected as Spring beans
- Example: `CardMapper.toResponse(card)` instead of manual DTO construction

---

## 10. Current Backend Flow

### Authentication Flow

```text
POST /api/v1/auth/register  ──▶  Create AuthUser only    ──▶  Return JWT
POST /api/v1/auth/login     ──▶  Validate credentials    ──▶  Return JWT
GET /api/v1/users/me        ──▶  Resolve current profile from JWT subject email; 404 if profile is not created
```

> **Current behavior (as implemented):** `AuthServiceImpl.register()` creates only `AuthUser`; no `User` profile row is created by `/auth/register` itself. Every authenticated action that resolves the current `User` (`SecurityUtils.getCurrentUser()`/`getCurrentUserId()`) will fail until a separate `POST /api/v1/users` call succeeds.
>
> **Accepted Level 1 target flow (Phase 0.4C, implemented backend bootstrap; frontend orchestration pending):**
> ```text
> POST /auth/register → JWT → GET /users/me → 404 → /onboarding/profile (frontend) → POST /users → GET /users/me → 200 UserResponse → authenticated app
> ```
> `GET /api/v1/users/me` is JWT-protected and resolves the JWT subject email through `AuthUser` to the linked `User`. It returns `404` without creating a profile when the link is absent.

> **JWT error contract (as implemented):** `JwtAuthenticationFilter` catches `io.jsonwebtoken.JwtException` (expired, malformed, invalid-signature) and `IllegalArgumentException` around JWT parsing/validation, clears `SecurityContextHolder`, and delegates to the shared `RestAuthenticationEntryPoint` bean — the same one registered as `SecurityConfig`'s `authenticationEntryPoint` for the missing-Bearer-token case. Every invalid-JWT scenario therefore returns an identical controlled `401 {"message":"Authentication required"}` response; the client cannot distinguish missing vs. expired vs. malformed vs. invalid-signature tokens from the response body.

### Learning Flow

```text
POST /api/v1/decks/{id}/enroll
        │
        ▼
Create UserDeckProgress (status=ACTIVE)
Create UserCardProgress for each card (status=NEW)
        │
        ▼
GET /api/v1/decks/{id}/study/cards
        │
        ▼
Return up to 10 cards (LEARNING priority, then NEW)
        │
        ▼
POST /api/v1/cards/{id}/review
        │
        ▼
Validate userAnswer (basic case-insensitive text match)
Update UserCardProgress (timesSeen, timesCorrect/Wrong, correctStreak, status)
Return result (correct/incorrect, new status, streak)
```

> **Note:** Answer checking is currently basic (case-insensitive trim match).
> Does not handle synonyms, typos, or variants like "a blueprint" vs "blueprint".
> Automatic checking may be replaced or combined with self-check (Again / Hard / Good / Easy).
> See Open Decisions.

### AI Generation Flow

```text
POST /api/v1/cards/bulk-generate
        │
        ▼
AiRateLimiter.acquirePermit()
        │
        ▼
OpenAiProvider.generate(title, sourceLanguage, targetLanguage)
        │
        ▼
AiResponseParser.parse(response)
        │
        ▼
CardService.save(cards)
```

---

## 11. Current API Surface

| Endpoint | Method | Auth | Description | Response DTO |
|----------|--------|------|-------------|--------------|
| `/api/v1/auth/register` | POST | — | Register new user | `AuthResponse` |
| `/api/v1/auth/login` | POST | — | Login, get JWT | `AuthResponse` |
| `/api/v1/users` | POST | JWT | Create user profile for current auth account | `UserResponse` |
| `/api/v1/users/me` | GET | JWT | Resolve current profile from JWT subject email; 404 if profile is not created | `UserResponse` |
| `/api/v1/users/{id}` | GET/PUT/DELETE | JWT | User profile CRUD (PUT/DELETE require ownership) | `UserResponse` |
| `/api/v1/users/username/{username}` | GET | JWT | Get user by username | `UserResponse` |
| `/api/v1/users/auth/{authUserId}` | GET | JWT | Get user by authUserId | `UserResponse` |
| `/api/v1/decks` | GET | JWT | List decks (lite) | `List<DeckListResponse>` ⚠️ no cards, ⚠️ globally unfiltered (`findAll()`, no owner/public filter — see `docs/frontend/integration/BACKEND_CONTRACT_INVENTORY.md` Discrepancy C) |
| `/api/v1/decks` | POST | JWT | Create deck | `DeckResponse` |
| `/api/v1/decks/{id}` | GET/PUT/DELETE | JWT | Deck CRUD; GET allows public decks or the private deck owner, otherwise 403 | `DeckResponse` (with cards) |
| `/api/v1/cards` | GET/POST | JWT | List / create cards | `CardResponse` (includes `deckId`) |
| `/api/v1/cards/{id}` | GET/PUT/DELETE | JWT | Card CRUD; GET inherits public/private visibility from the parent deck | `CardResponse` (includes `deckId`) |
| `/api/v1/cards/bulk-generate` | POST | JWT | AI generate cards | `List<CardResponse>` |
| `/api/v1/learning/decks` | GET | JWT | List current user's active enrolled decks with aggregate progress and Continue/Start ordering | `List<LearningDeckResponse>` |
| `/api/v1/decks/{id}/enroll` | POST | JWT | Enroll deck | `EnrollResponse { userDeckId }` |
| `/api/v1/decks/{id}/study/cards` | GET | JWT | Get up to 10 cards for study | `List<DeckCardResponse>` |
| `/api/v1/decks/{id}/cards` | GET | JWT | All deck cards with user progress | `List<DeckCardResponse>` |
| `/api/v1/cards/{id}/review` | POST | JWT | Submit answer, update progress | `CardReviewResponse` |

**Base URL:** `/api/v1`  
**Auth:** `Authorization: Bearer <JWT>` on all secured endpoints

**Timestamp Format:**
- **Format:** ISO-8601 with UTC timezone (`YYYY-MM-DDTHH:mm:ssZ`)
- **Example:** `"createdAt": "2024-01-15T07:30:00Z"`
- **Backend:** Always returns UTC timestamps
- **Client responsibility:** Convert to user's local timezone for display
- **Database:** all timestamp columns use `timestamptz`. Technical `created_at`/`updated_at` columns are database-managed with `DEFAULT CURRENT_TIMESTAMP` and update triggers; learning business timestamps (`enrolled_at`, `last_studied_at`, `last_reviewed_at`, `next_review_at`) are application-managed and have no database default. See `docs/database/relationships.md` §6.2.1.

---

## 12. AI Generation Module

### Components

| Component | Responsibility |
|-----------|----------------|
| `AiCardGenerationService` | Orchestration, rate limiting |
| `OpenAiProvider` | HTTP client to OpenAI API (WebFlux) |
| `AiResponseParser` | JSON response parsing and validation |
| `AiRateLimiter` | Local request permit guard |
| `AiProperties` | Config loaded from `application.yaml` |

### Configuration

| Setting | Value |
|---------|-------|
| Model | `gpt-4o-mini` |
| Timeout | 120 sec |
| Max tokens per request | 4000 |
| Rate limiting | Basic local limiter exists. Exact provider limits should be verified separately. |
| Max bulk size | 100 cards |

### Prompt output shape

```json
{
  "definition": "...",
  "synonyms": ["..."],
  "examples": ["..."],
  "translation": "..."
}
```

`title` is not part of the AI output — it is passed as input to the prompt, and the `Card` is created with the original `title` (see `AiCardData`).

---

## 13. Current Package Structure

```text
backend/src/main/java/com/llhelper/
├── Application.java
├── auth/
│   ├── controller/AuthController.java
│   ├── service/AuthService.java
│   ├── entity/AuthUser.java
│   ├── repository/AuthUserRepository.java
│   └── dto/{request, response}/
├── user/
│   ├── controller/UserController.java
│   ├── service/UserService.java
│   ├── entity/User.java
│   ├── repository/UserRepository.java
│   ├── mapper/UserMapper.java
│   └── dto/{request, response}/
├── deck/
│   ├── controller/DeckController.java
│   ├── access/DeckAccessPolicy.java
│   ├── service/DeckService.java
│   ├── entity/Deck.java
│   ├── repository/DeckRepository.java
│   ├── mapper/DeckMapper.java
│   └── dto/{request, response}/
├── card/
│   ├── controller/CardController.java
│   ├── service/CardService.java
│   ├── entity/Card.java
│   ├── repository/CardRepository.java
│   ├── mapper/CardMapper.java
│   └── dto/{request, response}/
├── learning/
│   ├── controller/LearningController.java
│   ├── service/LearningService.java + LearningServiceImpl.java
│   ├── entity/UserDeckProgress.java
│   ├── entity/UserCardProgress.java
│   ├── repository/UserDeckProgressRepository.java
│   ├── repository/UserCardProgressRepository.java
│   ├── enums/CardLearningStatus.java
│   ├── enums/UserDeckStatus.java
│   └── dto/{request, response}/
├── ai/
│   ├── service/AiCardGenerationService.java
│   ├── provider/OpenAiProvider.java
│   ├── parser/AiResponseParser.java
│   ├── config/AiProperties.java
│   ├── dto/AiCardData.java
│   └── util/AiRateLimiter.java
└── common/
    ├── model/
    │   └── Language.java          ← shared enum (ISO 639-1 codes)
    ├── security/
    │   ├── JwtService.java
    │   ├── JwtAuthenticationFilter.java
    │   └── SecurityConfig.java
    ├── exception/
    ├── logging/
    └── config/
```

---

## 14. Known Architecture Issues

> Fixed issues history: see `docs/roadmap/changelog.md`.

| Issue | Priority | Target |
|-------|----------|--------|
| No pagination for list endpoints | 🟡 Medium | Level 2 |
| No index on `next_review_at` | 🟡 Medium | Backlog |
| JWT subject is `email`, not `userId` — extra DB lookup per request | 🟢 Low | Post Level 0 |
| Lombok not consistently applied across all classes | 🟢 Low | Backlog |

### Mapper Layer

**Status:** ✅ Implemented

MapStruct 1.6.3 is integrated. Each module has a `mapper/` package with interface-based mappers.

**Implementation:**
- `@Mapper(componentModel = "spring")` — auto-injected as Spring beans
- MapStruct processor runs **after** Lombok in annotation processing chain
- Mappers are injected into services via constructor injection

**Current mappers:**
- `CardMapper` — `Card` ↔ `CardResponse` / `CardRequest`
- `DeckMapper` — `Deck` ↔ `DeckResponse` / `DeckListResponse`
- `UserMapper` — `User` ↔ `UserResponse`, `updateEntity(UpdateUserRequest, User)`

**Service responsibilities updated:**
- Services no longer contain private `toResponse()` methods
- Services inject mapper and delegate DTO conversion
- Example: `cardMapper.toResponse(card)` instead of manual DTO construction

**Benefits:**
- No manual DTO mapping boilerplate
- Type-safe compile-time code generation
- Consistent mapping logic across modules
- Easy to test (mock mapper in service tests)

---

## 15. Architecture Risks

> Resolved risks history: see `docs/roadmap/changelog.md`.

1. AI generation saves cards directly without preview — bad AI output can persist to the database.

---

## 16. Current Decisions / Open Decisions

### Accepted Decisions

| Decision | Details |
|----------|---------|
| Package-by-feature | Each module is self-contained (controller/service/repository/entity/dto) |
| DTO = Java `record` | No Lombok on records — records generate everything |
| Entity = Lombok | `@Getter` / `@Setter` / `@NoArgsConstructor`, never `@Data` |
| No `equals`/`hashCode`/`toString` on entities | Avoids lazy-load issues and infinite recursion |
| AI card generation requires deck ownership | Only the deck owner can create or AI-generate cards inside a deck. `CardServiceImpl.create()` and `createBulk()` check `Objects.equals(deck.getOwner().getId(), currentUserId)`; otherwise return `403 Forbidden`. |
| Deck/Card reads inherit deck visibility | `DeckAccessPolicy` permits any authenticated user to read a public deck and its cards, permits the owner to read a private deck and its cards, and returns `403 Forbidden` for another user's private content. `DeckServiceImpl.getById()` and `CardServiceImpl.getById()` apply the shared policy before DTO mapping. |
| User operations require ownership | Only the user can update or delete their own profile. `UserServiceImpl.updateUser()` and `deleteUser()` check `Objects.equals(user.getId(), currentUserId)` via `validateUserOwnership()`; otherwise return `403 Forbidden`. |
| Bulk AI generation uses partial-success strategy | Failed titles are logged with `logger.warn(...)`. Full partial response with `created[]` and `failed[]` is deferred to Level 1. |
| Answer checking remains automatic for MVP | Current MVP keeps `trim().equalsIgnoreCase()` answer validation. Self-check flow (`Again / Hard / Good / Easy`) is accepted as future direction but not implemented. |
| Enrolled deck progress uses reference model | `UserDeckProgress` / `UserCardProgress` reference original deck/cards by ID. Copy/fork model is deferred. Protection against delete/orphaned progress is resolved via `ON DELETE CASCADE` FK constraints (V4/V5) — see `docs/database/relationships.md`. |
| MapStruct for mapper layer | Interface-based mappers with `@Mapper(componentModel = "spring")`. MapStruct processor runs after Lombok. Each module has `mapper/` package. |
| Register → Complete Profile flow (Phase 0.4C) | `POST /auth/register` continues to create only `AuthUser`. The frontend routes the new JWT holder to `/onboarding/profile`, which calls `POST /users` to create the `User` profile before any authenticated product action. `GET /api/v1/users/me` bootstraps session state (`needsProfile` vs `authenticated`) — implemented (Sprint 1.0 G-01). See `docs/roadmap/current-sprint.md` for the accepted Level 1 MVP and ordered backend/Stitch/frontend tasks. |

### Open Decisions

| Question | Context | Status |
|----------|---------|--------|
| Soft delete for Card / Deck | Add `deleted_at` column or hard delete? | Planned in `IMPROVEMENTS.md` |
| Synonyms/examples as separate tables | Currently PostgreSQL `text[]` arrays inside `Card` entity | Deferred |
| Self-check UX for answers | Direction accepted (Again / Hard / Good / Easy), implementation deferred | Backlog |

---

## 17. Future Scope

**Level 2 — Portfolio-ready:**
- OpenAPI/Swagger
- Docker Compose
- GitHub Actions CI/CD
- Repository and full integration test suite using Testcontainers (beyond the Level 0 `ApplicationContextLoadsTest` smoke test)

**Level 3 — Production Candidate:**
- `StudySession` / `StudySessionAnswer` entities
- Refresh tokens
- Soft delete

**Level 4 — SaaS:**
- Subscriptions and payments
- Teacher/Student roles
- Deck marketplace/library
- AI lexical database
- PWA / mobile-first

---

## 18. Rate Limiting

> **Status:** ✅ All CRUD/auth/bulk-generate endpoints protected via `UserRateLimiter`. AI provider calls are also protected via a separate global `AiRateLimiter` (not per-user). Postman regression pending — see `docs/roadmap/current-sprint.md`.
> **Design note:** `docs/features/rate-limiting-design.md` (historical implementation plan)

### Level 0 Implementation

**Component:** `UserRateLimiter` (`common/security/`)

**Strategy:** Per-user in-memory rate limiting using Caffeine Cache

**Mechanism:**
- Fixed window counter algorithm per user/email
- Composite cache key: `(subject, RateLimitAction)` — prevents conflicts between actions
- Caffeine Cache with 2-hour TTL, max 100,000 buckets
- Level 0: email key (from JWT, 0 DB queries); userId key deferred until JWT migration

### Protected Endpoints

| Endpoint | Limit | Window | Key | Priority |
|----------|-------|--------|-----|----------|
| `PUT /api/v1/users/{id}` | 5 | 1 minute | email ✅ | 🔴 High |
| `POST /api/v1/auth/login` | 5 | 1 minute | email ✅ | 🔴 High |
| `POST /api/v1/auth/register` | 3 | 5 minutes | email ✅⚠️ | 🔴 High |
| `POST /api/v1/cards` | 20 | 1 minute | email ✅ | 🟡 Medium |
| `PUT /api/v1/cards/{id}` | 10 | 1 minute | email ✅ | 🟢 Low |
| `DELETE /api/v1/cards/{id}` | 10 | 1 minute | email ✅ | 🟢 Low |
| `POST /api/v1/decks` | 5 | 1 hour | email ✅ | 🟡 Medium |
| `PUT /api/v1/decks/{id}` | 10 | 1 minute | email ✅ | 🟢 Low |
| `DELETE /api/v1/decks/{id}` | 5 | 1 hour | email ✅ | 🟢 Low |
| `POST /api/v1/cards/bulk-generate` | 3 | 1 minute | email ✅ | 🔴 High |

### Error Response

**HTTP Status:** `429 Too Many Requests`

**Body:**
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Try again later.",
  "timestamp": "2026-06-25T15:30:00"
}
```

### Scope

- **Level 0:** Per-user, in-memory (Caffeine Cache)
- **Level 2:** Distributed (Redis), IP-based, global limits
- **Level 3:** Rate limit headers, adaptive limits, metrics

### Known Limitations

- Per-JVM instance (not distributed)
- Email-based for auth (TODO: migrate to userId when JWT changes)
- No rate limit headers (`X-RateLimit-*`)

### AI Generation Rate Limiting

Two independent layers:

- **Endpoint layer (`UserRateLimiter`, per-user):** `POST /cards/bulk-generate` limited to 3 req/min per user email (`CARD_BULK_GENERATE`) — see Protected Endpoints above.
- **Provider layer (`AiRateLimiter`, global per-JVM):** caps outbound OpenAI calls at 10 req/sec across all users, independent of which user triggered the request.

**Planned (Level 2):** Per-user AI generation quota (e.g. 10 generations/hour) at the provider layer, in addition to the existing per-JVM cap.

---

## 19. Database Schema Management

> **Status:** ✅ Liquibase ownership policy established
> **Detailed guide:** `docs/database/schema-ownership.md`
> **Hard gate:** `backend/AGENTS.md` — **Conventions:** `backend/.windsurf/rules/liquibase-conventions.md`, `backend/.windsurf/rules/entity-conventions.md`

### Schema Ownership

- **Liquibase** owns the DB schema (structure, constraints, indexes, defaults)
- **Hibernate/JPA** owns the Java-to-DB mapping (how Java objects map to tables)
- Hibernate must **not** create, update, or evolve the database schema

### Hibernate DDL Mode

**Current:** `ddl-auto: validate`

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
```

**Why validate:**
- Hibernate verifies that entity mappings match the Liquibase-managed database schema
- If they don't match, Hibernate fails on startup → immediate feedback
- No risk of accidental schema changes
- Forces use of Liquibase for all schema changes

### Entity Responsibilities

JPA entities describe **mapping only**, not schema:

**Allowed:**
- `@Entity`, `@Table(name = "...")`
- `@Column(name = "...", nullable = false, length = ...)`
- `@Enumerated(EnumType.STRING)`
- Relationship annotations (`@ManyToOne`, etc.)

**Forbidden:**
- `@Table(uniqueConstraints = ...)`, `@Table(indexes = ...)`
- `@Check`, `@CheckConstraint`, `@Index`, `@UniqueConstraint`
- `@ColumnDefault`

### Liquibase Responsibilities

All database structure and integrity rules must be defined in Liquibase migrations:

- Tables, columns, types
- `NOT NULL`, `UNIQUE`, `CHECK`, `FOREIGN KEY` constraints
- Indexes
- Default values
- Enum validation constraints
- Triggers, views, functions, procedures

### Migration Workflow

When adding/changing an entity field:

1. Update the Java entity mapping
2. Create a Liquibase changeset for the database column
3. Add DB-level constraints/indexes/defaults in Liquibase
4. Do not rely on Hibernate auto-DDL

### Current Migrations

- **V1:** Baseline schema (all tables, constraints, indexes)
- **V2:** Unique constraint on `user_deck_progress(user_id, deck_id)` — prevents duplicate enrollment
- **V3:** Unique constraint on `user_card_progress(user_deck_progress_id, card_id)`
- **V4:** FK `user_deck_progress`/`user_card_progress` → `users.id` with cascade delete
- **V5:** FK `decks`/`cards` cascade delete aligned with JPA `CascadeType.ALL`
- **V6:** `Language` enum validation via `CHECK` constraints on `decks.source_language`/`target_language`
- **V7:** `CHECK` constraints on `user_card_progress` counters (no negative values)
- **V8:** Removed duplicate index on `users.auth_user_id`
- **V9:** `TIMESTAMPTZ` + `DEFAULT CURRENT_TIMESTAMP` + triggers for `created_at`/`updated_at`
- **V10:** `TIMESTAMPTZ` for learning progress timestamps
- **V11:** Application-managed `user_deck_progress.enrolled_at` (`timestamptz NOT NULL`, existing rows backfilled) and `idx_user_deck_progress_user_status(user_id, status)` for G-06

---

## 20. Frontend Architecture

> **Status:** Technical scaffold foundation complete — path aliases, `strict: true`, Vite proxy, `.env.example`, RTK Query base API, Redux store with the initial three-state session slice, a temporary React Router/ProtectedRoute scaffold, and testing infrastructure (Vitest + jsdom + React Testing Library + MSW) are configured. Product route layouts, four-state session bootstrap, UI primitives, CSS Modules/token implementation, and feature screens remain pending in `docs/roadmap/current-sprint.md`. Playwright remains future infrastructure for the later E2E stage.
> **Detailed conventions:** `frontend/CONVENTIONS.md`
> **Hard gates:** `frontend/AGENTS.md`

### Target Architecture — Pragmatic FSD

```text
frontend/src/
├── app/          ← providers, router, store config
├── pages/        ← route-level compositions
├── widgets/      ← substantial reusable page blocks
├── features/     ← user actions/use cases
├── entities/     ← business/domain concepts
└── shared/       ← business-agnostic infrastructure (ui, lib, api, config)
```

Dependency direction: `app` → `pages` → `widgets` → `features` → `entities` → `shared`.

### State Ownership

| Category | Tool |
|----------|------|
| Server state | RTK Query |
| Runtime session state | Redux Toolkit slice (`entities/session/`) |
| Global client state | Redux Toolkit slices |
| Form state | React Hook Form + Zod |
| URL state | React Router |
| Local UI state | React `useState`/`useReducer` |

### API Layer

- RTK Query with `fetchBaseQuery` — single `createApi` base in `shared/api/`.
- Domain endpoints injected from relevant entity/feature slices.
- Centralized auth headers via `prepareHeaders` using a token-storage adapter in `shared/api/` (no Redux import in shared).
- Base URL: `VITE_API_URL` → backend `/api/v1`.

### Authentication (Level 1)

- Bearer JWT + `localStorage` persistence (via `shared/api/token-storage` adapter) + Redux runtime session state (`entities/session/`).
- `shared/api/` never imports Redux, entities, features, or app.
- Auth use cases: `features/login/`, `features/register/`, `features/logout/`; Complete Profile orchestration belongs to its own feature responsibility rather than `shared/api/`.
- `localStorage` is a deliberate Level 1 trade-off.
- 401 → `shared/api/` returns normalized error → app-level listener clears token + session + RTK Query cache → redirect to login.
- No refresh token (Level 3).
- Future target: HttpOnly secure cookies (removes client token transport).

### Routing

- React Router 7 with centralized configuration in `app/router/`.
- Current runtime contains only a temporary centralized router and initial `ProtectedRoute`; product routes and layouts are not implemented yet.
- Target: public/auth, onboarding, and authenticated layouts whose guards depend on `entities/session` runtime state.

### UI / Design

- CSS Modules for component styles + semantic CSS variables for tokens.
- Shared UI primitives `Button`, `Input`, `Textarea`, `Select`, and `FormField` are implemented and exported from `shared/ui/`.
- No external UI framework without explicit decision.
- Canonical color, spacing/layout, and font-family tokens from `docs/frontend/DESIGN.md` are implemented in `shared/ui/tokens.css`. Bundled Geist and JetBrains Mono variable fonts, the global reset, and application foreground/background styles are loaded at startup; responsive shell rules and screen runtime implementation remain pending.

### Testing

- Target: Vitest + React Testing Library + MSW + Playwright.
- Pure logic → unit tests. Features/pages → integration tests. Critical flows → E2E.
- No mandatory test for trivial presentational components.

### Current Scaffold State

The legacy Vite/template structure and non-standard frontend directories have been removed. The current runtime is a small FSD scaffold containing app/store/router/test infrastructure, `entities/session`, and generic `shared/api`; `pages`, `widgets`, `features`, and `shared/ui` remain placeholders until the current-sprint responsibilities are implemented. The router currently exposes only placeholder `/` and `/login` entries and must not be treated as the accepted product route tree.

---

## References

| Document             | Path                                          |
|----------------------|-----------------------------------------------|
| Current sprint       | `docs/roadmap/current-sprint.md`              |
| Roadmap              | `docs/roadmap/roadmap.md`                     |
| Backend conventions  | `backend/AGENTS.md`, `backend/CONVENTIONS.md` |
| Frontend conventions | `frontend/AGENTS.md`, `frontend/CONVENTIONS.md` |
| Improvements backlog | `backend/IMPROVEMENTS.md`                     |
| Postman collection   | `LLHelper.postman_collection.json`            |
| Learning flow design | `docs/features/learning-flow.md`               |
| AI generation flow   | `docs/features/ai-generation-flow.md`          |
| Rate limiting design | `docs/features/rate-limiting-design.md`        |
| DB schema ownership  | `docs/database/schema-ownership.md`            |

---

## Changelog

History of changes to this document has moved to `docs/roadmap/changelog.md`. This file reflects only the current state.
