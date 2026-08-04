---
trigger: glob
description: JPA Entity conventions for LLHelper project — applies when creating or modifying JPA entities
globs: backend/src/main/java/**/entity/*.java
---

# Entity Conventions Rule

When creating or modifying JPA entities, always follow these conventions.

## Package Structure

Place entity in: `com.llhelper.<module_name>.entity.<EntityName>`

Example:
- `com.llhelper.user.entity.User`
- `com.llhelper.card.entity.Card`
- `com.llhelper.deck.entity.Deck`

## Required Lombok Annotations

Always use on entity class:

```java
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "table_name")
public class EntityName {
    // fields
}
```

**NEVER use:**
- `@Data` — causes issues with lazy collections
- `@AllArgsConstructor` — breaks JPA proxy initialization
- `@EqualsAndHashCode` — risks infinite recursion with relationships
- `@ToString` — risks lazy loading exceptions

## Standard Fields

Every entity MUST have:

```java
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(name = "created_at", nullable = false, insertable = false, updatable = false)
private Instant createdAt;

@Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
private Instant updatedAt;
```

**Timestamp handling:**
- Use `java.time.Instant` (never `LocalDateTime`) for technical timestamps; mark `insertable = false, updatable = false` — PostgreSQL manages them via DEFAULT and triggers
- **Do not** use `@PrePersist`/`@PreUpdate` or manually set `createdAt`/`updatedAt` in the service layer
- Business timestamps (`last_reviewed_at`, `next_review_at`) are the opposite: application-managed, no `insertable/updatable = false`, no DB default/trigger
- `nullable = false` here is for mapping clarity only — real `NOT NULL`/defaults/triggers live in Liquibase

Full TIMESTAMP → TIMESTAMPTZ migration procedure: `.windsurf/skills/database/references/timestamp-migrations.md`.

## Relationships

**Before adding JPA relationships (`@OneToMany`, `@ManyToOne`, etc.):**

1. Check `docs/database/relationships.md` for current relationship model
2. Decide: JPA relationship or ID-only logical reference?
3. If JPA relationship — decide cascade/orphanRemoval strategy
4. Update `docs/database/relationships.md` after adding relationship

**ID-only logical references:**

Prefer logical references when:
- Cross-module dependency (e.g., `learning` → `card`)
- No cascade needed
- Avoid circular dependencies

Example:
```java
// Instead of @ManyToOne
private Long userId;  // logical reference to User.id
private Long cardId;  // logical reference to Card.id
```

## Mapper Integration

After creating an entity, add a corresponding `<Module>Mapper` in `<module>/mapper/` — see `mapstruct-conventions.md` (same directory).

## Validation

Use JPA/Bean Validation annotations for mapping clarity:

```java
@Column(nullable = false)
private String title;

@Enumerated(EnumType.STRING)
@Column(nullable = false)
private Status status;
```

**Do NOT use:** `@NotNull`/`@NotBlank` (belongs on DTO), `@Column(unique = true)`, `@Table(uniqueConstraints/indexes)`, `@Index`, `@CheckConstraint`, `@ColumnDefault` — all DB schema constraints belong in Liquibase, not entities.

See `backend/AGENTS.md` (Hard gates) and `liquibase-conventions.md` (same directory) for the full source-of-truth policy.

## References

- **Database reference selection:** `.windsurf/skills/database/SKILL.md` — routes to the specific reference (Liquibase, FK/index, timestamp, relationships snapshot) needed for the task at hand; do not fan out to all of them by default.
- **Mapper conventions:** `mapstruct-conventions.md` (same directory) — only when creating or changing a mapper.
