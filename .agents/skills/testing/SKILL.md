---
name: testing
description: Use for LLHelper backend test-strategy decisions, including choosing unit, controller, repository, integration, or end-to-end coverage and loading only the needed testing reference.
---

# Testing

Use the backend hard gates and `backend/AGENTS.override.md` already loaded for backend work; do not reread them. Read `.agents/guidance/backend/testing-conventions.md` if it is not already in context. This skill selects deeper guidance; do not load every reference.

## Routing

- Service or business-logic unit test: read [unit tests](references/unit-tests.md) only for Clock-dependent logic, multi-step verification, exception side effects, or non-trivial boundaries not covered by the scoped guidance.
- Controller `@WebMvcTest`: read [controller tests](references/controller-tests.md).
- Repository `@DataJpaTest` or `@SpringBootTest` with PostgreSQL Testcontainers: read [Testcontainers](references/testcontainers.md), then find the relevant testing/scope section in `docs/roadmap/current-sprint.md` to verify current scope.
- Naming, AAA, ordinary Mockito, AssertJ, or basic Clock rules: use `.agents/guidance/backend/testing-conventions.md`; do not open a deep reference.

State which test decision requires a reference before reading it.

## Test-level decision

| Question | Typical level | Typical mechanism |
|---|---|---|
| Business logic in isolation | Unit | `@ExtendWith(MockitoExtension.class)` |
| HTTP status, JSON, validation, or exception mapping | Controller slice | `@WebMvcTest` |
| Real database constraints, functions, or custom queries | Repository integration | `@DataJpaTest` + PostgreSQL Testcontainers |
| Multi-component application flow | Integration | `@SpringBootTest` + PostgreSQL Testcontainers |
| Full HTTP product flow | End-to-end | RestAssured when Level 3 and the current strategy/sprint permit it |

The table describes responsibility, not current authorization or timing. Read the relevant heading of `docs/roadmap/current-sprint.md` fresh before deciding whether a level is in scope; use the relevant level section of `docs/roadmap/roadmap.md` only for level planning or Done Criteria.

For a critical use case, pair service-level behavior with controller-level contract coverage without copying every scenario across both levels.
