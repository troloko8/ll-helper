# Unit Tests — Deep Reference

Read only when the hard gates in `backend/.windsurf/rules/testing-conventions.md` don't already cover the scenario.

## Clock-dependent logic (spaced repetition, rate limiting windows)

Inject `Clock` via constructor, never `@Mock` it — use a fixed value:

```java
// Service under test
private final Clock clock;
Instant now = Instant.now(clock);

// Test
private final Clock clock = Clock.fixed(Instant.parse("2024-01-01T10:00:00Z"), ZoneOffset.UTC);
LearningServiceImpl service = new LearningServiceImpl(repo, mapper, clock);
```

When testing interval math (e.g. `nextReviewAt`), assert the exact expected `Instant`, not just "is in the future":

```java
assertThat(progress.getNextReviewAt()).isEqualTo(FIXED_NOW.plus(1, ChronoUnit.DAYS));
```

## Verifying multi-step service methods

When a service method does several things (rate-limit check → ownership check → mutation → save), verify **order** matters only when a bug would come from wrong order (e.g. rate limit must run before any DB query):

```java
InOrder inOrder = inOrder(userRateLimiter, cardRepository);
inOrder.verify(userRateLimiter).checkLimitByEmail(any(), any());
inOrder.verify(cardRepository).save(any());
```

Don't add `InOrder` verification everywhere — only where the order is actually a documented requirement (see `backend/CONVENTIONS.md` → Rate Limiting: "Rate limit is ALWAYS the first call").

## Testing exception → side-effect-free guarantees

For every thrown-exception scenario, pair the exception assertion with a `never()` verification on any mutating call, not just the exception type:

```java
assertThatThrownBy(() -> service.enrollDeck(userId, deckId))
    .isInstanceOf(ConflictException.class);

verify(userDeckProgressRepository, never()).save(any());
```

## Parameterized tests for threshold logic

When boundary testing (see `testing-conventions.md` → "Boundary Testing for Threshold Logic") needs more than 2 cases, prefer `@ParameterizedTest` over copy-pasted test methods:

```java
@ParameterizedTest
@ValueSource(ints = {0, 1, 2})
void review_shouldStayReviewing_whenStreakBelowThreshold(int streak) { ... }
```
