# Cascade Agent Instructions — LLHelper Backend

This file is auto-read by Cascade on every session in this project.
Apply these conventions for ALL backend code in this repository.

## Architecture
- **Style:** Modular monolith on Spring Boot
- **Organization:** `package-by-feature`
- Each module (`card`, `card_desc`, `auth`, etc.) contains:
  - `controller/`
  - `service/`
  - `repository/`
  - `dto/request/` and `dto/response/`
  - `entity/`
- Cross-cutting concerns go in `common/` (`security`, `exception`, `logging`, `util`, `config`)

## JPA Entity
- Always use `@Getter` + `@Setter` + `@NoArgsConstructor` from Lombok
- **Never** use `@Data` on entity classes
- Do **not** auto-generate `equals`/`hashCode`/`toString`

## DTO
- Always use Java `record`
- Do **not** use Lombok on `record` — records already generate everything
- Split into `dto/request/` and `dto/response/`

## Mapper
- **Library:** MapStruct 1.6.3
- **Pattern:** Interface-based mappers with `@Mapper(componentModel = "spring")`
- Each module has a `mapper/` package with dedicated mapper interface
- Example: `CardMapper` — converts `Card` ↔ `CardResponse`/`CardRequest`
- MapStruct processor runs **after** Lombok in annotation processing chain
- Generated implementations are auto-injected as Spring beans
- **IMPORTANT:** Always use mapper for DTO ↔ Entity conversion. Never write manual mapping in services.
- **Detailed conventions:** See `.windsurf/rules/mapstruct-conventions.md`

## Naming
- Packages: `snake_case` for compound words (e.g. `card_desc`)
- Classes: `PascalCase` (e.g. `CardDesc`, `CardDescResponse`)
- REST endpoints: `kebab-case` (e.g. `/api/v1/card-descs`)

## Database
- **DBMS:** PostgreSQL
- **ddl-auto:** `update`
- **Flyway:** disabled for now

## Core Project Documents

- Roadmap: `docs/roadmap/LL_Helper_Project_Roadmap.md`
- Current architecture: `docs/architecture/current-architecture.md`
- Database relationships: `docs/database/relationships.md`
- Learning flow: `docs/features/learning-flow.md`
- AI generation flow: `docs/features/ai-generation-flow.md`

Before suggesting backend architecture, entity relationships, database constraints, cascade/delete behavior, indexes, learning progress changes, or migrations, check the database relationships document.

Before suggesting backend architecture changes, first check the current architecture document.

## Ownership Rule

Only the deck owner can create, update, delete, or AI-generate cards inside a deck.

When implementing card creation or generation, always verify:

```text
if (!Objects.equals(cardDesc.getOwner().getId(), currentUserId)) {
    throw new AccessDeniedException("Access denied: not deck owner");
}
```

This applies to:
- `POST /api/v1/cards`
- `POST /api/v1/cards/bulk-generate`
- Any future endpoint that mutates deck content

## Database Rule

Do not assume that JPA relationships and real PostgreSQL constraints are the same.

When discussing DB behavior, distinguish:

- JPA cascade / orphanRemoval
- DB foreign keys / ON DELETE behavior
- service-level ownership checks
- logical ID references without FK constraints

If entity relationships change, update `docs/database/relationships.md`.

If learning flow logic changes, update `docs/features/learning-flow.md`.

If AI generation logic changes, update `docs/features/ai-generation-flow.md`.
