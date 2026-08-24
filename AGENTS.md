# Cascade Agent Instructions — LLHelper

Repository-wide hard gates and documentation routing table.
Backend-specific gates: `backend/AGENTS.md`.
Frontend-specific gates: `frontend/AGENTS.md`.

## Hard gates

- The `## Sprint X.Y` header in `docs/roadmap/current-sprint.md` is the single runtime source of truth for the current sprint. Read it fresh; do not edit it to match `roadmap.md`, `changelog.md`, `backlog.md`, or prior conversation context.
- Do not commit, push, delete branches, or modify remote resources unless explicitly requested.
- Do not assume ideal architecture or ideal database design. Read `docs/architecture/current-architecture.md` only when actual architectural context is needed, and `docs/database/relationships.md` only when a relationship, constraint, index, or delete-policy fact is needed.
- Do not expand beyond the currently documented level unless the user explicitly requests future planning.
- When planning, prioritizing, evaluating scope, updating roadmap progress, or choosing the appropriate test level, read `docs/roadmap/current-sprint.md` fresh.
- When a change affects architecture, API behavior, database schema, security rules, a documented business flow, or roadmap progress, update its normative documentation owner in the same task.
- Update only the normative owner of each changed fact; do not duplicate the same information across documents.

## Documentation routing table

| Fact | Source of truth |
|------|-----------------|
| Current sprint / level | `docs/roadmap/current-sprint.md` (read fresh when scope or project status is relevant) |
| Levels and Done Criteria | `docs/roadmap/roadmap.md` |
| Future backlog / tech debt | `docs/roadmap/backlog.md` |
| Completed sprints | `docs/roadmap/changelog.md` |
| Current system architecture | `docs/architecture/current-architecture.md` (read only when actual architectural context is needed) |
| Current DB relationships | `docs/database/relationships.md` (read only when a relationship, constraint, index, or delete-policy fact is needed) |
| Learning flow | `docs/features/learning-flow.md` |
| AI generation flow | `docs/features/ai-generation-flow.md` |
| Backend conventions | `backend/CONVENTIONS.md` |
| Backend known issues | `backend/IMPROVEMENTS.md` |
| Backend hard gates | `backend/AGENTS.md` |
| Frontend hard gates | `frontend/AGENTS.md` |
| Frontend conventions | `frontend/CONVENTIONS.md` |
| Frontend FSD conventions | `frontend/.windsurf/rules/fsd-conventions.md` |
| Frontend testing conventions | `frontend/.windsurf/rules/testing-conventions.md` |
| Frontend design system (tokens, shell, screen registry) | `docs/frontend/DESIGN.md` |
| Frontend-consumed backend HTTP contract, DTOs, auth/error behavior and known integration gaps | `docs/frontend/integration/BACKEND_CONTRACT_INVENTORY.md` (repository-grounded snapshot, not the executable source of truth — executable backend code remains authoritative) |
| Screen → candidate route → backend contract → readiness mapping for every canonical Stitch reference | `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md` (routes and frontend phases in this map are Phase 0.4C candidates, not accepted runtime decisions) |
| Documentation sync rule | `.windsurf/rules/documentation-sync.md` |

## Roadmap usage

- Do not read the full roadmap for ordinary implementation tasks. Read it only for planning, prioritization, milestone evaluation, or Done Criteria.
