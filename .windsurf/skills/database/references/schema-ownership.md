# Schema Ownership — Deep Reference

Read only when `backend/.windsurf/rules/entity-conventions.md` and `backend/.windsurf/rules/liquibase-conventions.md` (the hard gates) don't already answer the question — e.g. legacy naming background, or the full source-of-truth rationale.

## Core rule (rationale)

This project uses **Liquibase** as the single source of truth for the database schema. Hibernate/JPA owns Java-to-database mapping only, and must **not** create, update, or evolve the database schema.

If a change affects real database structure, integrity, performance, or database-level behavior, it must be implemented in Liquibase, not only in JPA annotations. This includes: constraints, indexes, defaults, FK, CHECK, UNIQUE, views, triggers, functions, procedures, extensions, schemas.

**Required workflow when adding/removing/changing an entity field:**
1. Update the Java entity mapping.
2. Add or update the matching Liquibase changeset.
3. Put real DB constraints, indexes, defaults, and checks in Liquibase.
4. Do not rely on Hibernate auto-DDL (`ddl-auto: validate`, never `update`).

## Legacy naming exceptions (V1–V8)

Current naming convention (`pk_<table>`, `uk_<table>_<cols>`, `fk_<child>_<parent>`, `idx_<table>_<cols>`, `chk_<table>_<rule>`) applies to **V9+ only**. Do not rename existing constraints for style alone — migration immutability applies.

Known legacy names, kept as-is:
- Primary keys: `users_pkey` (PostgreSQL default) instead of `pk_users`
- Foreign keys: `fk_udp_user`, `fk_ucp_card` instead of full names
- Indexes: `idx_ucp_user_deck` instead of full name
- V1 has 3 inline FK (`fk_users_auth_user`, `fk_decks_owner`, `fk_cards_deck`) mixed with later explicit-FK migrations (V4–V6) — not rewritten, per migration immutability

## Enum rule

Java enums must be stored as strings (`@Enumerated(EnumType.STRING)`, never `ORDINAL`). Allowed enum values must be enforced in Liquibase through a database-level CHECK constraint when needed (see `decks.source_language`/`target_language` in V6 for a real example: `Language` Java enum + DB CHECK constraint, no default value hidden in the entity).

## Default values

- Java-side defaults are allowed for new entity objects (fields set in the constructor/builder).
- Database-side defaults must be defined in Liquibase when the database must guarantee them (`DEFAULT CURRENT_TIMESTAMP`, etc.).
- **Never** use `@ColumnDefault` in entities — it duplicates a fact Liquibase already owns and can silently drift from the real DEFAULT.

## Full detailed guide

For the complete narrative version (with more historical context and examples), see `docs/database/schema-ownership.md`.
