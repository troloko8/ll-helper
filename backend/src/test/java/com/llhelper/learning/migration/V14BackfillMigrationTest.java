package com.llhelper.learning.migration;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import liquibase.integration.spring.SpringLiquibase;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers(disabledWithoutDocker = true)
class V14BackfillMigrationTest {

    private static final String CHANGELOG = "classpath:/db/changelog/db.changelog-master.yaml";

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @Test
    void v14Backfill_shouldRepairOnlyMissingActiveProgressIdempotently() throws Exception {
        applyMigrations();
        seedHistoricalData();

        rerunV14();

        assertThat(progressCount()).isEqualTo(4);
        assertProgress(5001L, 4001L, "REVIEWING", 5, 3, 2, 1);
        assertProgress(5001L, 4002L, "NEW", 0, 0, 0, 0);
        assertProgress(5002L, 4001L, "NEW", 0, 0, 0, 0);
        assertProgress(5002L, 4002L, "NEW", 0, 0, 0, 0);
        assertThat(progressCountForEnrollment(5003L)).isZero();
        assertThat(progressCountForEnrollment(5004L)).isZero();

        rerunV14();

        assertThat(progressCount()).isEqualTo(4);
        assertProgress(5001L, 4001L, "REVIEWING", 5, 3, 2, 1);
    }

    private void rerunV14() throws Exception {
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement("""
                    DELETE FROM databasechangelog
                    WHERE id = 'V14-1'
                      AND author = 'llhelper'
                    """)) {
            assertThat(statement.executeUpdate()).isEqualTo(1);
        }
        applyMigrations();
    }

    private void applyMigrations() throws Exception {
        SpringLiquibase liquibase = new SpringLiquibase();
        liquibase.setDataSource(dataSource());
        liquibase.setChangeLog(CHANGELOG);
        liquibase.afterPropertiesSet();
    }

    private void seedHistoricalData() throws SQLException {
        try (Connection connection = openConnection(); Statement statement = connection.createStatement()) {
            statement.executeUpdate("""
                INSERT INTO auth_users (id, email, password_hash, role, created_at, updated_at)
                VALUES
                    (1001, 'owner-v14@example.com', 'hash', 'USER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                    (1002, 'active-one-v14@example.com', 'hash', 'USER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                    (1003, 'active-two-v14@example.com', 'hash', 'USER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                    (1004, 'paused-v14@example.com', 'hash', 'USER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                    (1005, 'archived-v14@example.com', 'hash', 'USER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
            statement.executeUpdate("""
                INSERT INTO users (
                    id, auth_user_id, first_name, last_name, username,
                    native_language, target_language, ui_language, created_at, updated_at
                )
                VALUES
                    (2001, 1001, 'Owner', 'V14', 'owner-v14', 'EN', 'RU', 'EN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                    (2002, 1002, 'Active', 'One', 'active-one-v14', 'EN', 'RU', 'EN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                    (2003, 1003, 'Active', 'Two', 'active-two-v14', 'EN', 'RU', 'EN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                    (2004, 1004, 'Paused', 'V14', 'paused-v14', 'EN', 'RU', 'EN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                    (2005, 1005, 'Archived', 'V14', 'archived-v14', 'EN', 'RU', 'EN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
            statement.executeUpdate("""
                INSERT INTO decks (
                    id, title, source_language, target_language,
                    owner_id, is_public, created_at, updated_at
                )
                VALUES (3001, 'V14 deck', 'EN', 'RU', 2001, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
            statement.executeUpdate("""
                INSERT INTO cards (id, title, translation, deck_id, created_at, updated_at)
                VALUES
                    (4001, 'first', 'first translation', 3001, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
                    (4002, 'second', 'second translation', 3001, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """);
            statement.executeUpdate("""
                INSERT INTO user_deck_progress (id, user_id, deck_id, status, enrolled_at)
                VALUES
                    (5001, 2002, 3001, 'ACTIVE', CURRENT_TIMESTAMP),
                    (5002, 2003, 3001, 'ACTIVE', CURRENT_TIMESTAMP),
                    (5003, 2004, 3001, 'PAUSED', CURRENT_TIMESTAMP),
                    (5004, 2005, 3001, 'ARCHIVED', CURRENT_TIMESTAMP)
                """);
            statement.executeUpdate("""
                INSERT INTO user_card_progress (
                    id, user_id, card_id, user_deck_progress_id,
                    times_seen, times_correct, times_wrong, correct_streak, status
                )
                VALUES (6001, 2002, 4001, 5001, 5, 3, 2, 1, 'REVIEWING')
                """);
        }
    }

    private void assertProgress(
        long enrollmentId,
        long cardId,
        String status,
        int timesSeen,
        int timesCorrect,
        int timesWrong,
        int correctStreak
    ) throws SQLException {
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement("""
                    SELECT status, times_seen, times_correct, times_wrong, correct_streak
                    FROM user_card_progress
                    WHERE user_deck_progress_id = ?
                      AND card_id = ?
                    """)) {
            statement.setLong(1, enrollmentId);
            statement.setLong(2, cardId);
            try (ResultSet result = statement.executeQuery()) {
                assertThat(result.next()).isTrue();
                assertThat(result.getString("status")).isEqualTo(status);
                assertThat(result.getInt("times_seen")).isEqualTo(timesSeen);
                assertThat(result.getInt("times_correct")).isEqualTo(timesCorrect);
                assertThat(result.getInt("times_wrong")).isEqualTo(timesWrong);
                assertThat(result.getInt("correct_streak")).isEqualTo(correctStreak);
                assertThat(result.next()).isFalse();
            }
        }
    }

    private int progressCount() throws SQLException {
        return queryForCount("SELECT COUNT(*) FROM user_card_progress", null);
    }

    private int progressCountForEnrollment(long enrollmentId) throws SQLException {
        return queryForCount(
            "SELECT COUNT(*) FROM user_card_progress WHERE user_deck_progress_id = ?",
            enrollmentId
        );
    }

    private int queryForCount(String sql, Long parameter) throws SQLException {
        try (Connection connection = openConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            if (parameter != null) {
                statement.setLong(1, parameter);
            }
            try (ResultSet result = statement.executeQuery()) {
                assertThat(result.next()).isTrue();
                return result.getInt(1);
            }
        }
    }

    private DriverManagerDataSource dataSource() {
        return new DriverManagerDataSource(
            POSTGRES.getJdbcUrl(),
            POSTGRES.getUsername(),
            POSTGRES.getPassword()
        );
    }

    private Connection openConnection() throws SQLException {
        return dataSource().getConnection();
    }
}
