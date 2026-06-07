# Current Architecture

> **Project:** LLHelper — AI Language Cards
> **Current level:** Level 0 — Stable Backend Foundation
> **Sprint:** Sprint 0.1 — Architecture Freeze
> **Last updated:** 2026-06-02
> **Status:** Draft v0.1 — current backend architecture audit

---

## 1. Project Overview

**LLHelper** — language learning application for vocabulary study via flashcards. Users create decks, add cards with translations and examples, and go through study sessions with progress tracking.

**Core concept:** Two-layer architecture — Content Layer (decks and cards) and Learning Layer (user progress).

---

## 2. Current Level / Scope

**Level 0 — Stable Backend Foundation**

- ✅ Spring Boot backend with JWT authentication
- ✅ CRUD for decks (currently entity is named `CardDesc` — see Known Issues)
- ✅ CRUD for cards
- ✅ AI card generation via OpenAI API
- ✅ Learning Flow: enroll, study, review with progress tracking
- 🔄 In progress: cleanup, tests, documentation, mapper layer

**Out of scope for Sprint 0.1:**
- Frontend screens (Level 1)
- Flyway migrations (Sprint 0.3)
- OpenAPI/Swagger (Level 2)
- Docker/CI (Level 2)
- Refresh tokens, auth rate limiting (Level 3)

---

## 3. Technology Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Java 21, Spring Boot 4.0.6 |
| **Database** | PostgreSQL, Spring Data JPA (Hibernate) |
| **Security** | Spring Security, JWT (jjwt 0.12.6) |
| **AI** | OpenAI API (gpt-4o-mini), WebFlux HTTP client |
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
| `card_desc` | `com.llhelper.card_desc` | Decks (misleading name — see Known Issues) |
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
├── dto/
│   ├── request/
│   └── response/
└── enums/  (if applicable)
```

---

## 7. Main Domain Model

### Content Layer

```text
AuthUser ──1:1──▶ User ──1:N──▶ CardDesc (Deck) ──1:N──▶ Card
```

| Entity | Table | Key Fields |
|--------|-------|------------|
| `AuthUser` | `auth_users` | email (unique), passwordHash, role |
| `User` | `users` | firstName, lastName, username (unique), nativeLanguage, targetLanguage, uiLanguage |
| `CardDesc` | `card_descs` | title, description, sourceLanguage, targetLanguage, isPublic, owner → User |
| `Card` | `cards` | title, definition, synonyms[], examples[], translation, cardDesc → CardDesc |

### Learning Layer

```text
User ──1:N──▶ UserDeckProgress ──1:N──▶ UserCardProgress
                    │                           │
                    ▼                           ▼
               CardDesc (Deck)               Card
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
| **Entities** | CardDesc (Deck), Card | UserDeckProgress, UserCardProgress |
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
7. Service maps entity → response DTO via `toResponse()`.
8. Controller returns `ResponseEntity<ResponseDTO>`.

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
RateLimiter.acquirePermit()
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
| `/api/v1/users/{id}` | GET/PUT/DELETE | JWT | User profile CRUD | `UserResponse` |
| `/api/v1/card-descs` | GET | JWT | List decks (lite) | `List<CardDescListResponse>` ⚠️ no cards |
| `/api/v1/card-descs` | POST | JWT | Create deck | `CardDescResponse` |
| `/api/v1/card-descs/{id}` | GET/PUT/DELETE | JWT | Deck CRUD | `CardDescResponse` (with cards) |
| `/api/v1/cards` | GET/POST | JWT | List / create cards | `CardResponse` (includes `cardDescId`) |
| `/api/v1/cards/{id}` | GET/PUT/DELETE | JWT | Card CRUD | `CardResponse` (includes `cardDescId`) |
| `/api/v1/cards/bulk-generate` | POST | JWT | AI generate cards | `List<CardResponse>` |
| `/api/v1/decks/{id}/enroll` | POST | JWT | Enroll deck | `EnrollResponse { userDeckId }` |
| `/api/v1/decks/{id}/study/cards` | GET | JWT | Get up to 10 cards for study | `List<DeckCardResponse>` |
| `/api/v1/decks/{id}/cards` | GET | JWT | All deck cards with user progress | `List<DeckCardResponse>` |
| `/api/v1/cards/{id}/review` | POST | JWT | Submit answer, update progress | `CardReviewResponse` |

**Base URL:** `/api/v1`  
**Auth:** `Authorization: Bearer <JWT>` on all secured endpoints

**Recent changes (Sprint 0.2):**
- `GET /card-descs` now returns `CardDescListResponse` (without `cards` array, added `sourceLanguage`, `targetLanguage`)
- `POST /decks/{id}/enroll` now returns `{ "userDeckId": Long }` instead of void
- All card endpoints now include `cardDescId` in `CardResponse`

---

## 12. AI Generation Module

### Components

