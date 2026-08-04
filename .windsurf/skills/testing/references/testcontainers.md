# Testcontainers / Integration Tests — Deep Reference

**Level 2 scope.** Current project level is Level 0 — check `docs/roadmap/roadmap.md` and `docs/roadmap/current-sprint.md` before assuming this work is in scope right now. Today only one smoke test (`ApplicationContextLoadsTest`) uses Testcontainers, to verify Liquibase V1–V10 apply cleanly.

## Setup already in place

- Dependency: `org.testcontainers:postgresql` + `junit-jupiter` (1.20.4) in `pom.xml`
- `ApplicationContextLoadsTest` — `@SpringBootTest` + Testcontainers PostgreSQL, one `contextLoads_shouldStartApplication_withPostgres()` test
- **Never use H2** — incompatible with TIMESTAMPTZ, triggers, CHECK constraints used in this schema

## Planned patterns (Level 2 — not yet implemented)

```java
@SpringBootTest
@Testcontainers
class LearningFlowIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
}
```

Prefer `@ServiceConnection` (Spring Boot 3.1+/4.x) over manual `@DynamicPropertySource` wiring when possible — less boilerplate.

## What integration tests should verify that unit/@WebMvcTest cannot

- Liquibase migrations actually apply cleanly on a real PostgreSQL
- Unique/FK constraints actually reject bad data (`DataIntegrityViolationException` → mapped to 409)
- Triggers actually update `updated_at`
- TIMESTAMPTZ round-trips correctly through JDBC
- Race conditions: two concurrent enrolls → one succeeds, one gets a constraint violation

## Naming convention (when this work starts)

- Unit/slice tests: `*Test` suffix (Surefire, run by `./mvnw test`, no Testcontainers)
- Integration tests: `*IT` suffix (Failsafe, run by `./mvnw verify`)

See `docs/roadmap/backlog.md` → Level 2 → Testing for the full planned scope (coverage reports, CI ordering, `@DataJpaTest` for custom queries).
