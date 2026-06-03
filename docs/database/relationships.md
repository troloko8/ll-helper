# Database Relationships

> **Project:** LLHelper — AI Language Cards
> **Current level:** Level 0 — Stable Backend Foundation
> **Sprint:** Sprint 0.1 — Architecture Freeze
> **Last updated:** 2026-06-02
> **Status:** Documentation only — schema changes deferred to Sprint 0.3

---

## 0. Verification Status

| Source | Status |
|--------|--------|
| JPA entity annotations | Reviewed |
| PostgreSQL actual schema | Not fully verified — to verify |
| `information_schema.columns` | To verify |
| `information_schema.referential_constraints` | To verify |
| `pg_indexes` | To verify |

**Note:** Until a Flyway baseline is created, this document describes the best-known current state based on entity annotations and Hibernate-generated schema. The actual DB schema must be verified in PostgreSQL before Sprint 0.3 migrations are written.

---

## 1. Purpose

This document describes the current database schema and entity relationships for the LLHelper project.

**Scope:** Sprint 0.1 Architecture Freeze — document current state, defer schema changes.

**Not in this document:**
- Flyway migrations (Sprint 0.3)
- Index implementation (Sprint 0.3)
- Constraint enforcement (Sprint 0.3)
- Cascade/delete behavior implementation (Sprint 0.3)

---

## 2. Current Tables/Entities

| Entity | Table | Layer | Purpose |
|--------|-------|-------|---------|
| `AuthUser` | `auth_users` | Auth | Authentication credentials |
| `User` | `users` | Auth/User | User profile data |
| `CardDesc` | `card_descs` | Content | Deck of cards (naming issue — represents "Deck") |
| `Card` | `cards` | Content | Individual flashcard |
| `UserDeckProgress` | `user_deck_progress` | Learning | User's progress on a deck |
| `UserCardProgress` | `user_card_progress` | Learning | User's progress on individual cards |

---

## 3. High-Level Relationship Diagram

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AUTH LAYER                                      │
│                                                                              │
│  ┌─────────────┐          1:1          ┌─────────────┐                     │
│  │  AuthUser   │────────────────────────▶│    User     │                     │
│  │  (auth_)    │                       │  (profile)  │                     │
│  └─────────────┘                       └──────┬──────┘                     │
│                                               │                              │
└───────────────────────────────────────────────┼──────────────────────────────┘
                                                │ 1:N
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CONTENT LAYER                                     │
│                                                                              │
│  ┌─────────────────┐         1:N         ┌─────────────┐                    │
│  │    CardDesc     │────────────────────▶│    Card     │                    │
│  │    ("Deck")     │   cascade: ALL      │             │                    │
│  └─────────────────┘                       └─────────────┘                    │
│           ▲                                  │                              │
│           │ N:1                              │ N:1                           │
│           │ owner                            │ card_desc_id                  │
│     ┌─────┴─────┐                            │ (FK, not null)               │
│     │   User    │                            │                               │
│     └───────────┘                            └───────────────────────────────┘
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           LEARNING LAYER                                     │
│                                                                              │
│     User ──1:N──▶ UserDeckProgress ──1:N──▶ UserCardProgress                 │
│                       │                           │                          │
│                       │ (deckId)                  │ (cardId)                 │
│                       ▼                           ▼                          │
│                   CardDesc                      Card                         │
│                   (by ID, not FK)              (by ID, not FK)              │
│                                                                              │
│  Note: Progress entities currently store IDs as Long, not JPA relationships. │
│        This keeps the model simple while copy vs reference is unresolved,   │
│        but it also means the database does not protect these references      │
│        from becoming orphaned.                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Content Layer Relationships

### 4.1 AuthUser → User (1:1)

```text
AuthUser.id ──1:1──▶ User.authUser
         @OneToOne(fetch = LAZY)
         @JoinColumn(name = "auth_user_id", nullable = false)
```

| Aspect | Current State |
|--------|---------------|
| JPA Relation | `@OneToOne` unidirectional from User to AuthUser |
| FK Column | `users.auth_user_id` |
| Nullable | No |
| Cascade | None |
| Ownership | User entity owns the relationship |

### 4.2 User → CardDesc (1:N) — "User owns Decks"

```text
User.id ──1:N──▶ CardDesc.owner
         @ManyToOne(fetch = LAZY, optional = false)
         @JoinColumn(name = "owner_id", nullable = false,
                     foreignKey = @ForeignKey(name = "fk_card_descs_owner"))
```

