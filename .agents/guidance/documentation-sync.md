# Documentation Sync Guidance

Use this routing table when a change affects architecture, API behavior, database schema, learning or AI flows, security, package structure, frontend integration, or roadmap progress. The repository-wide hard gate lives in `AGENTS.md`: update the normative owner in the same task and do not duplicate the same fact across documents.

## Routing table

| Change affects... | Update |
|---|---|
| Backend package/module structure, controller/service/repository/entity/DTO/mapper layout, request lifecycle, backend auth flow, learning/AI flow at a glance, known issues, open decisions, API surface, or tech stack | `docs/architecture/current-architecture.md` |
| Entities/tables added or removed, FK, cascade, orphan removal, unique/check constraints, indexes, delete policy, copy-vs-reference, JPA relationships, relationship/FK-column nullability, enum storage, ID-only logical references, or enroll/review queries | `docs/database/relationships.md`; also check `docs/architecture/current-architecture.md` if structural |
| Enroll flow, study selection, review logic, progress calculation, status transitions, answer checking, spaced repetition, or learning-progress behavior | `docs/features/learning-flow.md` |
| AI card generation, prompt templates, provider implementation, AI rate limiting, bulk generation, AI errors/configuration, or generation ownership checks | `docs/features/ai-generation-flow.md` |
| Backend test stack/library, a new test type, naming, mocking/AAA patterns, test-level boundary, or test-data pattern | `.agents/guidance/backend/testing-conventions.md`; also update `backend/CONVENTIONS.md` and `.agents/skills/testing/SKILL.md` if its routing changed |
| New mapper hard gate, new case where a mapper is unnecessary, common mistake, or MapStruct behavior change | `.agents/guidance/backend/mapstruct-conventions.md`; verify the pointer in `backend/CONVENTIONS.md` still holds |
| Multi-source mapping, `@Context`, circular dependencies, or mapper architecture edge cases | `docs/backend/mapstruct-edge-cases.md` |
| Schema constraints, indexes, defaults, enum DB constraints, schema-describing JPA annotations, Hibernate DDL mode, or Liquibase structure | `.agents/guidance/backend/liquibase-conventions.md` and/or the relevant `.agents/skills/database/references/*.md`; also update `docs/database/relationships.md` and `.agents/guidance/backend/entity-conventions.md` when affected |
| Frontend FSD layer/slice structure, a layer or slice added/moved/removed, or public API boundary | `frontend/CONVENTIONS.md` (Architecture); also update `.agents/guidance/frontend/fsd-conventions.md` if a mechanical rule changed |
| Frontend state ownership, RTK Query architecture, API layer, or `fetchBaseQuery` configuration | `frontend/CONVENTIONS.md` (State/API); also update `frontend/AGENTS.md` if a hard gate changed |
| Frontend auth architecture, token lifecycle/persistence, 401 handling, or protected routes | `frontend/CONVENTIONS.md` (Authentication); also update `frontend/AGENTS.md` if a hard gate changed |
| Frontend routing architecture, router mode, layout structure, or guard pattern | `frontend/CONVENTIONS.md` (Routing) |
| Frontend test type, tool, naming, or mocking boundary | `.agents/guidance/frontend/testing-conventions.md`; also update `frontend/CONVENTIONS.md` (Testing) |
| Frontend design tokens, navigation shell, canonical screen registry, or reusable UI patterns | `docs/frontend/DESIGN.md`; also update `frontend/CONVENTIONS.md` (UI/Styling) if the CSS/token mechanism changed |
| A current-sprint task completed/moved/discovered or a done criterion met | `docs/roadmap/current-sprint.md` |
| Level/milestone completed, scope or level order changed, or an open architectural decision resolved | `docs/roadmap/roadmap.md` |
| New future task or technical debt outside the current sprint | `docs/roadmap/backlog.md` |
| Endpoint, HTTP method, request/response DTO, auth requirement, validation constraint, status code, or error body | Update `LLHelper.postman_collection.json` where applicable; update `docs/frontend/integration/BACKEND_CONTRACT_INVENTORY.md` first; then update affected entries in `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md` |

Adding an ordinary scalar column to an existing entity, without adding/removing an entity or table and without changing an FK, unique/check constraint, index, cascade, or delete policy, is not a package/layout change and does not by itself require changes to `docs/architecture/current-architecture.md` or `docs/database/relationships.md`.

Never claim a category is fully resolved while work remains deferred. State exactly what was resolved and route remaining work to `docs/roadmap/backlog.md` when appropriate.

## Planning and audit document lifecycle

Before creating a planning, audit, design, or decision document, use `.agents/skills/design-decision/SKILL.md`. Find the existing normative owner first and update it. Create a separate document only when no owner exists and the skill's new-document gate passes. Temporary documents must state their retirement or conversion trigger when created.

## Roadmap checkbox convention

Use `[ ]` for not done and `[x]` for done. Use `[~]` or `In progress:` only if the target file already uses that convention. Prefer checkboxes over strikethrough.

## Before editing code

Ask whether the change affects architecture, API behavior, database schema, learning or AI flow, security, package structure, frontend integration, roadmap status, Postman, or tests. If it does, update the appropriate owners together with the code.

## Completion report

Report: code files changed; documentation files changed; tests added or updated; Postman updated (yes/no); roadmap updated (yes/no). If documentation was not updated, explain why.
