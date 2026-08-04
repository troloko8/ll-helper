---
trigger: glob
description: Testing conventions — loaded when working with test files
globs: backend/src/test/**/*.java,**/*Test.java,**/*Tests.java,**/TestData.java
---

# Testing Conventions — LLHelper Backend

> **Краткие обязательные правила для AI.**  
> Подробная документация: `docs/testing/testing-strategy.md`

## Stack (Spring Boot 4.0.6)

- **JUnit 5** — `@Test`, `@BeforeEach`, `@ExtendWith`
- **Mockito** — `@Mock`, `when()`, `verify()`
- **@MockitoBean** — Spring Boot 4.x заменяет `@MockBean` в `@WebMvcTest`
- **AssertJ** — `assertThat(...).isEqualTo(...)` (always prefer over `assertEquals`)
- **MockMvc** — `@WebMvcTest`
- **Testcontainers PostgreSQL** — Level 0: один `contextLoads` smoke; Level 2+: полноценные тесты
- **Never use H2** — несовместим с TIMESTAMPTZ, триггерами, CHECK constraints

Test level decision (Unit vs `@WebMvcTest` vs Testcontainers) is routed in `.windsurf/skills/testing/SKILL.md` — do not duplicate that table here.

## Naming

**Format:** `method_shouldExpectedResult_whenCondition`

```java
enroll_shouldThrowConflict_whenDeckAlreadyEnrolled()
update_shouldThrowForbidden_whenUserIsNotOwner()
login_shouldReturn429_whenRateLimitExceeded()
```

## Structure

- **Arrange / Act / Assert** — for non-trivial tests; trivial one-liners don't need AAA comments
- One scenario per test
- Tests must be independent and deterministic
- Never use `Instant.now()`, `LocalDateTime.now()`, `Thread.sleep()` in tested code

## Time Handling

**Always inject `Clock` into services that use time:**

```java
// Service
private final Clock clock;
Instant now = Instant.now(clock);

// Test
Clock clock = TestData.fixedClock(); // Clock.fixed("2024-01-01T10:00:00Z")
```

## Mocking

**Unit tests:**
- Mock all external dependencies (`@Mock`)
- Never mock the class under test
- Clock via constructor with fixed value, not `@Mock`

**@WebMvcTest:**
- Mock service layer with `@MockitoBean` (Spring Boot 4.x)

**Never mock:**
- Lombok-generated code
- Spring Data standard methods themselves — test your behavior through them
- `record` constructors

## Side-Effect Verification

If the service explicitly calls `repository.save(...)`/`saveAll(...)` (not relying on JPA dirty-checking), verify that call — state assertions alone don't prove persistence was requested: `verify(repo).save(entity)`. On error paths, verify mutating calls were **not** made: `verify(repo, never()).save(any())`. Only verify calls meaningful to the behavior under test — don't turn a test into a full call-log.

## Test Data Hygiene

Use **distinct** constant IDs per entity (`userId=1L, deckId=2L, cardId=3L`, not all `1L`) — identical values can mask argument-order bugs.

## Boundary Testing for Threshold Logic

For threshold comparisons (`>=`, `>`, `<=`, `<`), add a test **one unit below** the threshold in addition to at/above — a single "reaches threshold" test misses off-by-one bugs (e.g. rate limits, spaced-repetition streaks, pagination limits).

## What NOT to Test

- Lombok-generated code
- Spring Data methods themselves — test your DB behavior through them, not `save()` itself
- Separate unit tests for Jackson DTO serialization — **BUT** JSON API contract in `@WebMvcTest` is mandatory (enum values, Instant format, field names)
- Spring Security internals — **BUT** test your security config (401, 403)
- Simple DTO getters

## What TO Test (Priority)

1. Business rules and calculations
2. Security and ownership checks
3. HTTP contract (400, 401, 403, 404, 409, 429)
4. Error scenarios
5. DB constraints (Level 2)

## AssertJ Style

Always `assertThat(...)` / `assertThatThrownBy(...)` — never `assertEquals`/`assertNotNull`/`assertTrue`.

## Test Data Fixtures

`common/support/TestData.java` (Clock, shared utils) + one `<Domain>TestData.java` per domain once it grows beyond 5 methods (e.g. `learning/support/LearningTestData.java`). Critical scenario fields stay explicit in the test, not hidden in the fixture.

## @Disabled for Known Bugs

Never commit a permanently failing test. For a known bug, use `@Disabled("Known bug: ..., see issue #N")` with an issue reference, not a silently deleted/skipped test.

## Test Responsibility Zones

For a critical use case, cover both business logic (unit) and HTTP mapping (`@WebMvcTest`) — no need to mirror every scenario on both levels, and never the same conflict on all levels (unit + @WebMvcTest + integration + E2E). See `.windsurf/skills/testing/SKILL.md` for level routing.

## References

- **Detailed guide:** `docs/testing/testing-strategy.md` — full examples, explanations, templates
- **Test tasks:** `docs/roadmap/current-sprint.md`
- **Business logic:** `docs/features/learning-flow.md`
- **CONVENTIONS.md:** Testing section
