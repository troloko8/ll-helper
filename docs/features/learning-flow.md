# Learning Flow — Current Flow Design Note

> **Project:** LLHelper — AI Language Cards
> **Current level:** Level 0 — Stable Backend Foundation
> **Current sprint:** see `docs/roadmap/current-sprint.md`
> **Last updated:** 2026-07-30
> **Status:** Reflects current `LearningServiceImpl` implementation

---

## 1. Purpose

Describe the current learning flow: enroll → study cards → review card → update progress.

This document does not define advanced spaced repetition, StudySession history, teacher analytics, or AI recommendations.

---

## 2. Scope

### Current MVP Scope

- Enroll public deck
- Create deck-level progress (`UserDeckProgress`)
- Create card-level progress (`UserCardProgress`) for all deck cards
- Get up to 10 cards for study (prioritized by status)
- Submit answer and get result
- Update progress counters
- Update card learning status

### Out of Scope (Post-MVP)

- SM-2 spaced repetition algorithm
- `nextReviewAt` calculation
- `StudySession` / `StudySessionAnswer` entities
- Advanced analytics and teacher/student progress view
- AI-based answer validation
- Synonym / fuzzy answer checking
- `difficultyLevel` tracking
- Timer per card (`timeSpentMs`)
- Explicit card ordering in deck

---

## 3. Core Concepts

| Concept | Entity | Description |
|---|---|---|
| Deck | `Deck` | Content collection |
| Card | `Card` | Individual learning item |
| Enrollment | `UserDeckProgress` | User's enrollment state for a deck |
| Card Progress | `UserCardProgress` | User's learning state for a single card in an enrolled deck |
| Learning Service | `LearningServiceImpl` | Decides what to study and how progress changes |

### Enums

- `CardLearningStatus`: `NEW`, `LEARNING`, `REVIEWING`, `MASTERED`
- `UserDeckStatus`: `ACTIVE`, `PAUSED`, `ARCHIVED`

---

## 4. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/decks/{deckId}/enroll` | Enroll in a public deck |
| `GET` | `/api/v1/decks/{deckId}/study/cards` | Get up to 10 cards for study |
| `GET` | `/api/v1/decks/{deckId}/cards` | Get all deck cards with progress info |
| `POST` | `/api/v1/cards/{cardId}/review` | Submit answer, update progress |

---

## 5. Learning Flow

### 5.1 Enroll Deck

`POST /api/v1/decks/{deckId}/enroll`

**Current implementation order:**

1. Resolve authenticated user ID from JWT.
2. Find deck by `deckId`.
   - If not found → `404 Not Found`.
3. Check deck visibility.
   - If deck is not public → `403 Forbidden` (`AccessDeniedException`). Private-deck enroll is not possible for any user other than through this rejection — there is no auto-enroll or owner-bypass path in current code.
4. Attempt to create `UserDeckProgress` (`ACTIVE` status) and `UserCardProgress` for each deck card (`NEW` status, counters at `0`).
5. Duplicate enrollment is detected by the DB unique constraint `uk_user_deck_progress_user_deck` (V2 migration) — the resulting `DataIntegrityViolationException` is translated to `IllegalStateException` → `409 Conflict`. Other data integrity violations are also mapped to `409 Conflict` by `GlobalExceptionHandler`. There is no upfront service-level duplicate check.
6. Return `201 Created`.

> **Note:** Because duplicate enrollment is detected at insert time (step 5, after the visibility check in step 3), an already-enrolled **private** deck returns `403`, not `409` — the opposite of what an upfront duplicate-check order would produce.

---

### 5.2 Get Study Cards

`GET /api/v1/decks/{deckId}/study/cards`

**Selection algorithm:**

1. Resolve authenticated user.
2. Find `UserDeckProgress` for this user + deck.
   - If not enrolled → `409 Conflict` (throws `IllegalStateException`, mapped by `GlobalExceptionHandler` to `409`). Corrects the previous `403` claim in this section — see §9/§10/§11 (G-12).
3. Load all `UserCardProgress` for this enrollment.
4. Batch-load all corresponding `Card` entities (single query).
5. **Priority 1:** Cards with `status = LEARNING`, sorted by `card.id ASC`, up to 10.
6. **Priority 2:** Cards with `status = NEW`, sorted by `card.id ASC`, fill remaining slots up to 10.
7. Return combined list (max 10 cards). Empty deck → `200 OK` with empty array.

> Cards with `status = REVIEWING` or `MASTERED` are excluded from study selection (current implemented behavior).
>
> **Pending implementation (Phase 0.4C accepted target, not yet implemented):** `REVIEWING` cards should be included in study selection so spaced practice does not skip them entirely. Tracked as backend blocker G-08 — see `docs/roadmap/current-sprint.md`.

---

### 5.3 Get All Deck Cards

