# Database Schema Ownership — Detailed Guide

> **Quick reference:** See `.windsurf/rules/database-schema-ownership.md` for the short version.

## Core Principle

This project uses **Liquibase** as the single source of truth for the database schema.

- **Liquibase** owns the DB schema (structure, constraints, indexes, defaults).
- **Hibernate/JPA** owns the Java-to-database mapping (how Java objects map to tables).
- Hibernate must **not** be used to create, update, or evolve the database schema.

## Why This Matters

**Problem:** Two sources of truth create conflicts and bugs.

If constraints are defined in both entity annotations and Liquibase:
- Which one is correct?
- What happens when they differ?
- How do you know if the database matches the code?

**Solution:** Single source of truth.

- Liquibase migrations define the **real** database schema.
- Hibernate `ddl-auto: validate` verifies that entity mappings match the database.
- If they don't match, Hibernate fails on startup → immediate feedback.

## Allowed in Entities

Entity classes may contain **mapping annotations** that help Hibernate understand how Java fields map to database tables and columns.

### Allowed annotations

- `@Entity`
- `@Table(name = "table_name")`
- `@Id`
- `@GeneratedValue(strategy = GenerationType.IDENTITY)`
- `@Column(name = "column_name", nullable = false, length = 255)`
- `@Enumerated(EnumType.STRING)`
- Relationship annotations:
  - `@OneToOne`, `@OneToMany`, `@ManyToOne`, `@ManyToMany`
  - With explicit `fetch`, `cascade`, `orphanRemoval` decisions

### Example: correct entity

```java
@Entity
@Table(name = "user_card_progress")
public class UserCardProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "card_id", nullable = false)
    private Long cardId;

    @Column(name = "user_deck_progress_id", nullable = false)
    private Long userDeckProgressId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CardLearningStatus status = CardLearningStatus.NEW;

    @Column(name = "times_seen", nullable = false)
    private Integer timesSeen = 0;

    @Column(name = "times_correct", nullable = false)
    private Integer timesCorrect = 0;

    private LocalDateTime nextReviewAt;
}
```

**What this entity says:**
- "Map Java class `UserCardProgress` to DB table `user_card_progress`"
- "Map field `userId` to column `user_id`, expect it to be NOT NULL"
- "Map enum `status` as STRING, expect it to be NOT NULL with max length 20"
- "Map field `timesSeen` to column `times_seen`, expect NOT NULL, default to 0 in Java"

**What this entity does NOT say:**
- No unique constraints
- No indexes
- No check constraints
- No foreign keys
- No database-level defaults

## Forbidden in Entities

Do not define database schema constraints or database optimization rules in JPA entities.

### Forbidden annotations

- `@Table(uniqueConstraints = @UniqueConstraint(...))`
- `@Table(indexes = @Index(...))`
- `@Check`
- `@CheckConstraint`
- `@Index`
- `@UniqueConstraint`
- `@ColumnDefault` (Hibernate-specific)

### Example: incorrect entity

```java
// ❌ BAD: defines DB constraints in entity
@Entity
@Table(
    name = "user_card_progress",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_user_card_progress_deck_card",
        columnNames = {"user_deck_progress_id", "card_id"}
    ),
    indexes = {
        @Index(name = "idx_ucp_user_deck", columnList = "user_deck_progress_id, status")
    },
    check = @CheckConstraint(constraint = "status IN ('NEW', 'LEARNING', 'REVIEWING', 'MASTERED')")
)
public class UserCardProgress {
    // ...
}
```

**Why this is bad:**
- Creates two sources of truth (entity + Liquibase)
- If Liquibase migration changes constraint name, entity becomes outdated
- If constraint is removed from Liquibase but not from entity, confusion
- Hibernate `ddl-auto: validate` does not verify constraints, only column types

## Liquibase Responsibility

Every database schema change must be represented as a Liquibase changeset.

### What belongs in Liquibase

