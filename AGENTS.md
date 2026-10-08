# Cascade Agent Instructions — LLHelper

Backend gates: `backend/AGENTS.md`.
Frontend gates: `frontend/AGENTS.md`.

## Hard gates

- Read `docs/roadmap/current-sprint.md` fresh; its `## Sprint X.Y` header alone defines the current sprint. Never change it based on other docs or memory.
- Do not commit, push, delete branches, or modify remote resources unless explicitly requested.
- Warn early and before commit/push/deploy/execution about concrete hard-to-reverse effects with `## 🚨 Трудно или невозможно откатить`: name the trigger, affected data/users/systems, why code rollback fails, and recovery/compensation (or its absence). Examples: lossy migration/backfill, durable data/backup deletion, external payments/messages, secret publication, shared Git history rewrite. Do not flag ordinary reversible edits, local commits, additive migrations, or deployments with verified rollback by default. Keep commit and deployment risk distinct.
- Do not assume ideal architecture or DB design. Read `docs/architecture/current-architecture.md` for architecture facts and `docs/database/relationships.md` for relationship, constraint, index, or delete-policy facts only when needed.
- Do not expand beyond the currently documented level unless the user explicitly requests future planning.
- Read `docs/roadmap/current-sprint.md` fresh for planning, priority, scope, roadmap progress, or test level.
- Sync the normative documentation owner in the same task when architecture, API behavior, DB schema, security, documented flow, or roadmap progress changes.
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
| Frontend HTTP contract, DTOs, auth/errors, integration gaps | `docs/frontend/integration/BACKEND_CONTRACT_INVENTORY.md` (snapshot; backend code is authoritative) |
| Canonical Stitch screen → route → contract → readiness | `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md` (§0 current, §2–§7 historical; backend code is authoritative) |
| Documentation sync rule | `.windsurf/rules/documentation-sync.md` |

## Roadmap usage

- Do not read the full roadmap for ordinary implementation tasks. Read it only for planning, prioritization, milestone evaluation, or Done Criteria.
