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