| Aspect | Current State |
|--------|---------------|
| JPA Relation | `@ManyToOne` in `CardDesc`; no inverse `@OneToMany` collection in `User` |
| FK Column | `card_descs.owner_id` |
| Nullable | No |
| Cascade | None |
| FK Name | `fk_card_descs_owner` (Hibernate naming) |

### 4.3 CardDesc → Card (1:N) — "Deck contains Cards"

```text
CardDesc.id ──1:N──▶ Card.cardDesc
           @OneToMany(mappedBy = "cardDesc", cascade = ALL, fetch = LAZY)
           @ManyToOne(fetch = LAZY, optional = false)
           @JoinColumn(name = "card_desc_id", nullable = false)
```

| Aspect | Current State |
|--------|---------------|
| JPA Relation | Bidirectional: `@OneToMany` in CardDesc, `@ManyToOne` in Card |
| FK Column | `cards.card_desc_id` |
| Nullable | No |
| Cascade | `CascadeType.ALL` (includes REMOVE) |
| Orphan Removal | Not set (orphan cards possible if removed from list) |

**⚠️ Risk:** `CascadeType.ALL` includes `REMOVE`. Deleting a Deck deletes all its Cards through JPA. Because progress currently stores `cardId` as a plain `Long` without FK protection, this can leave orphaned `UserCardProgress` rows pointing to deleted cards. If FK constraints are added later, the same operation may become a FK violation unless delete behavior is explicitly defined.

---

## 5. Learning Layer Relationships

### 5.1 User → UserDeckProgress (1:N) — "User enrolls in Decks"

```text
User.id ──1:N──▶ UserDeckProgress.userId
         Stored as Long ID, not JPA entity reference
```

| Aspect | Current State |
|--------|---------------|
| JPA Relation | None — stored as `Long userId` field |
| FK in DB | No explicit FK constraint |
| Rationale | Keeps the model simple while copy vs reference is unresolved; no DB protection against orphaned references |

### 5.2 UserDeckProgress → UserCardProgress (1:N) — "Deck progress contains Card progress"

```text
UserDeckProgress.id ──1:N──▶ UserCardProgress.userDeckProgressId
                   Stored as Long ID, not JPA entity reference
```

| Aspect | Current State |
|--------|---------------|
| JPA Relation | None — stored as `Long userDeckProgressId` field |
| FK in DB | No explicit FK constraint |
| Rationale | Keeps the model simple while copy vs reference is unresolved; no DB protection against orphaned references |

### 5.3 UserDeckProgress → CardDesc (N:1 logical) — "Progress refers to Deck"

```text
UserDeckProgress.deckId ──N:1 (logical)──▶ CardDesc.id
                       Stored as Long ID
```

| Aspect | Current State |
|--------|---------------|
| JPA Relation | None — stored as `Long deckId` field |
| FK in DB | No explicit FK constraint |
| Implication | Can reference deck that no longer exists |

### 5.4 UserCardProgress → Card (N:1 logical) — "Progress refers to Card"

```text
UserCardProgress.cardId ──N:1 (logical)──▶ Card.id
                       Stored as Long ID
```

| Aspect | Current State |
|--------|---------------|
| JPA Relation | None — stored as `Long cardId` field |
| FK in DB | No explicit FK constraint |
| Implication | Can reference card that no longer exists |

### 5.5 UserCardProgress → User (N:1 logical) — "Progress belongs to User"

```text
UserCardProgress.userId ──N:1 (logical)──▶ User.id
                       Stored as Long ID
```

| Aspect | Current State |
|--------|---------------|
| JPA Relation | None — stored as `Long userId` field |
| FK in DB | No explicit FK constraint |

---

## 6. Current Constraints

### 6.1 Hibernate `@Check` Constraints

| Entity | Constraint | Enforcement |
|--------|------------|-------------|
| `UserDeckProgress` | `status IN ('ACTIVE', 'PAUSED', 'ARCHIVED')` | Generated as DB `CHECK` if Hibernate applied it during schema creation |
| `UserCardProgress` | `status IN ('NEW', 'LEARNING', 'REVIEWING', 'MASTERED')` | Generated as DB `CHECK` if Hibernate applied it during schema creation |