- Creating tables
- Adding/removing/renaming columns
- Changing column types
- `NOT NULL` constraints
- `UNIQUE` constraints
- `CHECK` constraints
- `FOREIGN KEY` constraints
- Indexes
- Default values
- Enum validation constraints
- Triggers
- Views, materialized views
- SQL functions, stored procedures
- PostgreSQL extensions
- Schemas
- Generated columns

### Example: enum check constraint

**Entity:**

```java
@Enumerated(EnumType.STRING)
@Column(name = "status", nullable = false)
private CardLearningStatus status = CardLearningStatus.NEW;
```

**Liquibase:**

```yaml
- addCheckConstraint:
    tableName: user_card_progress
    constraintName: chk_user_card_progress_status
    checkConstraint: "status IN ('NEW', 'LEARNING', 'REVIEWING', 'MASTERED')"
```

**Why both?**
- Entity: tells Hibernate to map enum as STRING
- Liquibase: enforces allowed values at database level

### Example: unique constraint

**Entity:**

```java
@Column(name = "user_deck_progress_id", nullable = false)
private Long userDeckProgressId;

@Column(name = "card_id", nullable = false)
private Long cardId;
```

**Liquibase:**

```yaml
- addUniqueConstraint:
    tableName: user_card_progress
    columnNames: user_deck_progress_id, card_id
    constraintName: uk_user_card_progress_deck_card
```

**Why not in entity?**
- Unique constraint is a database integrity rule, not a mapping rule
- Liquibase owns the constraint name, existence, and enforcement

### Example: index

**Entity:**

```java
@Column(name = "user_deck_progress_id", nullable = false)
private Long userDeckProgressId;

@Enumerated(EnumType.STRING)
@Column(name = "status", nullable = false)
private CardLearningStatus status;
```

**Liquibase:**

```yaml
- createIndex:
    tableName: user_card_progress
    indexName: idx_ucp_user_deck_status
    columns:
      - column:
          name: user_deck_progress_id
      - column:
          name: status
```

**Why not in entity?**
- Index is a performance optimization, not a mapping rule
- Liquibase owns index name, column order, and existence

### Example: foreign key

**Entity:**

```java
@Column(name = "card_id", nullable = false)
private Long cardId;  // logical reference, no JPA relationship
```

**Liquibase:**

```yaml
- addForeignKeyConstraint:
    baseTableName: user_card_progress
    baseColumnNames: card_id
    constraintName: fk_ucp_card
    referencedTableName: cards
    referencedColumnNames: id
    onDelete: RESTRICT
    onUpdate: RESTRICT
```

**Why not in entity?**
- This is an ID-only logical reference (no `@ManyToOne`)
- Foreign key is a database integrity rule, not a mapping rule
- Liquibase owns FK name, delete behavior, and enforcement

## Entity and Liquibase Synchronization

### When adding a new field

1. **Add the Java field to the entity:**

```java
@Column(name = "difficulty_level", nullable = true)
private Integer difficultyLevel;
```

2. **Add the correct `@Column(name = "...")` mapping.**

3. **Create a Liquibase changeset for the real database column:**

```yaml
- changeSet:
    id: V4-1
    author: llhelper
    comment: Add difficulty_level to user_card_progress
    changes:
      - addColumn:
          tableName: user_card_progress
          columns:
            - column:
                name: difficulty_level
                type: INTEGER
                constraints:
                  nullable: true
```

4. **Add DB-level constraints/defaults/indexes in Liquibase if needed.**

For example, if difficulty must be between 1 and 5:

```yaml
- addCheckConstraint:
    tableName: user_card_progress
    constraintName: chk_user_card_progress_difficulty
    checkConstraint: "difficulty_level >= 1 AND difficulty_level <= 5"
```

5. **Do not rely on Hibernate auto-DDL.**

### When removing a field

1. **Remove the Java field from the entity.**

2. **Create a Liquibase changeset that safely drops the column:**

```yaml
- changeSet:
    id: V5-1
    author: llhelper
    comment: Drop difficulty_level from user_card_progress
    changes:
      - dropColumn:
          tableName: user_card_progress
          columnName: difficulty_level
```

