# Feature: Learning Mode

## Goal
Allow user to study cards from a selected deck with progress tracking.

## MVP (Implemented)
- Enroll deck to personal collection
- Get cards for study (10 cards max, LEARNING + NEW priority)
- Submit answer for a card
- Track progress per card (times seen/correct/wrong, streak)
- Card status: NEW → LEARNING → REVIEWING → MASTERED

## Later (Post-MVP)
- Spaced repetition algorithm (SM-2 or custom)
- `nextReviewAt` calculation
- `difficultyLevel` tracking
- Timer per card (`timeSpentMs`)
- Advanced statistics and analytics
- AI progress analysis and recommendations
- Synonym checking in answers
- Explicit card ordering in deck
- Teacher view of student progress

## Entities
- `CardDesc` (Deck) — added `owner` (User relation via `@ManyToOne`), `isPublic`
- `UserDeckProgress` — user's enrollment status
- `UserCardProgress` — per-card progress tracking
- `Card` — existing, linked to deck

## Enums
- `CardLearningStatus`: NEW, LEARNING, REVIEWING, MASTERED
- `UserDeckStatus`: ACTIVE, PAUSED, ARCHIVED

## API Endpoints
- `POST /api/v1/decks/{deckId}/enroll` — Add deck to collection (public decks only, creates all UserCardProgress with NEW status)
- `GET /api/v1/decks/{deckId}/study/cards` — Get up to 10 cards for study (LEARNING first, then NEW)
- `GET /api/v1/decks/{deckId}/cards` — Get all deck cards with progress info
- `POST /api/v1/cards/{cardId}/review` — Submit answer, get result (requires enrollment)

## Business Logic

### Card Selection (GET /decks/{deckId}/study/cards)
1. Priority 1: Cards with `status = LEARNING`, sorted by `card.id ASC`
2. Priority 2: NEW cards (no progress record), sorted by `card.id ASC`
3. Limit: 10 cards total

### Status Transition Rules
```
if (correctStreak >= 3) → MASTERED
else if (timesCorrect >= 2) → REVIEWING
else if (timesSeen >= 1) → LEARNING
else → NEW
```

### Answer Validation
- Case-insensitive match: `userAnswer.trim().equalsIgnoreCase(card.title.trim())`
- Synonyms not supported yet (MVP only)

### Security
- 403 if deck not enrolled
- 403 if deck is not public (on enroll)
- 404 if deck not found
- 409 if deck already enrolled
- Empty deck returns 200 with empty array

## Main Risks (Handled)
- User tries to access another user's private deck → 403
- User not authenticated → 401 (Spring Security)
- Deck has no cards → 200 with empty array
- Double enroll → 409 with message

## Database Constraints
```sql
-- user_card_progress.status
CHECK (status IN ('NEW', 'LEARNING', 'REVIEWING', 'MASTERED'))

-- user_deck_progress.status  
CHECK (status IN ('ACTIVE', 'PAUSED', 'ARCHIVED'))
```

---

## Definition of Done

### Functional
- [ ] User can enroll any public deck to personal collection
- [ ] User can view enrolled decks (via GET study cards check)
- [ ] User gets up to 10 cards for study (LEARNING first, then NEW)
- [ ] User can submit answer for a card
- [ ] Correct/incorrect result returned immediately
- [ ] Progress saved: timesSeen, timesCorrect, timesWrong, correctStreak
- [ ] Card status auto-calculated after each answer
- [ ] Empty deck returns 200 with empty array, not error

### Security
- [ ] 403 returned for non-enrolled private deck access
- [ ] 409 returned for duplicate enroll attempt
- [ ] 404 returned for non-existent deck/card
- [ ] Only authenticated users can access endpoints

### Data Integrity
- [ ] CHECK constraints applied on status fields
- [ ] Foreign key relationships exist (userId, cardId, deckId)
- [ ] Default values set: timesSeen=0, status=NEW/ACTIVE
- [ ] correctStreak resets to 0 on wrong answer

### Testing
- [ ] All 4 endpoints tested in Postman
- [ ] 200, 403, 404, 409 cases verified
- [ ] Data verified in PostgreSQL after operations
- [ ] Status transitions tested (NEW → LEARNING → REVIEWING → MASTERED)

### Code Quality
- [ ] Code follows project conventions (AGENTS.md)
- [ ] No `equals`/`hashCode`/`toString` in entities
- [ ] Lombok used correctly (`@Getter`/`@Setter`/`@NoArgsConstructor`)
- [ ] DTOs use Java `record`
- [ ] Endpoint naming: kebab-case
- [ ] Package-by-feature structure maintained

### Documentation
- [ ] Postman collection updated with new endpoints
- [ ] IMPROVEMENTS.md updated with future enhancements
- [ ] Design note file created (this file)

### Git
- [ ] Commit created with clear message: `feat: add learning mode (enroll, study, review)`
- [ ] All new files included in commit

---

## Files Changed/Created

### New Files
- `learning/entity/UserDeckProgress.java`
- `learning/entity/UserCardProgress.java`
- `learning/enums/UserDeckStatus.java`
- `learning/enums/CardLearningStatus.java`
- `learning/repository/UserDeckProgressRepository.java`
- `learning/repository/UserCardProgressRepository.java`
- `learning/service/LearningService.java`
- `learning/service/LearningServiceImpl.java`
- `learning/controller/LearningController.java`
- `learning/dto/request/CardReviewRequest.java`
- `learning/dto/response/CardReviewResponse.java`
- `learning/dto/response/DeckCardResponse.java`

### Modified Files
- `card_desc/entity/CardDesc.java` — added `owner` (@ManyToOne relation), `isPublic`
- `IMPROVEMENTS.md` — added Learning Mode future enhancements section
- `LLHelper.postman_collection.json` — added Learning group with 4 requests

---

## Postman Test Cases

### Enroll Deck (Public)
```
POST /api/v1/decks/1/enroll
Expected: 201 Created
Repeat: 409 Conflict ("Deck already enrolled")
```

### Enroll Deck (Private)
```
POST /api/v1/decks/2/enroll  // where deck 2 is private
Expected: 403 Forbidden ("Access denied: Deck is not public")
```

### Review Card (Correct)
```
POST /api/v1/cards/1/review
Body: { "userAnswer": "blueprint" }
Expected: 200 OK
{
  "correct": true,
  "correctAnswer": "blueprint",
  "status": "LEARNING/REVIEWING/MASTERED",
  "correctStreak": N,
  "totalCorrect": M
}
```

### Review Card (Wrong)
```
POST /api/v1/cards/1/review
Body: { "userAnswer": "wrong answer" }
Expected: 200 OK
{
  "correct": false,
  "correctAnswer": "blueprint",
  "status": "LEARNING",
  "correctStreak": 0,
  "totalCorrect": M
}
```

### Review Card (Without Enrollment)
```
POST /api/v1/cards/1/review  // without prior enrollment
Expected: 403 Forbidden ("Deck not enrolled. Please enroll first.")
```
