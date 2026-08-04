---
name: database
description: Use for entity, migration, relationship, foreign key, index, or timestamp-type decisions in the LLHelper backend. Routes to the specific reference needed instead of loading all database documentation.
---

# Database Skill

Liquibase owns the DB schema; Hibernate/JPA only maps to it (see `backend/AGENTS.md` Hard gates). This skill routes to the specific decision you need — **read only the references required by the task.**

## Reference routing

- **Adding a plain nullable scalar column to an existing entity** (no new FK, unique/check constraint, index, timestamp-type conversion, cascade, or delete-policy decision):
  - For database-specific routing, use `backend/.windsurf/rules/entity-conventions.md` and `backend/.windsurf/rules/liquibase-conventions.md`.
  - Do not open database deep references, `docs/database/relationships.md`, or `docs/architecture/current-architecture.md`.
  - Cross-cutting rules such as `.windsurf/rules/documentation-sync.md` still apply when triggered.

- **Creating or modifying a JPA entity (fields, annotations, Lombok):**
  - `backend/.windsurf/rules/entity-conventions.md` (already auto-loads on entity files — you may already have it)

- **Adding, removing, renaming a DB column/table, or writing a Liquibase changeset:**
  - `backend/.windsurf/rules/liquibase-conventions.md` (already auto-loads on changelog files)
  - `references/schema-ownership.md` — only if you need the legacy V1–V8 naming background or the full source-of-truth rationale

- **Adding or changing a foreign key, cascade rule, unique constraint, or index:**
  - `references/foreign-keys-and-indexes.md`
  - `docs/database/relationships.md` — current relationship/constraint snapshot

- **Converting a timestamp column type, or deciding technical vs business timestamp ownership:**
  - `references/timestamp-migrations.md`

- **Editing only a mapper:**
  - Do not load database references. Use `backend/.windsurf/rules/mapstruct-conventions.md` instead.

- **General "what does the DB currently look like" question:**
  - `docs/database/relationships.md` — do not open the deep references below for this

**Do not read all references by default.** Before opening a reference, state which decision requires it. Stop loading references once the task is sufficiently covered.

## Final checklist (before finishing a DB/entity task)

- [ ] Entity annotations describe mapping only (no `@Table(uniqueConstraints/indexes)`, `@Check`, `@ColumnDefault`, `@Index`)
- [ ] Real constraints/indexes/defaults are in a Liquibase changeset, not just Java
- [ ] `docs/database/relationships.md` updated if entities/relationships changed
- [ ] Foreign keys use explicit `addForeignKeyConstraint` (V7+), not inline, with explicit `onDelete`/`onUpdate`
