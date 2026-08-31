# Testing Conventions — Backend

Apply these conventions when creating, modifying, or reviewing backend tests. For choosing unit, controller, repository, integration, or end-to-end coverage, use `.agents/skills/testing/SKILL.md`.

## Stack

- JUnit 5 for tests and lifecycle.
- Mockito for isolated dependencies.
- `@MockitoBean` in Spring Boot 4.x `@WebMvcTest`; do not use deprecated `@MockBean`.
- AssertJ assertions; do not use `assertEquals`, `assertNotNull`, or `assertTrue`.
- MockMvc for controller slice tests.
- PostgreSQL Testcontainers where integration coverage is in scope.
- Never use H2; it is incompatible with the schema's PostgreSQL behavior.

Read the relevant testing/scope heading of `docs/roadmap/current-sprint.md` fresh before deciding whether a planned test level is currently in scope. Do not encode the current project level here.

## Naming and structure

Name tests `method_shouldExpectedResult_whenCondition`.

Use Arrange/Act/Assert for non-trivial tests, one scenario per test, and deterministic independent tests. Do not use the wall clock or sleeps in tested logic.

## Time handling

Inject `Clock` into time-dependent services and use a fixed clock in tests:

```java
private final Clock clock;
Instant now = Instant.now(clock);

Clock clock = TestData.fixedClock();
```

Do not mock `Clock`.

## Mocking and side effects

- Mock external dependencies, not the class under test.
- Do not mock Lombok-generated code, record constructors, or Spring Data standard methods themselves.
- In controller tests, mock the service layer with `@MockitoBean`.
- If production code explicitly calls `save` or `saveAll`, verify the meaningful persistence call.
- On error paths, verify mutating calls did not happen.
- Avoid turning tests into full interaction logs.

Use distinct IDs for different entities so argument-order bugs cannot hide behind identical values.

For threshold comparisons, test one unit below the boundary as well as at or above it.

## Priorities

1. Business rules and calculations.
2. Security and ownership.
3. HTTP contract: 400, 401, 403, 404, 409, 429 and response shape.
4. Error scenarios.
5. Database constraints when that test level is in scope.

Do not unit-test Lombok, DTO getters, Spring Data internals, or Jackson serialization in isolation. Do assert public JSON contracts in controller tests, including enum values, timestamp format, and field names. Test the application's security configuration, not Spring Security internals.

## Fixtures and known bugs

Use `common/support/TestData.java` for shared helpers and a domain-specific fixture only after it grows beyond five methods. Keep critical scenario values visible in the test.

Never commit a permanently failing test. For an accepted known bug, use `@Disabled` with a reason and issue reference.

For a critical use case, cover business behavior with a unit test and HTTP mapping with `@WebMvcTest`; do not duplicate every scenario at every test level.

Further detail: `docs/testing/testing-strategy.md`, `backend/CONVENTIONS.md`, and the specific reference selected by `.agents/skills/testing/SKILL.md`.
