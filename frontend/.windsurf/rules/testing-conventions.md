---
trigger: model_decision
description: Use when writing, reviewing, or deciding test strategy for frontend code to enforce testing conventions and coverage requirements.
---

# Testing Conventions — Frontend

Hard gates and conventions for frontend testing in `frontend/`.

## Target stack

| Tool | Purpose |
|------|---------|
| Vitest | Test runner, assertions, mocking |
| React Testing Library (RTL) | Component/integration testing |
| MSW (Mock Service Worker) | API mocking for integration tests |
| Playwright | End-to-end tests for critical flows |

## Test levels and ownership

| Level | What to test | When required |
|-------|-------------|---------------|
| **Unit** | Pure logic, utility functions, domain transformations, Zod schemas | When function has non-trivial logic worth protecting |
| **Integration** | Features and page behavior via RTL + MSW | When a feature involves user interaction + API communication |
| **E2E** | Critical full product flows (auth → create → study) | For Sprint Done Criteria verification |

## What does NOT require a test

- Trivial presentational components (pure render, no logic).
- Re-exports / barrel files.
- Type definitions.
- CSS/style files.

Do not write tests merely for coverage metrics. Tests must protect meaningful behavior.

## Behavioral / user-centric testing

- Test **what the user sees and does**, not implementation details.
- Query by accessible roles, labels, text — not by CSS class or test-id (unless no better option).
- Avoid testing internal state shape or Redux store contents directly.
- Prefer `userEvent` over `fireEvent` for user interactions.

## Naming and location

- Test files: `*.test.ts` or `*.test.tsx`.
- Co-located with source file, or in a `__tests__/` directory within the same slice.
- Test file name mirrors source: `deck-card.tsx` → `deck-card.test.tsx`.
- Describe blocks: feature/component name. Test names: describe user-observable behavior.

## Mocking boundaries

- **API layer:** Mock at the network level via MSW handlers, not by mocking RTK Query hooks directly.
- **Router:** Use `MemoryRouter` or RTL's router wrapper for component tests.
- **Redux store:** Provide a real store with `renderWithProviders` utility; avoid mocking `useSelector`/`useDispatch`.
- **External modules:** Mock only when the real dependency is impractical (e.g. `crypto`, browser APIs).
- Never mock what you're testing.

## MSW conventions

- Shared MSW handlers live in a test utilities directory (e.g. `src/shared/lib/test/msw-handlers/`).
- Per-test handler overrides are allowed via `server.use(...)` inside individual tests.
- Handlers should return realistic response shapes matching actual backend DTOs.

## Test utility placement (FSD boundary)

- Business-agnostic test infrastructure (MSW server/handlers, `setup-tests.ts`) lives in `shared/lib/test/` and must obey normal FSD dependency direction — it must not import `app`/`pages`/`widgets`/`features`/`entities`.
- App-aware helpers that depend on the configured application store or providers (e.g. `renderWithProviders`) belong at `app` level (`app/test/`), not in `shared`.
- Do not add an FSD exception to justify placing app-aware helpers in `shared`.

## Playwright conventions

- E2E tests live in a top-level `e2e/` or `frontend/e2e/` directory.
- Page Object pattern for reusable page interactions.
- E2E tests run against a real (or docker-composed) backend — no MSW in E2E.

## Do not

- Do not require 100% coverage.
- Do not test React Router internals or Redux Toolkit internals.
- Do not snapshot-test unless there is a deliberate visual regression strategy.