3. **Consider backward compatibility and existing data.**

If the column contains important data, migrate it before dropping.

4. **Do not silently rely on Hibernate to modify the schema.**

### When renaming a field

1. **Rename the Java field in the entity.**

2. **Update the `@Column(name = "...")` mapping if the database column name changes.**

3. **Create a Liquibase changeset that renames the column:**

```yaml
- changeSet:
    id: V6-1
    author: llhelper
    comment: Rename difficulty_level to difficulty_rating
    changes:
      - renameColumn:
          tableName: user_card_progress
          oldColumnName: difficulty_level
          newColumnName: difficulty_rating
          columnDataType: INTEGER
```

4. **If only the Java field name changes but the database column name stays the same, no Liquibase migration is needed.**

## Hibernate DDL Mode

Do not use Hibernate auto schema update for this project.

### Avoid: `ddl-auto: update`

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update
```

**Why avoid:**
- Hibernate may create incorrect constraints
- Hibernate may drop data
- Hibernate does not support all database features (e.g., check constraints, triggers)
- Hibernate does not track migration history
- Hibernate does not support rollback

### Preferred: `ddl-auto: validate`

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
```

**Why preferred:**
- Hibernate verifies that entity mappings match the database schema
- If they don't match, Hibernate fails on startup → immediate feedback
- No risk of accidental schema changes
- Forces you to use Liquibase for all schema changes

### Acceptable: `ddl-auto: none`

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: none
```

**Why acceptable:**
- Hibernate does not touch the schema at all
- Useful in production environments where schema changes are strictly controlled

## Nullable and Default Values

### `@Column(nullable = false)` in entities

`@Column(nullable = false)` may be used in entities for **mapping clarity** and Hibernate validation.

However, the real `NOT NULL` constraint must exist in Liquibase.

**Correct:**

Entity:

```java
@Column(name = "times_seen", nullable = false)
private Integer timesSeen = 0;
```

Liquibase:

```yaml
- column:
    name: times_seen
    type: INTEGER
    constraints:
      nullable: false
```

**Why both?**
- Entity: tells Hibernate to expect NOT NULL, provides Java-side default
- Liquibase: enforces NOT NULL at database level

### Default values

**Java-side defaults** are allowed for new entity objects:

```java
@Column(name = "times_seen", nullable = false)
private Integer timesSeen = 0;  // Java default
```

**Database-side defaults** must be defined in Liquibase when the database must guarantee them:

```yaml
- column:
    name: times_seen
    type: INTEGER
    defaultValue: 0
    constraints:
      nullable: false
```

**Why both?**
- Java default: used when creating new entity instances in Java
- Database default: used when inserting rows directly via SQL or other tools

### `@ColumnDefault` is forbidden

Do not use `@ColumnDefault` (Hibernate-specific annotation):

```java
// ❌ BAD
@Column(nullable = false)
@ColumnDefault("0")
private Integer timesSeen;
```

**Why forbidden:**
- Creates two sources of truth (entity + Liquibase)
- Hibernate-specific, not portable
- Confusing: does it apply to Java or database?

**Correct:**

```java
// ✅ GOOD
@Column(nullable = false)
private Integer timesSeen = 0;  // Java default
```

And in Liquibase:

```yaml
defaultValue: 0  # Database default
```

## Enum Mapping Rule

Java enums must be stored as strings, not ordinals.

### Always use `EnumType.STRING`

```java
@Enumerated(EnumType.STRING)
@Column(name = "status", nullable = false)
private CardLearningStatus status;
```

### Never use `EnumType.ORDINAL`

```java
// ❌ BAD
@Enumerated(EnumType.ORDINAL)
@Column(name = "status", nullable = false)
private CardLearningStatus status;
```

**Why STRING is required:**
- Ordinals break when enum order changes
- Ordinals are not human-readable in database
- Ordinals make debugging harder

### Enforce allowed enum values in Liquibase

```yaml
- addCheckConstraint:
    tableName: user_card_progress
    constraintName: chk_user_card_progress_status
    checkConstraint: "status IN ('NEW', 'LEARNING', 'REVIEWING', 'MASTERED')"
