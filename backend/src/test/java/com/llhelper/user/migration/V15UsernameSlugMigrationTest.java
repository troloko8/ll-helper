package com.llhelper.user.migration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import liquibase.exception.LiquibaseException;
import liquibase.exception.PreconditionFailedException;
import liquibase.integration.spring.SpringLiquibase;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers(disabledWithoutDocker = true)
class V15UsernameSlugMigrationTest {

    private static final String CHANGELOG =
        "classpath:/db/changelog/changes/V15__canonicalize_username_slugs.yaml";

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @Test
    void v15_shouldCanonicalizeCompatibleDataAndEnforceSlugConstraint() throws Exception {
        DriverManagerDataSource dataSource = isolatedDataSource("v15_compatible");
        createPreV15UsersTable(dataSource);
        insertUser(dataSource, 1L, "  Mixed_User-2  ");

        applyMigration(dataSource);

        assertThat(username(dataSource, 1L)).isEqualTo("mixed_user-2");
        assertThatThrownBy(() -> insertUser(dataSource, 2L, "invalid.username"))
            .isInstanceOf(SQLException.class)
            .hasMessageContaining("chk_users_username_slug");
    }

    @Test
    void v15_shouldHalt_whenExistingUsernameIsIncompatible() throws Exception {
        DriverManagerDataSource dataSource = isolatedDataSource("v15_incompatible");
        createPreV15UsersTable(dataSource);
        insertUser(dataSource, 1L, "invalid.username");

        assertThatThrownBy(() -> applyMigration(dataSource))
            .isInstanceOf(LiquibaseException.class)
            .hasRootCauseInstanceOf(PreconditionFailedException.class);

        assertThat(username(dataSource, 1L)).isEqualTo("invalid.username");
    }

    @Test
    void v15_shouldHaltWithoutChangingData_whenExistingUsernameContainsNonAsciiCharacters() throws Exception {
        DriverManagerDataSource dataSource = isolatedDataSource("v15_non_ascii");
        createPreV15UsersTable(dataSource);
        insertUser(dataSource, 1L, "José");

        assertThatThrownBy(() -> applyMigration(dataSource))
            .isInstanceOf(LiquibaseException.class)
            .hasRootCauseInstanceOf(PreconditionFailedException.class);

        assertThat(username(dataSource, 1L)).isEqualTo("José");
    }

    @Test
    void v15_shouldHalt_whenCanonicalUsernamesCollide() throws Exception {
        DriverManagerDataSource dataSource = isolatedDataSource("v15_collision");
        createPreV15UsersTable(dataSource);
        insertUser(dataSource, 1L, "Reader");
        insertUser(dataSource, 2L, " reader ");

        assertThatThrownBy(() -> applyMigration(dataSource))
            .isInstanceOf(LiquibaseException.class)
            .hasRootCauseInstanceOf(PreconditionFailedException.class);

        assertThat(username(dataSource, 1L)).isEqualTo("Reader");
        assertThat(username(dataSource, 2L)).isEqualTo(" reader ");
    }

    private void applyMigration(DriverManagerDataSource dataSource) throws LiquibaseException {
        SpringLiquibase liquibase = new SpringLiquibase();
        liquibase.setDataSource(dataSource);
        liquibase.setChangeLog(CHANGELOG);
        liquibase.afterPropertiesSet();
    }

    private void createPreV15UsersTable(DriverManagerDataSource dataSource) throws SQLException {
        try (Connection connection = dataSource.getConnection(); Statement statement = connection.createStatement()) {
            statement.executeUpdate("CREATE TABLE users (id BIGINT PRIMARY KEY, username VARCHAR(255) UNIQUE NOT NULL)");
        }
    }

    private void insertUser(DriverManagerDataSource dataSource, long id, String username) throws SQLException {
        try (Connection connection = dataSource.getConnection();
                PreparedStatement statement = connection.prepareStatement(
                    "INSERT INTO users (id, username) VALUES (?, ?)"
                )) {
            statement.setLong(1, id);
            statement.setString(2, username);
            statement.executeUpdate();
        }
    }

    private String username(DriverManagerDataSource dataSource, long id) throws SQLException {
        try (Connection connection = dataSource.getConnection();
                PreparedStatement statement = connection.prepareStatement(
                    "SELECT username FROM users WHERE id = ?"
                )) {
            statement.setLong(1, id);
            try (ResultSet result = statement.executeQuery()) {
                assertThat(result.next()).isTrue();
                return result.getString(1);
            }
        }
    }

    private DriverManagerDataSource isolatedDataSource(String schema) throws SQLException {
        try (Connection connection = baseDataSource().getConnection(); Statement statement = connection.createStatement()) {
            statement.executeUpdate("CREATE SCHEMA " + schema);
        }

        String separator = POSTGRES.getJdbcUrl().contains("?") ? "&" : "?";
        return new DriverManagerDataSource(
            POSTGRES.getJdbcUrl() + separator + "currentSchema=" + schema,
            POSTGRES.getUsername(),
            POSTGRES.getPassword()
        );
    }

    private DriverManagerDataSource baseDataSource() {
        return new DriverManagerDataSource(
            POSTGRES.getJdbcUrl(),
            POSTGRES.getUsername(),
            POSTGRES.getPassword()
        );
    }
}
