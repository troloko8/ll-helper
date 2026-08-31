# Schema Ownership

Use this reference when the scoped entity and Liquibase guidance do not answer a schema-ownership question, especially for legacy naming or rationale.

Liquibase is the single source of truth for database structure and behavior. Hibernate/JPA owns Java-to-database mapping only and must not create or evolve the schema.

For a structural entity change:

1. Update the Java mapping.
2. Add the corresponding Liquibase changeset.
3. Put real constraints, indexes, defaults, foreign keys, checks, triggers, functions, and other database behavior in Liquibase.
4. Keep Hibernate DDL on `validate` or an explicitly accepted `none`, never `update`.

## Legacy naming

The current naming patterns apply to newer migrations only. Do not rename existing constraints merely for style; migration immutability takes precedence. Known legacy forms include `users_pkey`, abbreviated foreign keys such as `fk_udp_user` and `fk_ucp_card`, and `idx_ucp_user_deck`.

Verify migration-version boundaries in `.agents/guidance/backend/liquibase-conventions.md` before authoring a new changeset.

## Enums and defaults

- Store Java enums as strings.
- Use database CHECK constraints when allowed values require database enforcement.
- Java defaults may initialize new objects.
- Database defaults belong in Liquibase when the database must guarantee them.
- Do not duplicate a database default with entity `@ColumnDefault`.

For the longer historical narrative, read `docs/database/schema-ownership.md` only if that context is needed.
