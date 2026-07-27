# Current Architecture

> **Project:** LLHelper — AI Language Cards
> **Current level:** Level 0 — Stable Backend Foundation
> **Sprint:** Sprint 0.3 — Database Control
> **Last updated:** 2026-07-05
> **Status:** Draft v0.3 — Liquibase foundation added, V1 baseline migration created, Flyway references removed

---

## 1. Project Overview

**LLHelper** — language learning application for vocabulary study via flashcards. Users create decks, add cards with translations and examples, and go through study sessions with progress tracking.

**Core concept:** Two-layer architecture — Content Layer (decks and cards) and Learning Layer (user progress).

---

## 2. Current Level / Scope

**Level 0 — Stable Backend Foundation**

- ✅ Spring Boot backend with JWT authentication
- ✅ CRUD for decks
- ✅ CRUD for cards
- ✅ AI card generation via OpenAI API
- ✅ Learning Flow: enroll, study, review with progress tracking
- ✅ Mapper layer, rate limiting, ownership checks completed (Sprint 0.2)
- 🔄 In progress: database migrations, schema control (Sprint 0.3)

**Out of scope for Sprint 0.1:**
- Frontend screens (Level 1)
- Liquibase migrations (Sprint 0.3, in progress)
- OpenAPI/Swagger (Level 2)
- Docker/CI (Level 2)
- Refresh tokens, auth rate limiting (Level 3)

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
| **Frontend** | React + TypeScript + Vite (project initialized with FSD folder structure, no screens yet) |

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
├── mapper/         ← NEW (Sprint 0.2)
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
| `UserDeckProgress` | `user_deck_progress` | userId, deckId, status, lastStudiedAt |
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

**Important — cascade/delete behavior is unresolved:**

Progress entities must not modify content entities. Deleting a Deck or Card requires an explicit behavior decision:
- Restrict delete if progress exists, OR
- Cascade-delete progress intentionally, OR
- Use soft delete (planned for future).

Currently unresolved. FK violation risk if Deck/Card is deleted while progress records exist.

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

// FIXME: ask later why this addition info looks excessive
**Mapper layer (Sprint 0.2):**
- Services no longer contain private `toResponse()` methods
- MapStruct mappers are injected as Spring beans
- Example: `CardMapper.toResponse(card)` instead of manual DTO construction

---

## 10. Current Backend Flow

### Authentication Flow

```text
POST /api/v1/auth/register  ──▶  Create AuthUser + User  ──▶  Return JWT
POST /api/v1/auth/login     ──▶  Validate credentials    ──▶  Return JWT
```

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
| `/api/v1/users/{id}` | GET/PUT/DELETE | JWT | User profile CRUD (PUT/DELETE require ownership) | `UserResponse` |
| `/api/v1/decks` | GET | JWT | List decks (lite) | `List<DeckListResponse>` ⚠️ no cards |
| `/api/v1/decks` | POST | JWT | Create deck | `DeckResponse` |
| `/api/v1/decks/{id}` | GET/PUT/DELETE | JWT | Deck CRUD | `DeckResponse` (with cards) |
| `/api/v1/cards` | GET/POST | JWT | List / create cards | `CardResponse` (includes `deckId`) |
| `/api/v1/cards/{id}` | GET/PUT/DELETE | JWT | Card CRUD | `CardResponse` (includes `deckId`) |
| `/api/v1/cards/bulk-generate` | POST | JWT | AI generate cards | `List<CardResponse>` |
| `/api/v1/decks/{id}/enroll` | POST | JWT | Enroll deck | `EnrollResponse { userDeckId }` |
| `/api/v1/decks/{id}/study/cards` | GET | JWT | Get up to 10 cards for study | `List<DeckCardResponse>` |
| `/api/v1/decks/{id}/cards` | GET | JWT | All deck cards with user progress | `List<DeckCardResponse>` |
| `/api/v1/cards/{id}/review` | POST | JWT | Submit answer, update progress | `CardReviewResponse` |

**Base URL:** `/api/v1`  
**Auth:** `Authorization: Bearer <JWT>` on all secured endpoints

**Recent changes (Sprint 0.2):**
- `GET /decks` now returns `DeckListResponse` (without `cards` array, added `sourceLanguage`, `targetLanguage`)
- `POST /decks/{id}/enroll` now returns `{ "userDeckId": Long }` instead of void
- All card endpoints now include `deckId` in `CardResponse`

**Recent changes (Sprint 0.3):**
- All timestamps now use `java.time.Instant` (ISO-8601 with UTC)
- API responses return timestamps in format: `2024-01-15T07:30:00Z`
- Database stores timestamps as `timestamptz` (UTC-safe)
- Timestamps managed by PostgreSQL (DEFAULT + triggers), not Java

