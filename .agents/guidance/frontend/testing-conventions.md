# Testing Conventions — Frontend

Apply these conventions when writing or reviewing frontend tests or deciding whether frontend coverage is required.

## Stack and levels

| Tool | Purpose |
|---|---|
| Vitest | Runner, assertions, mocking |
| React Testing Library | Component and integration behavior |
| MSW | Network-level API mocking |
| Playwright | Critical end-to-end flows |

| Level | What to protect | Required when |
|---|---|---|
| Unit | Pure logic, transformations, utilities, Zod schemas | Logic is non-trivial |
| Integration | Feature/page behavior through RTL + MSW | User interaction and API communication combine |
| E2E | Critical product flows | Current sprint or Done Criteria require them |

Read `docs/roadmap/current-sprint.md` fresh when sprint scope or timing matters.

Trivial presentational components, re-exports, type-only files, and styles do not need tests. Tests protect behavior, not coverage metrics.

## User-centric tests

- Test what the user observes and does, not internal state or implementation details.
- Query by roles, labels, and visible text. Use test IDs only when no semantic query works.
- Prefer `userEvent` to `fireEvent`.
- Do not inspect Redux internals directly.

Use `*.test.ts` or `*.test.tsx`, co-located with the source or in the same slice's `__tests__/`. Mirror the source filename and name scenarios by observable behavior.

## Mocking boundaries

- Mock APIs at the network boundary with MSW, not by mocking RTK Query hooks.
- Use `MemoryRouter` or the project router wrapper.
- Render with a real configured test store; do not mock `useSelector` or `useDispatch`.
- Mock external modules only when the real dependency is impractical.
- Never mock the unit being tested.

Shared handlers should return real backend DTO shapes. Per-test overrides may use `server.use(...)`.

## Test utilities and FSD

Business-agnostic setup and MSW infrastructure belong in `shared/lib/test/` and must not import higher layers. Helpers that depend on the configured application store or providers belong in `app/test/`. Do not create an FSD exception to place app-aware helpers in shared.

## Playwright

Keep E2E tests in a top-level `e2e/` or `frontend/e2e/` directory. Use page objects for repeated interactions. E2E tests run against a real or composed backend, not MSW.

Do not require 100% coverage, test React Router or Redux Toolkit internals, or add snapshot tests without an explicit visual-regression strategy.
