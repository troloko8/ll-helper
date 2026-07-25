# Cascade Agent Instructions — LLHelper Backend

This file is auto-read by Cascade on every session in this project.
Apply these conventions for ALL backend code in this repository.

## Rules Reference

Detailed conventions are loaded automatically from `.windsurf/rules/`. Quick index:

| File | Covers |
|------|--------|
| `database-schema-ownership.md` | Liquibase ownership, timestamps, migrations, constraints, enums |
| `entity-conventions.md` | JPA entity patterns, Lombok rules, mapper integration |
| `mapstruct-conventions.md` | MapStruct patterns, DTO ↔ Entity mapping, multi-source |
| `testing-conventions.md` | Test types, naming, AAA, mocking, AssertJ, Clock injection |
| `documentation-sync.md` | Which docs to update and when |
| `project-roadmap.md` | Current level and sprint status |

## Core Project Documents

- Roadmap: `docs/roadmap/LL_Helper_Project_Roadmap.md`
- Current architecture: `docs/architecture/current-architecture.md`
- Database relationships: `docs/database/relationships.md`
- Learning flow: `docs/features/learning-flow.md`
- AI generation flow: `docs/features/ai-generation-flow.md`

Before changing entities, relationships, constraints, indexes, or migrations — check `docs/database/relationships.md`.

Before changing architecture, packages, or request lifecycle — check `docs/architecture/current-architecture.md`.

## Security — Ownership Rule (CRITICAL)

Only the deck owner can create, update, delete, or AI-generate cards inside a deck.

Always verify before mutating deck content:

```java
if (!Objects.equals(deck.getOwner().getId(), currentUserId)) {
    throw new AccessDeniedException("Access denied: not deck owner");
}
```

Applies to: `POST /api/v1/cards`, `POST /api/v1/cards/bulk-generate`, and any future endpoint that mutates deck content.

## Schema Rule (CRITICAL)

Liquibase is the single source of truth for the DB schema.

- **Never** use `ddl-auto: update`
- **Never** add `@Table(uniqueConstraints=...)`, `@Index`, `@Check`, `@ColumnDefault` to entities
- Real constraints, indexes, defaults → Liquibase changesets only

Full policy: `.windsurf/rules/database-schema-ownership.md`

## Testing (brief)

**When writing or reviewing tests, read:**
- `.windsurf/rules/testing-conventions.md` — краткие обязательные правила
- `docs/testing/testing-strategy.md` — полная документация с примерами

Key rules (always apply):
- Naming: `method_shouldExpectedResult_whenCondition`
- Structure: Arrange / Act / Assert for non-trivial tests; trivial one-liners don’t need AAA comments
- For a critical use case — cover both business logic (unit) and HTTP mapping (`@WebMvcTest`); no need to mirror every scenario on both levels
- Services that use time must inject `Clock` — test with `Clock.fixed(...)`
- **Never use H2** — incompatible with TIMESTAMPTZ, triggers, CHECK constraints
- `@MockitoBean` in `@WebMvcTest` (Spring Boot 4.x — заменяет `@MockBean`)
- AssertJ over JUnit assertions: `assertThat(x).isEqualTo(1)`, not `assertEquals(1, x)`
- If the service explicitly calls `repository.save(...)`, verify the call; on error paths verify it was `never()` called
- Use distinct constant IDs per entity in test data — identical values can mask argument-order bugs
- For threshold/branching logic (`>=`, `>`), add a boundary test one unit below the threshold, not just at/above it
