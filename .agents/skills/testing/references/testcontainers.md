# PostgreSQL Testcontainers

Use this reference for repository or full integration tests. Before implementing them, read the relevant testing/scope heading of `docs/roadmap/current-sprint.md` fresh to determine whether they are in current scope. Do not hardcode the project's current level in this skill.

## Existing baseline

Verify the current build files and tests rather than relying on this reference for versions. The established direction is PostgreSQL Testcontainers with Spring Boot/JUnit. Never substitute H2 because the schema depends on PostgreSQL timestamp, function, and constraint behavior.

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

Prefer Spring Boot service connections when supported by the actual project setup; otherwise use explicit dynamic properties.

## What integration tests uniquely protect

- Liquibase applies to a real PostgreSQL database.
- Unique, FK, and CHECK constraints reject invalid data.
- Database functions update technical timestamps.
- `timestamptz` values round-trip correctly.
- Real custom queries return the intended rows.
- Concurrency-sensitive constraints behave correctly.

Keep ordinary unit/slice tests under the project's unit-test naming convention. If introducing an integration-test suffix or separate lifecycle, update the build configuration and normative testing documentation together; do not assume it already exists.