**Timestamp Format:**
- **Format:** ISO-8601 with UTC timezone (`YYYY-MM-DDTHH:mm:ssZ`)
- **Example:** `"createdAt": "2024-01-15T07:30:00Z"`
- **Backend:** Always returns UTC timestamps
- **Client responsibility:** Convert to user's local timezone for display
- **Database:** `timestamptz` columns with `DEFAULT CURRENT_TIMESTAMP` and auto-update triggers

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
  "title": "...",
  "definition": "...",
  "synonyms": ["..."],
  "examples": ["..."],
  "translation": "..."
}
```

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
│   ├── mapper/UserMapper.java                ← NEW
│   └── dto/{request, response}/
├── deck/                                ← will be renamed to deck/
│   ├── controller/DeckController.java    ← → DeckController
│   ├── service/DeckService.java          ← → DeckService
│   ├── entity/Deck.java                  ← → Deck
│   ├── repository/DeckRepository.java    ← → DeckRepository
│   ├── mapper/DeckMapper.java            ← NEW
│   └── dto/{request, response}/             ← → DeckRequest/Response
├── card/
│   ├── controller/CardController.java
│   ├── service/CardService.java
│   ├── entity/Card.java
│   ├── repository/CardRepository.java
│   ├── mapper/CardMapper.java               ← NEW
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

| Issue | Priority | Target |
|-------|----------|--------|
| ~~`CardDesc` entity represented Deck — misleading name~~ | ~~🔴 High~~ | ~~Sprint 0.2~~ ✅ Fixed |
| ~~No `GlobalExceptionHandler`~~ | ~~🔴 High~~ | ~~Sprint 0.2~~ ✅ Fixed |
| **Deck operations missing ownership check** | 🔴 **CRITICAL** | **Sprint 0.2 (task 7.2)** |
| **No rate limiting on user update operations** | 🔴 High | **Sprint 0.2 (task 8)** |
| ~~`ddl-auto=update`, no migration tool — schema not version-controlled~~ | ~~🔴 High~~ | ~~Sprint 0.3~~ ✅ Liquibase + V1 baseline added |
| Delete Deck/Card with existing progress → FK violation risk | 🔴 High | Sprint 0.3 |
| No pagination for list endpoints | 🟡 Medium | Level 2 |
| `createdAt` via `@PrePersist` instead of DB DEFAULT | 🟡 Medium | Sprint 0.3 |
| Languages stored as VARCHAR, not DB enum | 🟡 Medium | Sprint 0.3 |
| No indexes on `next_review_at`, `(userId, deckId)` | 🟡 Medium | Sprint 0.3 |
| JWT subject is `email`, not `userId` — extra DB lookup per request | 🟢 Low | Post Level 0 |
| Lombok not consistently applied across all classes | 🟢 Low | Sprint 0.2 |

### Naming Issue: CardDesc → Deck rename

**Status:** ✅ Fixed (Sprint 0.2)

The `CardDesc` entity and `card_descs` table name were misleading — they read as "card description" while representing a **Deck** in the domain model. The Java package, classes, DTOs, REST endpoints, and database table were renamed to `Deck` / `decks`. The DB table rename was performed manually before Liquibase was introduced; Liquibase V1 baseline captures the current schema, and incremental migrations are planned for Sprint 0.3.

| Before | After |
|--------|-------|
| `CardDesc` entity | `Deck` entity |
| `card_descs` table | `decks` table |
| `CardDescController` | `DeckController` |
| `/api/v1/card-descs` | `/api/v1/decks` |
| `CardDescService/Repository` | `DeckService/Repository` |
| `CardDescRequest/Response` | `DeckRequest/Response` |
| `card_desc/` package | `deck/` package |

### Mapper Layer

**Status:** ✅ Implemented (Sprint 0.2)

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

1. ~~`CardDesc` naming hid the Deck concept~~ — ✅ Fixed in Sprint 0.2 (renamed to `Deck`).
2. Copy vs reference strategy for enrolling public decks is not finalized.
3. Liquibase foundation added; incremental schema migrations still pending (Sprint 0.3).
4. ~~No `GlobalExceptionHandler` means API error responses may be inconsistent.~~ ✅ Fixed (Sprint 0.2)
5. ~~No mapper layer means the API contract depends too closely on entity structure.~~ ✅ Fixed (Sprint 0.2)
6. AI generation saves cards directly without preview — bad AI output can persist to the database.
7. Deleting a Deck or Card while progress exists has no explicit cascade/restrict strategy defined.

---

## 16. Current Decisions / Open Decisions

### Accepted Decisions

| Decision | Details |
|----------|---------|
| Package-by-feature | Each module is self-contained (controller/service/repository/entity/dto) |
| DTO = Java `record` | No Lombok on records — records generate everything |
| Entity = Lombok | `@Getter` / `@Setter` / `@NoArgsConstructor`, never `@Data` |
| No `equals`/`hashCode`/`toString` on entities | Avoids lazy-load issues and infinite recursion |
| Mapper deferred | Currently `toResponse()` in service; dedicated mapper layer planned for Sprint 0.2 |

### Sprint 0.2 Accepted Decisions

| Decision | Details |
|----------|---------|  
| AI card generation requires deck ownership | Only the deck owner can create or AI-generate cards inside a deck. `CardServiceImpl.create()` and `createBulk()` must check `Objects.equals(deck.getOwner().getId(), currentUserId)`; otherwise return `403 Forbidden`. |
| User operations require ownership | Only the user can update or delete their own profile. `UserServiceImpl.updateUser()` and `deleteUser()` check `Objects.equals(user.getId(), currentUserId)` via `validateUserOwnership()`; otherwise return `403 Forbidden`. |
| Bulk AI generation uses partial-success strategy | Sprint 0.2 fix: log failed titles with `logger.warn(...)`. Full partial response with `created[]` and `failed[]` is deferred to Sprint 0.4 / Level 1. |
| Answer checking remains automatic for MVP | Current MVP keeps `trim().equalsIgnoreCase()` answer validation. Self-check flow (`Again / Hard / Good / Easy`) is accepted as future direction but not implemented in Sprint 0.2. |
| Enrolled deck progress uses reference model | `UserDeckProgress` / `UserCardProgress` reference original deck/cards by ID. Copy/fork model is deferred. Protection against delete/orphaned progress will be handled in Sprint 0.3 via restrict/delete strategy and/or FK decisions. |
| MapStruct for mapper layer | Interface-based mappers with `@Mapper(componentModel = "spring")`. MapStruct processor runs after Lombok. Each module has `mapper/` package. |

### Sprint 0.2 Priority Decisions

1. Fix ownership checks before any mapper/DTO cleanup.
2. Add `GlobalExceptionHandler` before expanding API behavior.
3. Do not redesign learning UX during Sprint 0.2.
4. Do not change DB relationship model before Liquibase incremental migrations/Sprint 0.3.

### Open Decisions

| Question | Context | Status |
|----------|---------|--------|
| Soft delete for Card / Deck | Add `deleted_at` column or hard delete? | Planned in `IMPROVEMENTS.md` |
| Synonyms/examples as separate tables | Currently PostgreSQL `text[]` arrays inside `Card` entity | Deferred |
| Self-check UX for answers | Direction accepted (Again / Hard / Good / Easy), implementation deferred | Post Sprint 0.2 |

---

## 17. Not In Scope Now

**Level 1 — Frontend:**
- React screens (Login, Dashboard, Decks, Study Mode, Progress)
- API client layer (Axios + TanStack Query)

**Sprint 0.2 — Backend Cleanup (current level, pending):**
- Dedicated mapper layer
- DTO cleanup
- `GlobalExceptionHandler`
- Validation cleanup
- ~~`CardDesc` → `Deck` rename~~ — ✅ Done (Sprint 0.2, DB table renamed manually)

**Level 2 — Portfolio-ready:**
- Liquibase + `ddl-auto=validate` (foundation in Sprint 0.3)
- OpenAPI/Swagger
- Docker Compose
- GitHub Actions CI/CD
- Integration tests (Testcontainers)

**Level 3 — Production Candidate:**
- `StudySession` / `StudySessionAnswer` entities
- Refresh tokens
- Rate limiting on auth endpoints
- AI Provider abstraction interface
- Soft delete

**Level 4 — SaaS:**
- Subscriptions and payments
- Teacher/Student roles
- Deck marketplace/library
- AI lexical database
- PWA / mobile-first

---

## 18. Rate Limiting

> **Status:** ✅ All endpoints protected (Sprint 0.2 task 8.5–8.14 complete). Postman tests pending (8.15).
> **Design note:** `docs/features/rate-limiting-design.md`

### Level 0 Implementation (Sprint 0.2)

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
- AI generation per-user limit deferred (requires userId in service)

### AI Generation Rate Limiting

**Current:** Per-JVM only (`AiRateLimiter` — 10 req/sec for all users)

**Planned (Level 2):** Per-user limit (10 AI generations/hour) + per-JVM limit

---

## 19. Database Schema Management

> **Status:** ✅ Liquibase ownership policy established (Sprint 0.3)
> **Detailed guide:** `docs/database/schema-ownership.md`
> **Quick reference:** `.windsurf/rules/database-schema-ownership.md`

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

- **V1:** Baseline schema (all tables, constraints, indexes as of 2026-07-04)
- **V2:** Unique constraint on `user_deck_progress(user_id, deck_id)`
- **V3:** Unique constraint on `user_card_progress(user_deck_progress_id, card_id)`

---

## References

| Document             | Path                                          |
|----------------------|-----------------------------------------------|
| Roadmap              | `docs/roadmap/LL_Helper_Project_Roadmap.md`   |
| Conventions          | `backend/AGENTS.md`, `backend/CONVENTIONS.md` |
| Improvements backlog | `backend/IMPROVEMENTS.md`                     |
| Postman collection   | `LLHelper.postman_collection.json`            |
| Learning flow design | `docs/features/learning-flow.md`               |
| AI generation flow   | `docs/features/ai-generation-flow.md`          |
| Rate limiting design | `docs/features/rate-limiting-design.md`        |
| DB schema ownership  | `docs/database/schema-ownership.md`            |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-02 | Initial version — Level 0 Architecture Freeze (Sprint 0.1) |
| 2026-06-22 | Added MapStruct 1.6.3, implemented CardMapper, updated request lifecycle |
| 2026-06-23 | Mapper layer complete: CardMapper, DeckMapper, UserMapper. Removed manual toResponse() from services. Updated package structure, request lifecycle, service responsibilities. |
| 2026-06-24 | Added ownership check for User operations (update/delete). UserServiceImpl now validates ownership via SecurityUtils. Updated Postman with 403 test cases. |
| 2026-06-25 | Added rate limiting design (Sprint 0.2 task 8). Created `docs/features/rate-limiting-design.md`. Identified Deck ownership check issue (task 7.2). Updated roadmap with detailed breakdown of tasks 7.2 and 8.1-8.16. |
| 2026-06-28 | Sprint 0.2 tasks 8.1-8.4 completed: fixed RateLimiter reset bug, moved RateLimitExceededException to common/exception, added Caffeine 3.1.8 dependency, created UserRateLimiter. |
| 2026-06-29 | Sprint 0.2 task 8.5 completed: rate limiting applied to UserServiceImpl.updateUser(). Added SecurityUtils.getCurrentUserEmail() (0 DB queries). Composite key architecture (subject + RateLimitAction). |
| 2026-06-29 | Sprint 0.2 task 8.6 completed: rate limiting applied to AuthServiceImpl.login() via checkLimitByEmail(request.email(), AUTH_LOGIN). |
| 2026-06-29 | Sprint 0.2 task 8.7 completed: rate limiting applied to AuthServiceImpl.register(). ⚠️ Email-based limit is weak for registration — IP-based limiting planned for Level 2. |
| 2026-06-30 | Sprint 0.2 task 8.8 completed: rate limiting applied to CardServiceImpl.create() via checkLimitByEmail(getCurrentUserEmail(), CARD_CREATE). |
| 2026-06-30 | Sprint 0.2 tasks 8.9-8.10 completed: rate limiting applied to CardServiceImpl.update() and delete(). |
| 2026-06-30 | Sprint 0.2 tasks 8.11-8.13 completed: rate limiting applied to DeckServiceImpl.create(), update(), delete(). |
| 2026-06-30 | Sprint 0.2 task 8.14 completed: GlobalExceptionHandler 429 response enriched with error code and timestamp. |
| 2026-07-04 | Sprint 0.3 foundation: added Liquibase dependency, created V1 baseline migration, switched `ddl-auto` to `validate`. |
| 2026-07-05 | Sprint 0.3 cleanup: removed Flyway references, corrected relationships.md FK delete rules, removed empty V2 SQL file. |
| 2026-07-06 | Sprint 0.3: established Liquibase schema ownership policy. Removed duplicate DB constraints from entities (UserCardProgress, UserDeckProgress, User, AuthUser). Created `docs/database/schema-ownership.md` (detailed guide) and `.windsurf/rules/database-schema-ownership.md` (quick reference). |
| 2026-07-07 | Sprint 0.3: added `common/model/Language.java` enum (ISO 639-1). Deck entity/DTOs migrated from `String` to `Language`. V6 migration: DROP DEFAULT + CHECK constraints on `decks.source_language`/`target_language`. |
