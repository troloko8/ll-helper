# Backend instructions

Applies to `backend/**`; inherit root `AGENTS.md`.

## Hard gates

- Controllers have no business logic; services own use cases and transactions.
- Never expose JPA entities through APIs.
- Liquibase owns schema; JPA maps it. Never use `ddl-auto: update`.
- Check authenticated ownership inside the transaction before mutation, unless architecture explicitly defines another policy.
- Test behavior changes: critical business logic needs service unit tests; critical HTTP contracts need `@WebMvcTest`.
- For naming, DTOs, database queries and migrations, and rate limiting, read the relevant sections of `backend/CONVENTIONS.md`.

## Where to look

Load only task-relevant entries; root `AGENTS.md` routes architecture, DB, flows and known issues.
Windsurf: entity, migration, mapper and test conventions are in `backend/.windsurf/rules/` (`entity-conventions.md`, `liquibase-conventions.md`, `mapstruct-conventions.md`, `testing-conventions.md`).
Cross-cutting entity/schema/FK/index/constraint/cascade/timestamp decisions: `.windsurf/skills/database/SKILL.md`.
Test strategy: `.windsurf/skills/testing/SKILL.md`.
