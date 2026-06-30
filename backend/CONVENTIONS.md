# Backend Conventions — LLHelper

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
- Do **not** auto-generate `equals`/`hashCode`/`toString` (risks with lazy collections and infinite recursion)

## DTO
- Always use Java `record`
- Do **not** use Lombok on `record` — records already generate getters, `equals`, `hashCode`, `toString`
- Split into `dto/request/` and `dto/response/`

## Mapper
- **Library:** MapStruct 1.6.3
- **Pattern:** Interface-based mappers with `@Mapper(componentModel = "spring")`
- Each module has a `mapper/` package with dedicated mapper interface
- Example: `CardMapper` — converts `Card` ↔ `CardResponse`/`CardRequest`
- **Detailed conventions:** See `.windsurf/rules/mapstruct-conventions.md`

## Naming
- Packages: `snake_case` for compound words (e.g. `card_desc`)
- Classes: `PascalCase` (e.g. `CardDesc`, `CardDescResponse`)
- REST endpoints: `kebab-case` (e.g. `/api/v1/card-descs`)

## Database
- **DBMS:** PostgreSQL
- **ddl-auto:** `update`
- **Flyway:** disabled for now

## Rate Limiting

All mutating endpoints (POST/PUT/DELETE) MUST have rate limiting via `UserRateLimiter`.

**Pattern (Level 0 — authenticated endpoints):**
```java
@Transactional
public Response mutatingOperation(...) {
    // Rate limit FIRST — zero DB queries, from JWT token
    userRateLimiter.checkLimitByEmail(securityUtils.getCurrentUserEmail(), RateLimitAction.ACTION);

    // Then ownership check and business logic
}
```

**Pattern (pre-auth endpoints — login/register):**
```java
public AuthResponse login(LoginRequest request) {
    userRateLimiter.checkLimitByEmail(request.email(), RateLimitAction.AUTH_LOGIN);

    // Business logic
}
```

**Guidelines:**
- Rate limit is ALWAYS the first call — before any DB query, before ownership check
- Limits and windows are defined in `RateLimitAction` enum — never hardcode in service layer
- Use `getCurrentUserEmail()` (0 DB queries) for authenticated endpoints; use `request.email()` for auth endpoints
- TODO (Level 2): Replace `checkLimitByEmail()` with `checkLimitByUserId()` after JWT subject migrates from email to userId — see `IMPROVEMENTS.md`
- TODO (Level 2): Replace `checkLimitByEmail(request.email(), AUTH_REGISTER)` with IP-based limiting — see `IMPROVEMENTS.md`

**See:** `docs/features/rate-limiting-design.md` for full implementation plan
