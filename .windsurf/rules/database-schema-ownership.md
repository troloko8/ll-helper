---
trigger: always_on
description: Liquibase owns DB schema; Hibernate/JPA owns Java-to-DB mapping only
---

# Database Schema Ownership Rule

## Core rule

This project uses **Liquibase** as the single source of truth for the database schema.

- **Liquibase** owns DB schema.
- **Hibernate/JPA** owns Java-to-database mapping.
- Hibernate must **not** create, update, or evolve the database schema.

## Entity rules

JPA entities may contain **only mapping-related annotations**, for example:

- `@Entity`, `@Table(name = "...")`
- `@Id`, `@GeneratedValue`
- `@Column(name = "...", nullable = false, length = ...)`
- `@Enumerated(EnumType.STRING)`
- Relationship annotations such as `@ManyToOne`, `@OneToMany`, etc., with explicit `fetch`, `cascade`, and `orphanRemoval` decisions

**Do not use** entities as the source of database constraints or database optimization rules.

**Avoid defining these in entities:**

- `@Table(uniqueConstraints = ...)`
- `@Table(indexes = ...)`
- `@Check`, `@CheckConstraint`
- `@Index`, `@UniqueConstraint`
- `@ColumnDefault`

## Liquibase rules

**If a change affects real database structure, integrity, performance, or database-level behavior, it must be implemented in Liquibase, not only in JPA annotations.**

This includes: constraints, indexes, defaults, FK, CHECK, UNIQUE, views, triggers, functions, procedures, extensions, schemas.

## Required workflow

When adding, removing, or changing an entity field:

1. Update the Java entity mapping.
2. Add or update the matching Liquibase changeset.
3. Put real DB constraints, indexes, defaults, and checks in Liquibase.
4. Do not rely on Hibernate auto-DDL.

## Hibernate DDL mode

**Do not use:**

```yaml
spring.jpa.hibernate.ddl-auto: update
```

**Preferred:**

```yaml
spring.jpa.hibernate.ddl-auto: validate
```

**Acceptable in some environments:**

```yaml
spring.jpa.hibernate.ddl-auto: none
```

## Enum rule

Java enums must be stored as strings.

**Always use:**

```string(java)
@Enumerated(EnumType.STRING)
```

**Never use:**

```java()
@Enumerated(EnumType.ORDINAL)
```

Allowed enum values must be enforced in Liquibase through a database-level constraint when needed.

## Default values

- Java-side defaults are allowed for new entity objects.
- Database-side defaults must be defined in Liquibase when the database must guarantee them.
- **Do not use** `@ColumnDefault` in entities.

## Timestamp rule

Technical timestamps must use UTC-safe storage.

**PostgreSQL columns:**
- Use `timestamptz` (TIMESTAMP WITH TIME ZONE)
- **Never** use `timestamp` without time zone for technical timestamps

**Java type:**
- Use `java.time.Instant` for `created_at` and `updated_at`
- **Never** use `LocalDateTime` for persisted technical timestamps
- `LocalDateTime` is acceptable for user-facing datetime fields (e.g., `event_date`, `scheduled_at`)

**Entity mapping:**
```java
@Column(name = "created_at", nullable = false, insertable = false, updatable = false)
private Instant createdAt;

@Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
private Instant updatedAt;
```

**Database defaults and triggers:**
- DB defaults/triggers must be defined in Liquibase only
- Use `DEFAULT CURRENT_TIMESTAMP` for `timestamptz` columns
- Use `NEW.updated_at = CURRENT_TIMESTAMP` in updated_at triggers
- **Do not** use `CURRENT_TIMESTAMP AT TIME ZONE 'UTC'` with `timestamptz` (redundant)

**Do not:**
- Do not use `@PrePersist` / `@PreUpdate` for technical timestamps
- Do not manually set `createdAt` / `updatedAt` in service layer
- Database handles all timestamp logic

**Display:**
- Convert to user's local timezone only at API/UI level
- Backend always stores and processes timestamps in UTC

## Database Naming Conventions

Use explicit snake_case names for database constraints and indexes.

**Recommended patterns:**