**Note:** `org.hibernate.annotations.@Check` instructs Hibernate to include a `CHECK` constraint in the generated DDL. Whether it actually exists in the current database depends on when and how Hibernate generated the schema. With `ddl-auto=update`, Hibernate may not retroactively add constraints to existing tables. The actual presence of these constraints must be verified via:
```sql
SELECT * FROM information_schema.check_constraints WHERE constraint_schema = 'public';
```

### 6.2 Column Constraints

| Table | Column | Constraint |
|-------|--------|------------|
| `auth_users` | `email` | `UNIQUE`, `NOT NULL` |
| `auth_users` | `password_hash` | `NOT NULL` |
| `auth_users` | `role` | `NOT NULL` (with `@ColumnDefault`) |
| `users` | `username` | `UNIQUE`, `NOT NULL` |
| `users` | `auth_user_id` | `NOT NULL` (implied) |
| `card_descs` | `title` | `NOT NULL` |
| `card_descs` | `source_language` | `NOT NULL` |
| `card_descs` | `target_language` | `NOT NULL` |
| `card_descs` | `owner_id` | `NOT NULL` |
| `cards` | `title` | `NOT NULL` |
| `cards` | `card_desc_id` | `NOT NULL` |
| `user_deck_progress` | `user_id` | `NOT NULL` |
| `user_deck_progress` | `deck_id` | `NOT NULL` |
| `user_deck_progress` | `status` | `NOT NULL` |
| `user_card_progress` | `user_id` | `NOT NULL` |
| `user_card_progress` | `card_id` | `NOT NULL` |
| `user_card_progress` | `user_deck_progress_id` | `NOT NULL` |
| `user_card_progress` | `status` | `NOT NULL` |

### 6.3 Foreign Key Constraints (Hibernate Generated)

| FK Name | From Table | From Column | To Table | To Column |
|---------|------------|-------------|----------|-----------|
| `fk_card_descs_owner` | `card_descs` | `owner_id` | `users` | `id` |
| (auto-generated) | `cards` | `card_desc_id` | `card_descs` | `id` |

---

## 7. Required Future Unique Constraints

**Target Sprint:** 0.3 (Flyway migration)

| Constraint | Tables/Columns | Business Rule |
|------------|----------------|---------------|
| `UNIQUE(user_id, deck_id)` | `user_deck_progress` | One enrollment per user per deck |
| `UNIQUE(user_deck_progress_id, card_id)` | `user_card_progress` | One card progress per deck enrollment per card |
| `UNIQUE(user_id, card_id)` | `user_card_progress` | Alternative: one card progress per user per card (simpler but more restrictive) |

**Recommended for current enrollment-based model:**
- `UNIQUE(user_id, deck_id)` on `user_deck_progress`
- `UNIQUE(user_deck_progress_id, card_id)` on `user_card_progress`

> Do not add both `UNIQUE(user_deck_progress_id, card_id)` and `UNIQUE(user_id, card_id)` unless the final learning model requires it. If the same card can appear in multiple enrolled decks for the same user, `UNIQUE(user_id, card_id)` would incorrectly block that.

**Current State:** Not enforced. Duplicate enrollments possible at DB level (handled in service layer for now).

---

## 8. Required Future Indexes

**Target Sprint:** 0.3 (Flyway migration)

| Index | Table | Columns | Purpose |
|-------|-------|---------|---------|
| `idx_udp_user_deck` | `user_deck_progress` | `user_id, deck_id` | Fast lookup for enrollment check + unique constraint |
| `idx_udp_user_status` | `user_deck_progress` | `user_id, status` | List active/paused decks for user |
| `idx_ucp_user_deck` | `user_card_progress` | `user_deck_progress_id, status` | Query cards by deck progress + status |
| `idx_ucp_user_card` | `user_card_progress` | `user_id, card_id` | Fast card lookup (if using user+card unique) |
| `idx_ucp_next_review` | `user_card_progress` | `user_deck_progress_id, next_review_at` | Scheduled review queries |
| `idx_cards_deck` | `cards` | `card_desc_id` | Fast card lookup by deck (for deck deletion check) |

**Current State:** Only `users` table has indexes (see Known Issues). `user_card_progress` has commented-out index definitions.

---

## 9. Delete/Cascade Behavior Status

### 9.1 Current Behavior

| Relationship | Current Cascade | On Delete |
|--------------|-----------------|-----------|
| AuthUser → User | None | User deleted → AuthUser remains (orphan) |
| User → CardDesc | None | CardDesc stays (but has `owner_id` FK) |
| CardDesc → Card | `CascadeType.ALL` | **Cards deleted when Deck deleted** |
| User → UserDeckProgress | None (logical by ID) | Progress stays, references orphaned IDs |
| UserDeckProgress → UserCardProgress | None (logical by ID) | Card progress stays if deck progress deleted |

