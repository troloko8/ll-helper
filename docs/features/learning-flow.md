# Learning Flow — Current Flow Design Note

> **Project:** LLHelper — AI Language Cards
> **Current level:** Level 0 — Stable Backend Foundation
> **Sprint:** Sprint 0.1 — Architecture Freeze
> **Status:** Documentation only — current learning flow snapshot

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

1. Validate authenticated user (resolve from JWT → `AuthUser` → `User`).
2. Check duplicate enrollment.
   - If already enrolled → `409 Conflict`.
3. Find deck by `deckId`.
   - If not found → `404 Not Found`.
4. Check deck visibility.
   - If deck is not public → `403 Forbidden`.
5. Create `UserDeckProgress` with `ACTIVE` status.
6. Create `UserCardProgress` for each card in the deck with `NEW` status and all counters at `0`.
7. Return `201 Created`.

> **Note:** Current implementation checks duplicate enrollment (step 2) before visibility (step 4). This means an already-enrolled private deck returns `409` before `403`. Acceptable for current MVP — should be reviewed during Sprint 0.2 cleanup.

---

### 5.2 Get Study Cards

`GET /api/v1/decks/{deckId}/study/cards`

**Selection algorithm:**

1. Resolve authenticated user.
2. Find `UserDeckProgress` for this user + deck.
   - If not enrolled → `403` (throws `IllegalStateException`).
3. Load all `UserCardProgress` for this enrollment.
4. Batch-load all corresponding `Card` entities (single query).
5. **Priority 1:** Cards with `status = LEARNING`, sorted by `card.id ASC`, up to 10.
6. **Priority 2:** Cards with `status = NEW`, sorted by `card.id ASC`, fill remaining slots up to 10.
7. Return combined list (max 10 cards). Empty deck → `200 OK` with empty array.

> Cards with `status = REVIEWING` or `MASTERED` are excluded from study selection.

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
   - If not enrolled → `403 Forbidden`.
5. Find `UserCardProgress` by `userDeckProgressId` + `cardId`.
   - If not found → `409 Conflict` (implies not enrolled or card not in this deck).
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

> **Note:** `REVIEWING` cards are not currently surfaced in `getStudyCards`. This may be a gap — review during Sprint 0.2.

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

- [ ] User can enroll in a public deck
- [ ] Duplicate enroll returns `409`
- [ ] Private deck enroll returns `403`
- [ ] Study endpoint returns up to 10 cards (LEARNING first, then NEW)
- [ ] Review endpoint updates progress counters
- [ ] Status transitions are correct (NEW → LEARNING → REVIEWING → MASTERED)
- [ ] Postman collection updated with all 4 endpoints

---

## 9. Edge Cases / Expected Responses

| Case | Expected |
|------|----------|
| Enroll public deck | `201 Created` |
| Duplicate enroll | `409 Conflict` |
| Enroll private deck | `403 Forbidden` |
| Study empty deck | `200 OK` with empty array |
| Review card without enrollment | `403 Forbidden` |
| Non-existent deck / card | `404 Not Found` |

---

## 10. Handled Edge Cases

- User not authenticated → `401` (Spring Security filter)
- Deck not found → `404`
- Private deck enroll attempt → `403`
- Duplicate enroll → `409`
- Empty deck study request → `200` with empty array

## 11. Known Open Risks

- Deleting a Deck or Card can leave orphaned `UserCardProgress` / `UserDeckProgress` records (no DB FK protection).
- Cascade/delete behavior for progress entities is unresolved.
- DB-level FK constraints for progress ID references deferred to Sprint 0.3.
- Copy vs reference strategy for progress records is still open (see `docs/database/relationships.md` §10).
- `REVIEWING` cards excluded from study selection — may be a logic gap.
- Duplicate enrollment protection is service-only — no DB unique constraint yet.

---

## 12. References

| Document | Path |
|----------|------|
| Roadmap | `docs/roadmap/LL_Helper_Project_Roadmap.md` |
| Current architecture | `docs/architecture/current-architecture.md` |
| Database relationships | `docs/database/relationships.md` |
| Postman collection | `LLHelper.postman_collection.json` |