| Component | Responsibility |
|-----------|----------------|
| `AiCardGenerationService` | Orchestration, rate limiting |
| `OpenAiProvider` | HTTP client to OpenAI API (WebFlux) |
| `AiResponseParser` | JSON response parsing and validation |
| `RateLimiter` | Local request permit guard |
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
│   └── dto/{request, response}/
├── card_desc/                                ← will be renamed to deck/
│   ├── controller/CardDescController.java    ← → DeckController
│   ├── service/CardDescService.java          ← → DeckService
│   ├── entity/CardDesc.java                  ← → Deck
│   ├── repository/CardDescRepository.java    ← → DeckRepository
│   └── dto/{request, response}/             ← → DeckRequest/Response
├── card/
│   ├── controller/CardController.java
│   ├── service/CardService.java
│   ├── entity/Card.java
│   ├── repository/CardRepository.java
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
│   ├── config/AiProperties.java
│   ├── dto/AiCardData.java
│   └── util/RateLimiter.java
└── common/
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
| `CardDesc` entity represents Deck — misleading name | 🔴 High | Sprint 0.2 |
| No dedicated mapper layer (`toResponse()` inline in services) | 🔴 High | Sprint 0.2 |
| No `GlobalExceptionHandler` | 🔴 High | Sprint 0.2 |
| `ddl-auto=update`, no Flyway — schema not version-controlled | 🔴 High | Sprint 0.3 |
| Delete Deck/Card with existing progress → FK violation risk | 🔴 High | Sprint 0.3 |
| No pagination for list endpoints | 🟡 Medium | Level 2 |
| `createdAt` via `@PrePersist` instead of DB DEFAULT | 🟡 Medium | Sprint 0.3 |
| Languages stored as VARCHAR, not DB enum | 🟡 Medium | Sprint 0.3 |
| No indexes on `next_review_at`, `(userId, deckId)` | 🟡 Medium | Sprint 0.3 |
| JWT subject is `email`, not `userId` — extra DB lookup per request | 🟢 Low | Post Level 0 |
| Lombok not consistently applied across all classes | 🟢 Low | Sprint 0.2 |

### Naming Issue: CardDesc represents Deck

Current `CardDesc` entity and `card_descs` table function as a **Deck** in the domain model, but the name is misleading — it reads as "card description".

**Planned refactor (Sprint 0.2, after Flyway is in place):**

| Before | After |
|--------|-------|
| `CardDesc` entity | `Deck` entity |
| `card_descs` table | `decks` table |
| `CardDescController` | `DeckController` |
| `/api/v1/card-descs` | `/api/v1/decks` |
| `CardDescService/Repository` | `DeckService/Repository` |
| `CardDescRequest/Response` | `DeckRequest/Response` |
| `card_desc/` package | `deck/` package |

**Prerequisite:** Flyway must be in place before DB table rename.

### Architecture Debt: No Mapper Layer

DTOs are currently mapped inside services via private `toResponse()` methods.

Level 0 Done Criteria requires a dedicated mapper layer. This is currently unmet and tracked for Sprint 0.2.

---

## 15. Architecture Risks

1. `CardDesc` naming hides the Deck concept — confusing for new developers and AI agents.
2. Copy vs reference strategy for enrolling public decks is not finalized.
3. No Flyway means database schema is not version-controlled.
4. No `GlobalExceptionHandler` means API error responses may be inconsistent.
5. No mapper layer means the API contract depends too closely on entity structure.
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
| AI card generation requires deck ownership | Only the deck owner can create or AI-generate cards inside a deck. `CardServiceImpl.create()` and `createBulk()` must check `Objects.equals(cardDesc.getOwner().getId(), currentUserId)`; otherwise return `403 Forbidden`. |
| Bulk AI generation uses partial-success strategy | Sprint 0.2 fix: log failed titles with `logger.warn(...)`. Full partial response with `created[]` and `failed[]` is deferred to Sprint 0.4 / Level 1. |
| Answer checking remains automatic for MVP | Current MVP keeps `trim().equalsIgnoreCase()` answer validation. Self-check flow (`Again / Hard / Good / Easy`) is accepted as future direction but not implemented in Sprint 0.2. |
| Enrolled deck progress uses reference model | `UserDeckProgress` / `UserCardProgress` reference original deck/cards by ID. Copy/fork model is deferred. Protection against delete/orphaned progress will be handled in Sprint 0.3 via restrict/delete strategy and/or FK decisions. |

### Sprint 0.2 Priority Decisions

1. Fix ownership checks before any mapper/DTO cleanup.
2. Add `GlobalExceptionHandler` before expanding API behavior.
3. Do not redesign learning UX during Sprint 0.2.
4. Do not change DB relationship model before Flyway/Sprint 0.3.

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
- `CardDesc` → `Deck` rename (after Flyway)

**Level 2 — Portfolio-ready:**
- Flyway + `ddl-auto=validate`
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

## References

| Document             | Path                                          |
|----------------------|-----------------------------------------------|
| Roadmap              | `docs/roadmap/LL_Helper_Project_Roadmap.md`   |
| Conventions          | `backend/AGENTS.md`, `backend/CONVENTIONS.md` |
| Improvements backlog | `backend/IMPROVEMENTS.md`                     |
| Postman collection   | `LLHelper.postman_collection.json`            |
| Learning flow design | `docs/features/learning-flow.md`               |
| AI generation flow   | `docs/features/ai-generation-flow.md`          |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-02 | Initial version — Level 0 Architecture Freeze (Sprint 0.1) |
