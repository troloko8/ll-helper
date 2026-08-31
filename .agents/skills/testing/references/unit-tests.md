# Unit Tests

Use this reference only when `.agents/guidance/backend/testing-conventions.md` does not cover the scenario.

## Time-dependent logic

Inject a real fixed `Clock`; do not mock it. Assert exact instants for interval calculations.

```java
Clock clock = Clock.fixed(Instant.parse("2024-01-01T10:00:00Z"), ZoneOffset.UTC);
LearningServiceImpl service = new LearningServiceImpl(repo, mapper, clock);

assertThat(progress.getNextReviewAt()).isEqualTo(FIXED_NOW.plus(1, ChronoUnit.DAYS));
```

## Multi-step services

Verify call order only when order is a documented behavioral requirement, such as rate limiting before any database access. Do not add `InOrder` to ordinary tests.

```java
InOrder inOrder = inOrder(userRateLimiter, cardRepository);
inOrder.verify(userRateLimiter).checkLimitByEmail(any(), any());
inOrder.verify(cardRepository).save(any());
```

## Exception paths

Pair exception assertions with verification that mutating calls did not occur.

```java
assertThatThrownBy(() -> service.enrollDeck(userId, deckId))
    .isInstanceOf(ConflictException.class);

verify(userDeckProgressRepository, never()).save(any());
```

## Thresholds

When a boundary needs more than two cases, prefer parameterized tests to copied methods. Cover at least one value below the threshold and the boundary value.
