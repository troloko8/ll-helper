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
- Not yet implemented — entity → DTO conversion is done via private `toResponse()` inside the service
- Dedicated mapper layer is planned for **Sprint 0.2** (Level 0 Architecture Debt)

## Naming
- Packages: `snake_case` for compound words (e.g. `card_desc`)
- Classes: `PascalCase` (e.g. `CardDesc`, `CardDescResponse`)
- REST endpoints: `kebab-case` (e.g. `/api/v1/card-descs`)

## Database
- **DBMS:** PostgreSQL
- **ddl-auto:** `update`
- **Flyway:** disabled for now

## Core Project Documents

- Roadmap: `docs/roadmap/LL_Helper Project Roadmap.md`
- Current architecture: `docs/architecture/current-architecture.md`

Before suggesting backend architecture changes, first check the current architecture document.
