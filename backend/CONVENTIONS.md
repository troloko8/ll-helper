# Backend Conventions — LLHelper

## Architecture
- **Style:** Modular monolith on Spring Boot
- **Organization:** `package-by-feature`
- Each module (`card`, `deck`, `auth`, etc.) contains:
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
- **Library:** MapStruct 1.6.3 — interface-based mappers with `@Mapper(componentModel = "spring")`, one per module in `mapper/` package
- **Conventions:** `backend/.windsurf/rules/mapstruct-conventions.md` (hard gates) + `docs/backend/mapstruct-edge-cases.md` (multi-source, `@Context`, circular deps)

## Naming
- Packages: `snake_case` for compound words (e.g. `deck`)
- Classes: `PascalCase` (e.g. `Deck`, `DeckResponse`)
- REST endpoints: `kebab-case` (e.g. `/api/v1/decks`)

## Method Layout and Logical Blocks

Use a single empty line to separate method statements that belong to different
semantic phases. Keep statements together when each one directly supplies the
identity or value required by the next statement.

Typical phases include:
- input normalization and guard clauses;
- current-user or ownership identity resolution;
- loading one related aggregate through identifiers resolved immediately above;
- authorization or business-rule checks;
- mapping, persistence, and response construction.

For example, loading a card, taking its `deckId`, loading that deck, and resolving
its owner form one dependent lookup block. A subsequent validation branch,
unrelated repository operation, mutation, or response mapping starts a new block.

Do not add blank lines mechanically between every variable, `if`, or method call.
Group by data dependency and purpose so a reader can understand each block as one
step. Use at most one empty line between adjacent blocks, and never leave spaces
or tabs on an otherwise empty line. Do not split fluent calls, argument lists, or
one expression merely to create visual spacing.

## Collection Pagination

Do not add pagination mechanically to every `List`. For each new or materially
changed collection-read endpoint, explicitly choose the smallest contract that
supports its expected size and product flow:

| Use case | Repository/result contract | Stable API response |
|---|---|---|
| Small, domain-bounded or explicitly accepted bounded collection | `List<T>` | JSON array |
| UI needs totals or page navigation | `Page<T>` plus count query | `items`, `page`, `size`, `totalElements`, `totalPages`, `hasNext` |
| UI needs only load-more | `Slice<T>` or an equivalent `size + 1` query | `items`, `page`, `size`, `hasNext` |
| Large or frequently changing collection where deep offsets matter | Cursor/keyset query | `items`, `nextCursor`, `hasNext` |

**Rules:**
- These rules apply to collection reads. A bounded batch mutation may return a
  list of operation results without becoming a pageable collection endpoint.
- A potentially unbounded collection may remain unpaginated only when its
  current scope explicitly accepts that limitation; keep the limitation in the
  owning contract or backlog instead of hiding it in implementation.
- Page numbers are zero-based. Each endpoint documents its default `size` and
  enforces a positive, bounded maximum.
- Every paginated query has a deterministic order with a unique final
  tie-breaker, normally `id`.
- Filters and visibility rules apply identically to the data query and, when a
  `Page` is used, its count query. An out-of-range page returns `200` with empty
  `items`.
- Use `Page` only when the client needs totals; otherwise prefer `Slice` to avoid
  an unnecessary count query. Use cursor/keyset pagination only when scale or
  result churn justifies its additional contract and index complexity.
- Never expose Spring Data `Page`, `PageImpl`, `Slice`, or persistence
  projections as the wire contract. Map them to a feature-owned response
  `record` so JSON remains stable and domain-specific.
- Do not introduce a shared generic page wrapper for a single endpoint. Extract
  one only after multiple domains need the same semantics; item DTOs remain
  feature-owned.
- Native pageable queries with a count query require PostgreSQL Testcontainers
  coverage for filters, visibility, stable sorting, totals, and page boundaries.

## Database
- **DBMS:** PostgreSQL
- **ddl-auto:** `validate`
- **Migrations:** Liquibase (schema defined through V13; see `docs/database/relationships.md` for current schema state)
- **Static custom reads:** write joins, aggregations, and non-trivial filters in PostgreSQL SQL. When the SQL is static and belongs to one feature aggregate, keep it in that feature's Spring Data repository with `@Query(nativeQuery = true)` and return a minimal scalar interface projection. Select only fields required by the API/use case.
- **JDBC-template boundary:** use `NamedParameterJdbcTemplate` for dynamic SQL, batch/reporting workloads, or result mapping that cannot stay clear as a small Spring Data projection. Create a separate query repository only when that boundary is actually needed.
- **JPA boundary:** Spring Data JPA remains available for entity persistence and simple CRUD/derived lookups. Do not introduce JPQL/HQL or constructor expressions such as `select new ...`.
- **Verification:** native PostgreSQL queries are coupled to the real schema and must be covered by PostgreSQL Testcontainers repository tests. Avoid repository-wide rewrites without feature scope and regression coverage.

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

## Testing

**Stack (Level 0–1):** JUnit 5, Mockito, AssertJ, MockMvc — all in `spring-boot-starter-test`. Level 2+ adds Testcontainers PostgreSQL (never H2).

All operational rules (naming, Clock injection, mocking, side-effect verification, test data hygiene, threshold testing) live in `backend/.windsurf/rules/testing-conventions.md` — do not duplicate them here.

**Detailed conventions:**
- `backend/.windsurf/rules/testing-conventions.md` — hard gates (auto-loads on test files)
- `.windsurf/skills/testing/SKILL.md` — test-level decision routing
- `docs/testing/testing-strategy.md` — full documentation with examples
