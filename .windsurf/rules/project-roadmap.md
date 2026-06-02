---
trigger: always_on
description: 
globs: 
---

# Project Roadmap Rule

Always use `docs/roadmap/LL_Helper Project Roadmap.md` as the source of truth for project direction.

Use `docs/architecture/current-architecture.md` as the current backend state snapshot.
Do not assume ideal architecture if the current architecture document says otherwise.

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