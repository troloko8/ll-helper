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

## Test Levels

| Level | Type | Annotation | Purpose |
|-------|------|------------|---------|
| 0 | Unit | `@ExtendWith(MockitoExtension.class)` | Business logic isolated |
| 0 | Controller | `@WebMvcTest` | HTTP contract: status, validation, JSON, GlobalExceptionHandler |
| 0 | DB smoke | `@SpringBootTest` + Testcontainers | One `contextLoads` test — Liquibase runs on clean PostgreSQL |
| 2 | Repository | `@DataJpaTest` + Testcontainers | Custom queries, constraints, triggers |
| 2 | Integration | `@SpringBootTest` + Testcontainers | Full flow |
| 3 | E2E | RestAssured | Full HTTP flow |

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

```java
// Prefer
assertThat(progress.getTimesCorrect()).isEqualTo(1);
assertThat(result).isNotNull();

// Over
assertEquals(1, progress.getTimesCorrect());
assertNotNull(result);

// Exceptions
assertThatThrownBy(() -> service.enroll(userId, deckId))
    .isInstanceOf(ConflictException.class)
    .hasMessageContaining("already enrolled");
```

## Test Data Fixtures

```
common/support/TestData.java             ← Clock, shared utils
learning/support/LearningTestData.java   ← domain-specific
deck/support/DeckTestData.java
```

**Rule:** Important scenario fields — explicit in test, not hidden in fixture.

**Rule:** Split TestData by domain when growing beyond 5 domain methods.

## @Disabled for Known Bugs

**Never commit permanently failing tests.** Red test in CI → real regressions are lost.

```java
@Disabled("Known bug: reset() does not clear bucket, see issue #42")
@Test
void reset_shouldClearBucket_whenCalled() { ... }
```

## Test Responsibility Zones

| Unit | @WebMvcTest | @DataJpaTest | Integration |
|------|-------------|--------------|-------------|
| Logic correct? | Status/JSON correct? | Constraint/trigger works? | Components work together? |

**Rule:** For critical use case — cover both business logic (unit) and HTTP mapping (@WebMvcTest). No need to mirror every scenario on both levels.

**Don't duplicate every branch on all levels** — some repetition is normal, but same conflict in unit + @WebMvcTest + integration + E2E is excessive.

## References

- **Detailed guide:** `docs/testing/testing-strategy.md` — full examples, explanations, templates
- **Test tasks:** `docs/roadmap/LL_Helper_Project_Roadmap.md` → Sprint 0.4
- **Business logic:** `docs/features/learning-flow.md`
- **CONVENTIONS.md:** Testing section