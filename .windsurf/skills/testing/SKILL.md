---
name: testing
description: Use for test strategy decisions in the LLHelper backend — which test level to write, unit vs controller vs integration, and Testcontainers setup. Routes to the specific reference needed instead of loading all testing documentation.
---

# Testing Skill

Hard gates (naming, AAA, mocking, AssertJ, Clock injection) already auto-load from `backend/.windsurf/rules/testing-conventions.md` on test files. This skill routes to deeper decisions.

## Reference routing

- **Unit test for service/business logic:**
  - `references/unit-tests.md` — only if the hard gates in `testing-conventions.md` don't already cover the scenario (e.g. complex Mockito verification chains, Clock-dependent spaced-repetition logic)

- **`@WebMvcTest` / controller test:**
  - `references/controller-tests.md`

- **Repository test (`@DataJpaTest`) or full integration test (`@SpringBootTest` + Testcontainers):**
  - `references/testcontainers.md`
  - Repository and full integration tests belong to **Level 2**.
  - Read `docs/roadmap/current-sprint.md` to determine the active scope.
  - The current Level 0 testing baseline may include one explicitly listed Testcontainers DB smoke (`ApplicationContextLoadsTest`); do not generalize that exception to repository or full integration coverage.
  - Read `docs/roadmap/roadmap.md` only for future-level planning.

- **Just need naming/AAA/mocking/AssertJ conventions:**
  - Do not open any reference — `backend/.windsurf/rules/testing-conventions.md` already has it.

**Do not read all references by default.** State which decision requires a reference before opening it.

## Test level decision

| Question | Level | Annotation |
|---|---|---|
| Testing business logic in isolation? | 0 | `@ExtendWith(MockitoExtension.class)` |
| Testing HTTP status/JSON/validation? | 0 | `@WebMvcTest` |
| Testing DB constraints/triggers/custom queries? | 2 | `@DataJpaTest` + Testcontainers |
| Testing a full multi-component flow? | 2 | `@SpringBootTest` + Testcontainers |
| Testing full HTTP flow end-to-end? | 3 | RestAssured |

For a critical use case, write unit + `@WebMvcTest` together — no need to mirror every scenario on both levels (see `backend/.windsurf/rules/testing-conventions.md` → "Test Responsibility Zones").