`GET /api/v1/decks/{deckId}/cards`

Returns all cards in the deck with their current progress info for the authenticated user.
Requires enrollment. Uses same batch-load pattern as study cards (no N+1).

---

### 5.4 Review Card

`POST /api/v1/cards/{cardId}/review`

**Steps:**

1. Resolve authenticated user.
2. Find `Card` by `cardId`.
   - If not found → `404 Not Found`.
3. Resolve parent deck from card.
4. Find `UserDeckProgress` for this user + deck.
   - If not enrolled → `409 Conflict` (see G-12 correction above).
5. Find `UserCardProgress` by `userDeckProgressId` + `cardId`.
   - If not found → `404 Not Found` (throws `EntityNotFoundException`).
6. Compare answer: `userAnswer.trim().equalsIgnoreCase(card.title.trim())`.
7. Update counters:
   - Always: `timesSeen + 1`, `lastReviewedAt = now`.
   - If correct: `timesCorrect + 1`, `correctStreak + 1`.
   - If wrong: `timesWrong + 1`, `correctStreak = 0`.
8. Recalculate `CardLearningStatus`.
9. Save `UserCardProgress`.
10. Update `UserDeckProgress.lastStudiedAt = now`.
11. Return `CardReviewResponse` (correct, correctAnswer, status, correctStreak, totalCorrect).

---

## 6. Status Transition Rules

```
if (correctStreak >= 3)    → MASTERED
else if (timesCorrect >= 2) → REVIEWING
else if (timesSeen >= 1)    → LEARNING
else                        → NEW
```

Status is **recalculated on every review**, not incremented step by step.

> **Note:** `REVIEWING` cards are not currently surfaced in `getStudyCards` (only `LEARNING` then `NEW` are queried). Tracked as backend blocker G-08 for Phase 0.4C's accepted Level 1 vertical MVP — see `docs/roadmap/current-sprint.md` and `backend/IMPROVEMENTS.md`. Not yet implemented.

---

## 7. Answer Validation

```text
userAnswer.trim().equalsIgnoreCase(card.title.trim())
```

- Case-insensitive
- Whitespace-trimmed
- No synonym support (MVP only)
- Answer is matched against `card.title` (the word, not definition/translation)

---

## 8. Definition of Done

- [x] User can enroll in a public deck
- [x] Duplicate enroll returns `409`
- [x] Private deck enroll returns `403`
- [x] Study endpoint returns up to 10 cards (LEARNING first, then NEW)
- [x] Review endpoint updates progress counters
- [x] Status transitions are correct (NEW → LEARNING → REVIEWING → MASTERED)
- [ ] Postman collection updated with all 4 endpoints — see `docs/roadmap/current-sprint.md`

---

## 9. Edge Cases / Expected Responses

| Case | Expected |
|------|----------|
| Enroll public deck | `201 Created` |
| Duplicate enroll | `409 Conflict` |
| Enroll private deck | `403 Forbidden` |
| Study empty deck | `200 OK` with empty array |
| Study cards without enrollment | `409 Conflict` (see §5.2, G-12) |
| Review card without enrollment | `409 Conflict` (see §5.4, G-12) |
| Non-existent deck / card | `404 Not Found` |

---

## 10. Handled Edge Cases

- User not authenticated → `401` (Spring Security filter)
- Deck not found → `404`
- Private deck enroll attempt → `403`
- Duplicate enroll → `409`
- Study/review without enrollment → `409` (see G-12)
- Empty deck study request → `200` with empty array

## 11. Known Open Risks

- Deleting a Deck or Card cascade-deletes dependent `UserCardProgress` / `UserDeckProgress` records at the DB level (V4/V5 `ON DELETE CASCADE`) — no orphans, but progress is permanently lost. Soft delete (mitigation) deferred to Level 1.
- Copy vs reference: reference model accepted for MVP (see `docs/database/relationships.md` §10); soft delete is the only remaining open item there.
- `REVIEWING` cards excluded from study selection — known gap, tracked as backend blocker G-08 for Phase 0.4C's accepted Level 1 vertical MVP, not yet implemented. See `backend/IMPROVEMENTS.md` and `docs/roadmap/current-sprint.md`.
- Duplicate enrollment is enforced only by the DB unique constraint `uk_user_deck_progress_user_deck` — relies on catching `DataIntegrityViolationException` and matching the constraint name in its message, which is fragile across DB drivers/locales (see FIXME in `LearningServiceImpl.enrollDeck()`).

---

## 12. References

| Document | Path |
|----------|------|
| Current sprint | `docs/roadmap/current-sprint.md` |
| Roadmap | `docs/roadmap/roadmap.md` |
| Current architecture | `docs/architecture/current-architecture.md` |
| Database relationships | `docs/database/relationships.md` |
| Postman collection | `LLHelper.postman_collection.json` |
