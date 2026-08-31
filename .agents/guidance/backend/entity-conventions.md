# Entity Conventions — Backend

Apply these conventions whenever creating, modifying, or reviewing a JPA entity.

## Package structure

Place an entity in `com.llhelper.<module_name>.entity.<EntityName>`, for example `com.llhelper.user.entity.User`.

## Required Lombok and JPA annotations

Use this class shape:

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

Never use `@Data`, `@AllArgsConstructor`, `@EqualsAndHashCode`, or `@ToString` on entities. They can break proxy initialization, recurse through relationships, or trigger lazy loading.

## Standard fields

Every entity must have:

```java
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(name = "created_at", nullable = false, insertable = false, updatable = false)
private Instant createdAt;

@Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
private Instant updatedAt;
```

- Use `Instant`, never `LocalDateTime`, for technical timestamps.
- PostgreSQL manages technical timestamps through Liquibase-defined defaults and update triggers; do not use `@PrePersist`/`@PreUpdate` or set them in services.
- Business timestamps such as `lastReviewedAt` and `nextReviewAt` are application-managed: set them explicitly in the service when the business event occurs, do not mark them non-insertable/non-updatable, and do not give them database defaults or triggers.
- `nullable = false` describes mapping; real constraints/defaults belong in Liquibase.

For timestamp conversion or ownership decisions, use `.agents/skills/database/SKILL.md` and open only the relevant reference.

## Relationships

Before adding a JPA relationship:

1. Find and read the relevant relationship entry and policy section in `docs/database/relationships.md`; do not load the full document unless the decision crosses sections.
2. Decide between a JPA relationship and an ID-only logical reference.
3. If using a JPA relationship, decide cascade and orphan-removal behavior explicitly.
4. Update `docs/database/relationships.md`.

Prefer an ID-only logical reference for cross-module dependencies, when cascade is unnecessary, or to avoid circular dependencies:

```java
private Long userId;
private Long cardId;
```

## Mapper integration

After creating an entity, add a corresponding `<Module>Mapper` in `<module>/mapper/` and follow `.agents/guidance/backend/mapstruct-conventions.md`.

## Validation and schema ownership

Use JPA annotations for mapping clarity:

```java
@Column(nullable = false)
private String title;

@Enumerated(EnumType.STRING)
@Column(nullable = false)
private Status status;
```

Do not put DTO validation (`@NotNull`, `@NotBlank`) on entities. Do not use `@Column(unique = true)`, `@Table(uniqueConstraints/indexes)`, `@Index`, `@CheckConstraint`, or `@ColumnDefault`; real schema constraints belong in Liquibase.

For cross-cutting database decisions, use `.agents/skills/database/SKILL.md`. For mapper work, load `.agents/guidance/backend/mapstruct-conventions.md` only when needed.
