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

**Pattern:**
```java
@Transactional
public Response mutatingOperation(...) {
    Long currentUserId = securityUtils.getCurrentUserId();
    
    // Rate limit BEFORE business logic
    userRateLimiter.checkLimitByUserId(currentUserId, maxRequests, window);
    
    // Ownership check
    // Business logic
}
```

**Guidelines:**
- Place rate limit check AFTER getting userId, BEFORE ownership check
- Use reasonable limits (5-20/min for normal ops, 3-5/hour for expensive ops)
- Email-based for pre-auth endpoints (login/register)
- TODO (Level 2): Migrate to userId-based when JWT subject changes from email to userId

**See:** `docs/features/rate-limiting-design.md` for full implementation plan
