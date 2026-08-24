---
trigger: model_decision
description: Use when a code change affects architecture, API contracts, database schema or relationships, security behavior, documented feature flows, package structure, or roadmap completion, to determine which documentation must be updated.
---

# Documentation Sync Rule

If a change affects architecture, API, DB schema, learning flow, AI flow, security, package structure, or roadmap progress, the owning doc must be updated in the same change. The non-negotiable hard gate lives in root `AGENTS.md`. This file is the trigger→doc routing table.

## Routing table

| Change affects... | Update |
|---|---|
| **Backend** package/module structure, controller/service/repo/entity/DTO/mapper layout, request lifecycle, backend auth flow, learning/AI flow at a glance, known issues, open decisions, API surface, tech stack | `docs/architecture/current-architecture.md` |
| Entities/tables added or removed, FK, cascade, orphanRemoval, unique/check constraints, indexes, (soft) delete, copy-vs-reference, `@OneToOne/@OneToMany/@ManyToOne/@ManyToMany`, `@JoinColumn`, relationship/FK-column nullability, enum storage, ID-only logical refs (`Long userId`), enroll/review queries | `docs/database/relationships.md` — check `current-architecture.md` too if structural |
| Enroll flow, study selection, review logic, progress calc, status transitions, answer checking, spaced repetition, `UserDeckProgress`/`UserCardProgress` behavior | `docs/features/learning-flow.md` |
| AI card generation logic, prompt template, provider impl, AI rate limiting, bulk generation, AI error handling, AI config, ownership checks for generation | `docs/features/ai-generation-flow.md` |
| Test stack/library, new test type, naming convention, new mock/AAA pattern, Level 0 vs Level 2 boundary, `TestData.java` pattern | `backend/.windsurf/rules/testing-conventions.md` — also update `backend/CONVENTIONS.md` (Testing) and `.windsurf/skills/testing/SKILL.md` if routing changed |
| New mapper hard-gate, new "don't use mapper" case, common mistake, MapStruct version behavior change | `backend/.windsurf/rules/mapstruct-conventions.md` — verify the one-line pointer in `backend/CONVENTIONS.md` (Mapper) still holds |
| Multi-source mapping, `@Context`, circular deps, mapper architecture edge cases | `docs/backend/mapstruct-edge-cases.md` (not the conventions rule) |
| Schema constraints (unique/check/FK/not-null), indexes, defaults, enum DB constraints, schema-describing JPA annotations, `ddl-auto`, Liquibase structure | `backend/.windsurf/rules/liquibase-conventions.md` and/or `.windsurf/skills/database/references/*.md` — also update `relationships.md` + `entity-conventions.md` |
| Frontend FSD layer/slice structure, new layer, removed layer, slice added/moved/removed, public API boundary change | `frontend/CONVENTIONS.md` (Architecture section) — also update `frontend/.windsurf/rules/fsd-conventions.md` if a mechanical rule changed |
| Frontend state ownership pattern, RTK Query architecture, API layer structure, fetchBaseQuery config | `frontend/CONVENTIONS.md` (State/API sections) — also update `frontend/AGENTS.md` if a hard gate changed |
| Frontend auth architecture (token lifecycle, persistence, 401 handling, protected routes) | `frontend/CONVENTIONS.md` (Authentication section) — also update `frontend/AGENTS.md` if boundary changed |
| Frontend routing architecture (router mode, layout structure, guard pattern) | `frontend/CONVENTIONS.md` (Routing section) |
| Frontend testing conventions (new test type, tool, naming, mocking boundary) | `frontend/.windsurf/rules/testing-conventions.md` — also update `frontend/CONVENTIONS.md` (Testing) |
| Frontend design tokens, navigation shell, canonical screen registry, reusable UI pattern list | `docs/frontend/DESIGN.md` — also update `frontend/CONVENTIONS.md` (UI/Styling) if the CSS/token mechanism changed |
| Current-sprint task completed/moved/discovered, a done criterion met | `docs/roadmap/current-sprint.md` |
| Level/milestone completed, scope or level order change, open architectural decision resolved | `docs/roadmap/roadmap.md` |
| New future task / tech debt discovered, not in current sprint | `docs/roadmap/backlog.md` |
| Endpoint, HTTP method, request/response DTO, auth requirement, validation constraint, status code, or error body changes | Update `LLHelper.postman_collection.json` where applicable; update `docs/frontend/integration/BACKEND_CONTRACT_INVENTORY.md` first; then update the affected entries in `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md` |

Adding an ordinary scalar column to an existing entity (no new/removed entity or table, FK, unique/check constraint, index, cascade/delete-policy change) is not a package/layout change and does not by itself require updating `current-architecture.md` or `docs/database/relationships.md`.

Never claim a category is fully resolved ("all issues resolved") when items remain deferred — state precisely what's resolved and point to `backlog.md` for the rest.

## Roadmap checkbox convention

Use `[ ]` not done, `[x]` done, `[~]`/`In progress:` only if the file already uses that convention. Prefer checkboxes over strikethrough (`~~text~~`).

## Before editing code

Ask: does this change architecture, API, DB schema, learning flow, AI flow, or roadmap status? Does it need a Postman update or tests? If yes to any, update the relevant docs together with the code.

## Output requirement

When finishing a task, report: code files changed, documentation files changed, tests added/updated, Postman updated (y/n), roadmap updated (y/n). If documentation was not updated, explain why.