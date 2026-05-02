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
- Deferred as an **advanced feature** — do not create mapper classes yet
- Entity → DTO conversion: private `toResponse()` method inside the service

## Naming
- Packages: `snake_case` for compound words (e.g. `card_desc`)
- Classes: `PascalCase` (e.g. `CardDesc`, `CardDescResponse`)
- REST endpoints: `kebab-case` (e.g. `/api/v1/card-descs`)

## Database
- **DBMS:** PostgreSQL
- **ddl-auto:** `update`
- **Flyway:** disabled for now