### 9.2 Unresolved Decisions (Sprint 0.3)

| Scenario | Options | Status |
|----------|---------|--------|
| Delete User | Cascade delete all User data? Restrict if content exists? | **Open** |
| Delete CardDesc (Deck) | Cascade delete Cards (current) + Progress? Restrict if progress exists? Soft delete? | **Open** — orphaned progress risk now; FK violation risk after FKs are added |
| Delete Card | Cascade delete UserCardProgress? Restrict if progress exists? | **Open** — orphaned progress risk now; FK violation risk after FKs are added |
| Delete UserDeckProgress | Cascade delete UserCardProgress? Orphan card progress? | **Open** |

### 9.3 Soft Delete Option

| Entity | Soft Delete Candidate | Rationale |
|--------|----------------------|-----------|
| `CardDesc` | **Yes** | Content deletion affects enrolled users |
| `Card` | **Yes** | Card deletion affects learning progress |
| `User` | Maybe | User deletion affects owned content |
| Progress entities | No | Progress is transient/resettable |

---

## 10. Copy vs Reference Status

**The Core Open Decision:** When a user enrolls in a public deck, should progress reference the original cards (reference) or create copies (copy)?

### Current Implementation: Reference (by ID)

```java
// UserCardProgress stores IDs, not entities
@Column(nullable = false)
private Long cardId;  // References Card.id

@Column(nullable = false)
private Long deckId;  // References CardDesc.id
```

### Implications

| Aspect | Reference (Current) | Copy (Alternative) |
|--------|---------------------|-------------------|
| **Pros** | Simple, no data duplication, instant updates | Owner can edit without affecting others, versioning possible |
| **Cons** | Owner edits affect all learners, deletion breaks progress | Data duplication, complexity in sync/merge |
| **Current Risk** | Deck owner deletes card → orphaned `UserCardProgress` rows (no DB FK protection); FK violation risk after FKs are added | N/A (not implemented) |

### Accepted Decision (Sprint 0.2)

**Accepted for current MVP: Reference model.**

`UserDeckProgress` and `UserCardProgress` reference original deck/cards by ID. Copy/fork model is deferred.

Current protection strategy:
- Sprint 0.2: document and enforce service-level ownership checks.
- Sprint 0.3: decide DB-level FK/delete behavior.
- Preferred direction: restrict delete if progress exists, unless soft delete is implemented.

### Decision Timeline

| Sprint | Action |
|--------|--------|
| 0.1 | ~~Document current state (reference by ID)~~ ✅ |
| 0.2 | ~~Decide strategy~~ ✅ — Reference accepted. Ownership checks enforced. |
| 0.3 | Implement: add FK constraints with RESTRICT, or soft delete |

---

## 11. Security/Ownership Notes

### 11.1 Ownership Chain

```text
AuthUser (credentials)
    └── User (profile)
            ├── CardDesc[] (owned decks)
            │       └── Card[] (deck cards)
            └── UserDeckProgress[] (enrolled decks)
                    └── UserCardProgress[] (card progress)
```

### 11.2 Access Control Matrix

| Resource | Owner Field | Public Flag | Access Rule |
|----------|-------------|-------------|-------------|
| `AuthUser` | `id` (self) | N/A | Self only (via JWT) |
| `User` | `authUser.id` | N/A | Self only |
| `CardDesc` | `owner` | `isPublic` | Owner: full. Others: read if `isPublic=true` |
| `Card` | via `cardDesc.owner` | via `cardDesc.isPublic` | Same as parent Deck |
| `UserDeckProgress` | `userId` | N/A | User with matching `userId` only |
| `UserCardProgress` | `userId` | N/A | User with matching `userId` only |

### 11.3 Current Enforcement

| Check | Layer | Status |
|-------|-------|--------|
| User can only access own progress | Service | ✅ Enforced in `LearningService` |
| User can only modify own decks | Service | ✅ Enforced (implicit via user context) |
| Public deck readable by others | Service | ✅ Enforced via `isPublic` check |
| Cannot enroll in private deck | Service | ✅ Enforced (403 if `!isPublic`) |

---

## 12. Known Issues

### 12.1 Critical

