# Timestamp Migrations — Deep Reference

Read only when converting an existing `timestamp` column to `timestamptz`, or when deciding technical vs business timestamp ownership for a new field.

## Technical vs business timestamps

**Technical timestamps** (`created_at`, `updated_at`):
- Managed by database (DEFAULT + triggers)
- Use `Instant` + `timestamptz`
- Mark as `insertable = false, updatable = false`
- Never set manually in application code

**Business timestamps** (`last_reviewed_at`, `last_studied_at`, `next_review_at`):
- Managed by application business logic
- Use `Instant` + `timestamptz` for UTC-safe storage
- **Do NOT** mark as `insertable = false, updatable = false`
- **Do NOT** add database DEFAULT or triggers
- Set explicitly in service layer when the business event occurs

```java
// Technical timestamp — database-managed
@Column(name = "created_at", nullable = false, insertable = false, updatable = false)
private Instant createdAt;

// Business timestamp — application-managed
@Column(name = "last_reviewed_at")
private Instant lastReviewedAt;
```

## Converting existing TIMESTAMP to TIMESTAMPTZ

**Always use explicit `AT TIME ZONE`** — never `modifyDataType` alone.

**❌ UNSAFE — do NOT use `modifyDataType`:**
```yaml
- modifyDataType:
    tableName: user_card_progress
    columnName: last_reviewed_at
    newDataType: TIMESTAMPTZ
```
PostgreSQL interprets `timestamp` → `timestamptz` based on **session timezone** — different sessions can convert the same data differently, with no guaranteed consistency.

**✅ SAFE — use explicit `AT TIME ZONE`:**
```yaml
- changeSet:
    id: V10-1
    author: llhelper
    comment: Convert learning progress timestamps to timestamptz with explicit timezone
    changes:
      - sql:
          dbms: postgresql
          sql: |
            ALTER TABLE user_deck_progress
              ALTER COLUMN last_studied_at TYPE timestamptz
              USING last_studied_at AT TIME ZONE 'Asia/Jerusalem';

            ALTER TABLE user_card_progress
              ALTER COLUMN last_reviewed_at TYPE timestamptz
              USING last_reviewed_at AT TIME ZONE 'Asia/Jerusalem',
              ALTER COLUMN next_review_at TYPE timestamptz
              USING next_review_at AT TIME ZONE 'Asia/Jerusalem';
```

**Why safe:** explicit timezone ensures all values are interpreted consistently. Use the timezone where the **old** `timestamp` values were actually created (where the application was running), not where it will run in the future — e.g. `'Asia/Jerusalem'` if created via `LocalDateTime.now()` in Israel, `'UTC'` if created in UTC.

## Database defaults and triggers

- DB defaults/triggers must be defined in Liquibase only
- Use `DEFAULT CURRENT_TIMESTAMP` for `timestamptz` columns
- Use `NEW.updated_at = CURRENT_TIMESTAMP` in updated_at triggers
- **Do not** use `CURRENT_TIMESTAMP AT TIME ZONE 'UTC'` with `timestamptz` (redundant)
- Do not use `@PrePersist`/`@PreUpdate` for technical timestamps, and do not set them manually in the service layer

## Precedent in this codebase

- **V9:** technical timestamps (`created_at`, `updated_at`) for `users`, `auth_users`, `decks`, `cards` → `timestamptz` + DEFAULT + triggers; entities moved to `Instant` with `insertable=false, updatable=false`; `@PrePersist/@PreUpdate` removed
- **V10:** business timestamps (`last_studied_at`, `last_reviewed_at`, `next_review_at`) for `user_deck_progress`, `user_card_progress` → `timestamptz` with explicit `AT TIME ZONE 'Asia/Jerusalem'`; entities on `Instant` without `insertable/updatable = false` (application-managed)