- Primary key: `pk_<table>`
- Unique constraint: `uk_<table>_<column_or_columns>`
- Foreign key: `fk_<child_table>_<parent_table_or_relation>`
- Index: `idx_<table>_<column_or_columns>`
- Check constraint: `chk_<table>_<rule_or_column>`

**Examples:**

- `pk_users`
- `uk_users_username`
- `fk_user_card_progress_user`
- `fk_user_card_progress_card`
- `idx_user_card_progress_user_deck_status`
- `chk_user_card_progress_status`

**Prefer full table names over unclear abbreviations.**

**Legacy names from old migrations do not need to be renamed unless there is a real reason.** Use the new convention for new migrations.

**Legacy exceptions (V1–V8):**
- Primary keys: `users_pkey` instead of `pk_users` (PostgreSQL default)
- Foreign keys: `fk_udp_user`, `fk_ucp_card` instead of full names
- Indexes: `idx_ucp_user_deck` instead of full names
- Do not rename for style only — migration immutability applies
- Future migrations (V9+) should use standard patterns above

## Liquibase migration conventions

### Migration immutability

**Do not edit already applied or shared changesets**, including V1–V6.

If a schema mistake is found after a changeset was applied, create a new corrective migration instead of modifying history.

**Only local, unshared, unapplied changesets may be edited.**

### Foreign key style

**For all future migrations (V7+), foreign keys must be created with separate `addForeignKeyConstraint` changes.**

**Do not create new foreign keys inline inside `column.constraints`.**

V1–V6 may contain legacy mixed FK style and must not be rewritten only for style cleanup.

❌ **Avoid (inline FK):**
```yaml
- column:
    name: deck_id
    type: BIGINT
    constraints:
      nullable: false
      foreignKeyName: fk_cards_deck
      referencedTableName: decks
      referencedColumnNames: id
```

✅ **Prefer (explicit FK):**
```yaml
- column:
    name: deck_id
    type: BIGINT
    constraints:
      nullable: false

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

### Default FK behavior

Unless explicitly documented, use:
```yaml
onDelete: RESTRICT
onUpdate: RESTRICT
```

Use `CASCADE` only when the child row has no independent business value and the parent-child lifecycle is strictly owned.

**Do not use `CASCADE` for users, learning progress, payments, bids, audit/history, or other business records unless an explicit deletion policy is documented.**

Examples where `CASCADE` may be acceptable:
- purely technical child rows
- temporary child records
- owned value-like rows with no independent history

For user-facing business entities, prefer `RESTRICT` or soft delete until the deletion policy is clear.

### FK index rule

PostgreSQL does not automatically create indexes for child-side foreign key columns.

When adding a foreign key, also decide whether an index is needed for:
- joins
- ownership checks
- filtering
- delete/update checks
- frequent lookup queries

For frequently queried FK columns, create an explicit `createIndex` changeset.

**Examples:**
- `decks.owner_id`
- `cards.deck_id`
- `user_deck_progress.user_id`
- `user_deck_progress.deck_id`
- `user_card_progress.user_id`
- `user_card_progress.card_id`
- `user_card_progress.user_deck_progress_id`

### Current V1–V6 status

V1 uses mixed style (3 inline FK, 3 explicit FK). V4–V6 use explicit FK style. **Future migrations (V7+) must use explicit FK only.**

### Safety rule

For destructive changes such as `dropColumn`, `dropTable`, `dropIndex`, or changing column types, add a comment explaining why it is safe.

Use preconditions when a migration may run against databases with uncertain state.

## Final instruction

Before accepting entity or database changes, verify that:

- [ ] Entity annotations describe **mapping only**
- [ ] Real database rules are defined in **Liquibase**
- [ ] Hibernate is **not** used to evolve the schema

## References

- **Detailed guide:** `docs/database/schema-ownership.md`
- **Entity conventions:** `.windsurf/rules/entity-conventions.md`
- **DB relationships:** `docs/database/relationships.md`
- **Liquibase migrations:** `backend/src/main/resources/db/changelog/`
- **Hibernate DDL mode:** `backend/src/main/resources/application.yaml`