| Issue | Impact | Fix Sprint |
|-------|--------|------------|
| **No unique constraint on `(user_id, deck_id)`** | Duplicate enrollments possible | 0.3 |
| **No unique constraint on card progress** | Duplicate card progress rows possible | 0.3 |
| **Progress entities use IDs, no FK constraints** | Orphaned progress possible if content deleted | 0.3 |
| **CardDesc cascade deletes Cards** | Deleting deck deletes cards → breaks learner progress | 0.3 |

### 12.2 High Priority

| Issue | Impact | Fix Sprint |
|-------|--------|------------|
| **No indexes on progress tables** | Slow queries for study card selection | 0.3 |
| **Languages stored as VARCHAR, not enum** | Invalid language values possible | 0.3 |
| **No DB-level CHECK constraints** | Invalid status values possible via raw SQL | 0.3 |
| **User FIXME: verify FK indexes manually** | PostgreSQL does not automatically index referencing FK columns; verify which FK indexes are actually needed in `pg_indexes` | 0.2 |

### 12.3 Medium Priority

| Issue | Impact | Fix Sprint |
|-------|--------|------------|
| **No soft delete** | Hard deletes break referential integrity | 0.3 or later |
| **No cascade strategy defined for User deletion** | User deletion leaves orphaned data | 0.3 |
| **CardDesc Java/API naming** | Entity, package, controller, DTO naming should become `Deck` | 0.2 |
| **`card_descs` table naming** | DB table rename to `decks` requires Flyway migration — must happen after Flyway is introduced | 0.3 |

---

## 13. Sprint 0.3 TODO

When Flyway is enabled (`ddl-auto=validate`), implement:

### 13.1 Migrations Required

```sql
-- V1__baseline.sql (current state)
-- V2__add_constraints_and_indexes.sql (Sprint 0.3)

-- Unique constraints
ALTER TABLE user_deck_progress
    ADD CONSTRAINT unique_user_deck UNIQUE (user_id, deck_id);

ALTER TABLE user_card_progress
    ADD CONSTRAINT unique_deck_card UNIQUE (user_deck_progress_id, card_id);

-- Indexes
CREATE INDEX idx_udp_user_status ON user_deck_progress(user_id, status);
CREATE INDEX idx_ucp_deck_status ON user_card_progress(user_deck_progress_id, status);
CREATE INDEX idx_ucp_next_review ON user_card_progress(user_deck_progress_id, next_review_at);
CREATE INDEX idx_cards_deck ON cards(card_desc_id);

-- Foreign keys (if choosing Reference strategy)
-- ALTER TABLE user_deck_progress ADD CONSTRAINT fk_udp_deck
--     FOREIGN KEY (deck_id) REFERENCES card_descs(id) ON DELETE ...;
-- ALTER TABLE user_card_progress ADD CONSTRAINT fk_ucp_card
--     FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE ...;

-- CHECK constraints (PostgreSQL 12+)
-- ALTER TABLE card_descs ADD CONSTRAINT chk_source_language
--     CHECK (source_language <> '');
```

### 13.2 Decisions Required Before Sprint 0.3

1. **Copy vs Reference:** Decide and document before adding FKs
2. **Delete behavior:** RESTRICT vs CASCADE vs SET NULL for each relationship
3. **Soft delete:** Implement for CardDesc/Card before enabling strict constraints

---

## Appendix A — Schema Inspection Queries

Useful SQL to verify actual DB state before writing Sprint 0.3 migrations:

```sql
-- All columns with types, nullability, defaults
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- All FK constraints with cascade rules
SELECT
    tc.table_name AS child_table,
    kcu.column_name AS child_column,
    ccu.table_name AS parent_table,
    ccu.column_name AS parent_column,
    rc.update_rule,
    rc.delete_rule,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
   AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc
    ON rc.constraint_name = tc.constraint_name
   AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- All indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- CHECK constraints
SELECT
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public';

-- UNIQUE constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position;
```

---

## 14. References

| Document | Path |
|----------|------|
| Architecture overview | `docs/architecture/current-architecture.md` |
| Learning flow design | `docs/features/learning-flow.md` |
| Roadmap | `docs/roadmap/LL_Helper_Project_Roadmap.md` |
| Backend conventions | `backend/AGENTS.md`, `backend/CONVENTIONS.md` |
| Improvements backlog | `backend/IMPROVEMENTS.md` |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-02 | Initial version — Sprint 0.1 Architecture Freeze |
