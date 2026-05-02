---
name: create-entity-module
description: Creates a JPA entity following LLHelper project conventions
---

Create a JPA entity for the LLHelper backend project (ll-helper repo) following these strict rules:

1. Place in: com.llhelper.<module_name>.entity.<EntityName>
2. Annotations on class:
    - @Getter
    - @Setter
    - @NoArgsConstructor
    - @Entity
    - @Table(name = "<table_name>")
3. Always include fields: id (Long, @Id @GeneratedValue IDENTITY), createdAt (LocalDateTime, not null, not updatable), updatedAt (LocalDateTime, not null)
4. NEVER use @Data
5. NEVER add manual getters/setters — Lombok handles it
6. NEVER use Lombok on DTO records
7. If entity has relations — ask user for direction (OneToMany / ManyToOne) before adding

Ask the user for: entity name, module name, and any additional fields before generating.