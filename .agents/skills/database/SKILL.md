---
name: database
description: Use for LLHelper backend entity, migration, relationship, foreign-key, index, constraint, cascade, or timestamp decisions that need cross-cutting database guidance.
---

# Database

Liquibase owns the schema; Hibernate/JPA maps to it. Use the backend hard gates and `backend/AGENTS.override.md` already loaded for backend work; do not reread them. Load only the guidance or reference needed for the current decision.

## Routing

- Plain nullable scalar column with no FK, unique/check constraint, index, timestamp conversion, cascade, or delete-policy decision: read `.agents/guidance/backend/entity-conventions.md` and `.agents/guidance/backend/liquibase-conventions.md`. Do not open deep references or database snapshots unless another aspect of the task requires them.
- JPA entity fields or annotations: read `.agents/guidance/backend/entity-conventions.md`.
- Table/column changes or a Liquibase changeset: read `.agents/guidance/backend/liquibase-conventions.md`. Read [schema ownership](references/schema-ownership.md) only for legacy naming context or the full source-of-truth rationale.
- Foreign key, cascade, unique constraint, or index: read [foreign keys and indexes](references/foreign-keys-and-indexes.md), then locate only the relevant relationship entry and policy section in `docs/database/relationships.md`.
- Timestamp type conversion or technical-versus-business timestamp ownership: read [timestamp migrations](references/timestamp-migrations.md).
- Mapper-only task: do not load database references; use `.agents/guidance/backend/mapstruct-conventions.md`.
- Current schema question: search `docs/database/relationships.md` for the entity, table, constraint, or index and read the matching section; do not load the full snapshot or deep references by default.

Before opening a reference, state which decision requires it. Stop once the task is sufficiently covered.

## Completion checks

- Entities describe mappings and do not duplicate real constraints, indexes, or defaults.
- Schema changes are represented in a new appropriate Liquibase changeset.
- `docs/database/relationships.md` is updated when relationships or schema facts it owns change.
- New foreign keys use explicit `addForeignKeyConstraint` with explicit delete/update behavior.
- Documentation ownership follows `.agents/guidance/documentation-sync.md`.
