package com.llhelper;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * DB smoke test: verifies that Liquibase migrations (V1-V10) run successfully
 * against a clean PostgreSQL instance, and that the resulting schema is valid
 * for Hibernate (ddl-auto: validate).
 *
 * Without this test, there is no automated proof that TIMESTAMPTZ columns,
 * triggers, and CHECK constraints work correctly on a fresh database.
 */
@Testcontainers
@SpringBootTest
class ApplicationContextLoadsTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void overrideDatasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    void contextLoads_shouldStartApplication_withPostgres() {
        assertThat(applicationContext).isNotNull();
    }
}
