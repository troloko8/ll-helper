# Cascade Agent Instructions — LLHelper Backend

Backend-specific hard gates. Applies to all code inside `backend/**`.
Repository-wide gates: see root `AGENTS.md`.

## Hard gates

- Controllers must not contain business logic.
- Services own business use cases and transaction boundaries.
- Never expose JPA entities through the API.
- Liquibase owns the database schema; Hibernate/JPA only maps to it — never use `ddl-auto: update`.
- Owner-controlled resources may be mutated only by their authenticated owner unless the current architecture explicitly defines another authorization policy. Verify authorization before mutating, inside the transaction.
- Backend behavior changes require appropriate tests. Critical business logic requires service-level unit tests; critical HTTP contracts require `@WebMvcTest` coverage.
## Where to look

- Load only the rule, skill, reference, or normative document required by the current task. Do not read all linked files by default.

| Need | Read |
|------|------|
| JPA entity conventions | `backend/.windsurf/rules/entity-conventions.md` — auto-loads on entity files |
| Test conventions | `backend/.windsurf/rules/testing-conventions.md` — auto-loads on test files |
| Liquibase migration conventions | `backend/.windsurf/rules/liquibase-conventions.md` — auto-loads on changelog files |
| MapStruct conventions | `backend/.windsurf/rules/mapstruct-conventions.md` — auto-loads on mapper files |
| Cross-cutting entity + migration, FK, index, cascade, constraint, or timestamp decisions | `.windsurf/skills/database/SKILL.md` |
| Test strategy decisions | `.windsurf/skills/testing/SKILL.md` |
| Current architecture | `docs/architecture/current-architecture.md` |
| Current DB relationships | `docs/database/relationships.md` |
| Learning flow | `docs/features/learning-flow.md` |
| AI generation flow | `docs/features/ai-generation-flow.md` |
| Backend conventions (naming, DTO, rate limiting) | `backend/CONVENTIONS.md` |
| Known issues / tech debt | `backend/IMPROVEMENTS.md` |
