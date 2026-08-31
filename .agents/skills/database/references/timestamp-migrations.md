# Timestamp Migrations

Use this reference for an existing timestamp type conversion or for technical-versus-business timestamp ownership.

## Ownership

Technical timestamps such as `created_at` and `updated_at` are database-managed. Map them as `Instant`, use `timestamptz`, mark them non-insertable/non-updatable, and define defaults/functions in Liquibase. Do not set them in application code.

Business timestamps such as `last_reviewed_at`, `last_studied_at`, and `next_review_at` are application-managed. Set them explicitly in the service when the business event occurs. Map them as `Instant` and `timestamptz`, but do not mark them non-insertable/non-updatable or add database defaults/functions/triggers.

```java
@Column(name = "created_at", nullable = false, insertable = false, updatable = false)
private Instant createdAt;

@Column(name = "last_reviewed_at")
private Instant lastReviewedAt;
```

## Converting `timestamp` to `timestamptz`

Use explicit `AT TIME ZONE`; do not use `modifyDataType` alone. PostgreSQL otherwise interprets old values using the session timezone, which can make conversion environment-dependent.

```yaml
- changeSet:
    id: V10-1
    author: llhelper
    comment: Convert learning timestamps with an explicit source timezone
    changes:
      - sql:
          dbms: postgresql
          sql: |
            ALTER TABLE user_deck_progress
              ALTER COLUMN last_studied_at TYPE timestamptz
              USING last_studied_at AT TIME ZONE 'Asia/Jerusalem';
```

Use the timezone in which the old values were created, not the destination environment's future timezone. Confirm that historical assumption before writing the migration.

For `timestamptz` technical timestamps, use `CURRENT_TIMESTAMP` for defaults and update functions. Do not combine it with `AT TIME ZONE 'UTC'`. Keep all database behavior in Liquibase.

Existing V9/V10 migrations are precedents, not authorization to assume the same source timezone for new conversions; inspect the actual data history.
