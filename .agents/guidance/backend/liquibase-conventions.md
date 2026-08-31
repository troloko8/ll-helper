# Liquibase Conventions — Backend

Apply these conventions whenever creating, modifying, or reviewing a Liquibase YAML changelog. Liquibase owns the database schema; Hibernate/JPA maps to it.

## Hibernate DDL mode

- Never use `spring.jpa.hibernate.ddl-auto: update`.
- Prefer `validate`.
- `none` is acceptable in some environments.

## Migration immutability

Do not edit an applied or shared changeset, including V1–V6. Fix schema history with a new corrective migration. Only a local, unshared, unapplied changeset may be edited.

## Foreign keys

For V7 and later, create foreign keys with a separate `addForeignKeyConstraint` change. Do not add new inline foreign keys through `column.constraints`. Do not rewrite V1–V6 only for style.

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

Default to `RESTRICT` for `onDelete` and `onUpdate`. Use `CASCADE` only when the child has no independent business value and the parent strictly owns its lifecycle. Do not cascade deletion of users, learning progress, payments, bids, audits, history, or similar business records without a documented deletion policy.

PostgreSQL does not automatically index child-side FK columns. Decide whether joins, ownership checks, filtering, deletes, or frequent lookups require an index; when they do, add an explicit Liquibase `createIndex` change.

## Naming

For V9 and later use: `pk_<table>`, `uk_<table>_<cols>`, `fk_<child>_<parent>`, `idx_<table>_<cols>`, `chk_<table>_<rule>`. Prefer full table names.

Do not rename V1–V8 legacy constraints only for style, including `users_pkey`, `fk_udp_user`, `fk_ucp_card`, and `idx_ucp_user_deck`.

## Enums and defaults

- Store Java enums with `EnumType.STRING`, never ordinal values.
- Add a database CHECK constraint when the database must enforce allowed values.
- Put database defaults in Liquibase when the database must guarantee them.
- Never rely on entity `@ColumnDefault`.

## Destructive migration safety

For `dropColumn`, `dropTable`, `dropIndex`, or a column type change, add a comment explaining why the operation is safe. Use preconditions when target database state may vary.

For timestamp conversion, schema-ownership rationale, FK/index policy, or another cross-cutting decision, use `.agents/skills/database/SKILL.md` and open only the relevant reference.
