---
trigger: always_on
description: 
globs: 
---

# Project Roadmap Rule

Always use these project control documents when relevant:

- `docs/roadmap/LL_Helper_Project_Roadmap.md` — project direction and current level
- `docs/architecture/current-architecture.md` — current backend architecture snapshot
- `docs/database/relationships.md` — current database/entity relationship snapshot

Use `docs/architecture/current-architecture.md` as the current backend architecture snapshot.

Use `docs/database/relationships.md` as the current database/entity relationship snapshot.

Do not assume ideal architecture or ideal database design if these documents say otherwise.

Current level is Level 0 — Stable Backend Foundation.

When proposing tasks, architecture, tests, APIs, docs, or refactoring, align suggestions with the current roadmap level.

Do not suggest Level 2, Level 3, or Level 4 features unless the user explicitly asks for future planning.

For the current stage, prioritize:

- current architecture documentation
- DB relationships documentation
- learning flow documentation
- AI generation flow documentation
- DTO cleanup
- mapper layer
- validation
- GlobalExceptionHandler
- Flyway V1 migration
- unit tests for learning/progress/AI parsing
- Postman collection update