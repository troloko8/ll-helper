---
trigger: always_on
description: JPA Entity conventions for LLHelper project
globs: 
---

# Entity Conventions Rule

When creating or modifying JPA entities, always follow these conventions.

## Package Structure

Place entity in: `com.llhelper.<module_name>.entity.<EntityName>`

Example:
- `com.llhelper.user.entity.User`
- `com.llhelper.card.entity.Card`
- `com.llhelper.card_desc.entity.CardDesc`

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

@Column(nullable = false, updatable = false)
private LocalDateTime createdAt;

@Column(nullable = false)
private LocalDateTime updatedAt;
```

**Timestamp initialization:**
- Currently: `@PrePersist` / `@PreUpdate` methods in entity
- Future (Sprint 0.3): PostgreSQL `DEFAULT CURRENT_TIMESTAMP`

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

After creating entity, create corresponding mapper:

1. Create `<Module>Mapper` interface in `<module>/mapper/`
2. Add `@Mapper(componentModel = "spring")`
3. Implement `toResponse()`, `toEntity()`, `updateEntity()` methods
4. See `.windsurf/rules/mapstruct-conventions.md` for details

## Validation

Use JPA/Bean Validation annotations:

```java
@Column(nullable = false)
private String title;

@Column(unique = true, nullable = false)
private String email;

@Enumerated(EnumType.STRING)
@Column(nullable = false)
private Status status;
```

**Do NOT use:**
- `@NotNull` / `@NotBlank` on entity (use on DTO request)
- Entity validation belongs in service layer or DTO

## References

- **Lombok conventions:** `backend/CONVENTIONS.md` (section "JPA Entity")
- **Mapper conventions:** `.windsurf/rules/mapstruct-conventions.md`
- **DB relationships:** `docs/database/relationships.md`
- **Package structure:** `docs/architecture/current-architecture.md` (section 6)
