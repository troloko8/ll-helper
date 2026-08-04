---
trigger: glob
description: Liquibase migration conventions — naming, FK style, immutability, safety rules for changelog files
globs: backend/src/main/resources/db/changelog/**/*.yaml,backend/src/main/resources/db/changelog/**/*.yml
---

# Liquibase Conventions Rule

Liquibase is the single source of truth for the DB schema (see `backend/AGENTS.md` Hard gates). This file covers conventions specific to writing changesets.

## Hibernate DDL mode

- **Do not use:** `spring.jpa.hibernate.ddl-auto: update`
- **Preferred:** `spring.jpa.hibernate.ddl-auto: validate`
- **Acceptable in some environments:** `ddl-auto: none`

## Migration immutability

**Do not edit already applied or shared changesets**, including V1–V6.

If a schema mistake is found after a changeset was applied, create a new corrective migration instead of modifying history.

**Only local, unshared, unapplied changesets may be edited.**

## Foreign key style

**For all future migrations (V7+), foreign keys must be created with separate `addForeignKeyConstraint` changes.** Do not create new foreign keys inline inside `column.constraints`.

V1–V6 may contain legacy mixed FK style and must not be rewritten only for style cleanup.

❌ **Avoid (inline FK):** `constraints: { foreignKeyName: fk_cards_deck, referencedTableName: decks, referencedColumnNames: id }` inside `column`.

✅ **Prefer (explicit FK):**
```yaml
- addForeignKeyConstraint:
    baseTableName: cards
    baseColumnNames: deck_id
    constraintName: fk_cards_deck
    referencedTableName: decks
    referencedColumnNames: id
    onDelete: RESTRICT
    onUpdate: RESTRICT
```

**Why:** explicit `onDelete`/`onUpdate`, easier to modify later, consistent style.

## Default FK behavior

Unless explicitly documented, use:
```yaml
onDelete: RESTRICT
onUpdate: RESTRICT
```

Use `CASCADE` only when the child row has no independent business value and the parent-child lifecycle is strictly owned.

**Do not use `CASCADE` for users, learning progress, payments, bids, audit/history, or other business records unless an explicit deletion policy is documented.**

## FK index rule

PostgreSQL does not automatically create indexes for child-side foreign key columns. When adding a foreign key, decide whether an index is needed for joins, ownership checks, filtering, or frequent lookups — if so, add an explicit `createIndex` changeset.

## Naming conventions

`pk_<table>`, `uk_<table>_<cols>`, `fk_<child>_<parent>`, `idx_<table>_<cols>`, `chk_<table>_<rule>` — prefer full table names over abbreviations.

**Legacy exceptions (V1–V8) — do not rename for style only:** `users_pkey`, `fk_udp_user`/`fk_ucp_card`, `idx_ucp_user_deck`. V9+ must use the patterns above.

## Enum rule

Java enums must be stored as strings (`@Enumerated(EnumType.STRING)`, never `ORDINAL`). Allowed enum values must be enforced in Liquibase through a database-level CHECK constraint when needed.

## Default values

Database-side defaults must be defined in Liquibase when the database must guarantee them. **Never** rely on `@ColumnDefault` in entities.

## Safety rule

For destructive changes such as `dropColumn`, `dropTable`, `dropIndex`, or changing column types, add a comment explaining why it is safe. Use preconditions when a migration may run against databases with uncertain state.

## Deep reference

For a TIMESTAMP → TIMESTAMPTZ migration, schema-ownership background, or another database deep reference, use `.windsurf/skills/database/SKILL.md` to select the specific reference the task needs — do not open deep references by default.