```

**Why enforce in database:**
- Prevents invalid values from being inserted via SQL or other tools
- Provides database-level integrity
- Makes allowed values explicit in schema

### When adding a new enum value

1. **Update the Java enum:**

```java
public enum CardLearningStatus {
    NEW,
    LEARNING,
    REVIEWING,
    MASTERED,
    SUSPENDED  // new value
}
```

2. **Update the Liquibase check constraint:**

```yaml
- changeSet:
    id: V7-1
    author: llhelper
    comment: Add SUSPENDED to CardLearningStatus
    changes:
      - dropCheckConstraint:
          tableName: user_card_progress
          constraintName: chk_user_card_progress_status
      - addCheckConstraint:
          tableName: user_card_progress
          constraintName: chk_user_card_progress_status
          checkConstraint: "status IN ('NEW', 'LEARNING', 'REVIEWING', 'MASTERED', 'SUSPENDED')"
```

3. **Add a new Liquibase changeset.**

4. **Do not edit already-applied shared changesets** unless the project explicitly allows it during early local-only development.

## Review Checklist

Before accepting any entity or database-related change, check:

- [ ] Did this change add a new entity field?
- [ ] Did it add a matching Liquibase changeset?
- [ ] Did it add a new DB constraint only in Java annotations?
- [ ] Did it add `@Index`, `@UniqueConstraint`, or `@CheckConstraint` inside an entity?
- [ ] Did it rely on Hibernate `ddl-auto=update`?
- [ ] Are column names explicit through `@Column(name = "...")`?
- [ ] Are enum fields mapped using `EnumType.STRING`?
- [ ] Are real constraints, indexes, defaults, and checks defined in Liquibase?
- [ ] Does Hibernate run with `ddl-auto=validate` or `none`?

If a schema-related rule is defined only in the entity and not in Liquibase, treat it as incomplete.

## Troubleshooting

### Hibernate validation fails on startup

**Error:**

```
Schema-validation: missing column [column_name] in table [table_name]
```

**Cause:**
- Entity expects a column that does not exist in the database.

**Solution:**
1. Check if Liquibase migration was applied: `SELECT * FROM databasechangelog ORDER BY dateexecuted DESC;`
2. If migration was not applied, run Liquibase: `./mvnw liquibase:update`
3. If migration was applied but column is still missing, check migration SQL
4. If column name in entity does not match database, update `@Column(name = "...")`

### Constraint name mismatch

**Error:**

```
Constraint [constraint_name] does not exist
```

**Cause:**
- Entity references a constraint that does not exist in the database.

**Solution:**
- Remove constraint reference from entity (constraints should not be in entities)
- Define constraint in Liquibase

### Enum value rejected by database

**Error:**

```
ERROR: new row for relation "user_card_progress" violates check constraint "chk_user_card_progress_status"
```

**Cause:**
- Trying to insert an enum value that is not allowed by the check constraint.

**Solution:**
1. Check Java enum definition
2. Check Liquibase check constraint
3. If new enum value was added to Java but not to Liquibase, create migration to update check constraint

## Final Rule

Do not let Hibernate generate or evolve the production database schema.

- Use Hibernate/JPA for **object-relational mapping**.
- Use Liquibase for **all database schema structure, constraints, indexes, defaults, and database-level behavior**.

## References

- **Quick reference:** `.windsurf/rules/database-schema-ownership.md`
- **Entity conventions:** `.windsurf/rules/entity-conventions.md`
- **DB relationships:** `docs/database/relationships.md`
- **Liquibase migrations:** `backend/src/main/resources/db/changelog/`
- **Hibernate DDL mode:** `backend/src/main/resources/application.yaml`
- **Liquibase documentation:** https://docs.liquibase.com/
