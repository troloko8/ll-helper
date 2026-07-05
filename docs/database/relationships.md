# Database Relationships

> **Project:** LLHelper — AI Language Cards
> **Current level:** Level 0 — Stable Backend Foundation
> **Sprint:** Sprint 0.3 — Database Control
> **Last updated:** 2026-07-05
> **Status:** V1 baseline migration created with Liquibase; incremental constraints pending

---

## 0. Verification Status

| Source | Status |
|--------|--------|
| JPA entity annotations | Reviewed |
| PostgreSQL actual schema | ✅ Verified |
| `information_schema.columns` | ✅ Verified |
| `information_schema.referential_constraints` | ✅ Verified |
| `pg_indexes` | ✅ Verified |

**Note:** V1 Liquibase baseline migration has been created based on verified PostgreSQL schema (2026-07-04). `ddl-auto` is switched to `validate`. Incremental migrations (unique constraints, additional indexes, soft delete) are pending.

---

## 1. Purpose

This document describes the current database schema and entity relationships for the LLHelper project.

**Scope:** Sprint 0.3 — V1 Liquibase baseline created; current schema state documented. Incremental changes pending.

**Not in this document:**
- Incremental Liquibase migrations after V1 (Sprint 0.3)
- Full index implementation (Sprint 0.3)
- Unique constraint enforcement on progress tables (Sprint 0.3)
- Soft delete / cascade behavior implementation (Sprint 0.3)

---

## 2. Current Tables/Entities

| Entity | Table | Layer | Purpose |
|--------|-------|-------|---------|
| `AuthUser` | `auth_users` | Auth | Authentication credentials |
| `User` | `users` | Auth/User | User profile data |
| `Deck` | `decks` | Content | Deck of cards (naming issue — represents "Deck") |
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
│  │    Deck     │────────────────────▶│    Card     │                    │
│  │    ("Deck")     │   cascade: ALL      │             │                    │
│  └─────────────────┘                       └─────────────┘                    │
│           ▲                                  │                              │
│           │ N:1                              │ N:1                           │
│           │ owner                            │ deck_id                  │
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
│                   Deck                      Card                         │
│                   (by ID, not FK)              (by ID, not FK)              │
│                                                                              │
│  Note: Progress entities store IDs as Long (logical references). V1 baseline│
│        adds FK constraints on user_deck_progress.deck_id and                 │
│        user_card_progress.card_id/user_deck_progress_id with RESTRICT delete│
│        rules to prevent orphaned references. Soft delete strategy is pending.│
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

### 4.2 User → Deck (1:N) — "User owns Decks"

```text
User.id ──1:N──▶ Deck.owner
         @ManyToOne(fetch = LAZY, optional = false)
         @JoinColumn(name = "owner_id", nullable = false,
                     foreignKey = @ForeignKey(name = "fk_decks_owner"))
```

| Aspect | Current State |
|--------|---------------|
| JPA Relation | `@ManyToOne` in `Deck`; no inverse `@OneToMany` collection in `User` |
| FK Column | `decks.owner_id` |
| Nullable | No |
| Cascade | None |
| FK Name | `fk_decks_owner` (Hibernate naming) |

### 4.3 Deck → Card (1:N) — "Deck contains Cards"

```text
Deck.id ──1:N──▶ Card.deck
           @OneToMany(mappedBy = "deck", cascade = ALL, fetch = LAZY)
           @ManyToOne(fetch = LAZY, optional = false)
           @JoinColumn(name = "deck_id", nullable = false)
```

| Aspect | Current State |
|--------|---------------|
| JPA Relation | Bidirectional: `@OneToMany` in Deck, `@ManyToOne` in Card |
| FK Column | `cards.deck_id` |
| Nullable | No |
| Cascade | `CascadeType.ALL` (includes REMOVE) |
| Orphan Removal | Not set (orphan cards possible if removed from list) |
| **ID-only access** | **`Card.deckId` (read-only) — direct access without lazy loading** |

**Pattern:** Card entity uses **hybrid approach** (Sprint 0.2):
- `deckId` field (`insertable = false, updatable = false`) — for fast read-only access to deck ID
- `deck` relationship (`@ManyToOne LAZY`) — for full deck navigation when needed

This avoids `LazyInitializationException` in response DTOs while keeping the relationship available for ownership checks and other operations.

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
| FK in DB | No FK on `user_id` (logical reference) |
| Rationale | Logical reference to avoid cross-module coupling; orphaned user risk handled at service level |

### 5.2 UserDeckProgress → UserCardProgress (1:N) — "Deck progress contains Card progress"

```text
UserDeckProgress.id ──1:N──▶ UserCardProgress.userDeckProgressId
                   Stored as Long ID, not JPA entity reference
```

| Aspect | Current State |
|--------|---------------|
| JPA Relation | None — stored as `Long userDeckProgressId` field |
| FK in DB | `fk_ucp_user_deck_progress` (added in V1 baseline) |
| Rationale | DB-level protection while keeping JPA model simple |

### 5.3 UserDeckProgress → Deck (N:1 logical) — "Progress refers to Deck"

```text
UserDeckProgress.deckId ──N:1 (logical)──▶ Deck.id
                       Stored as Long ID
```

| Aspect | Current State |
|--------|---------------|
| JPA Relation | None — stored as `Long deckId` field |
| FK in DB | `fk_udp_deck` (added in V1 baseline) |
| Implication | RESTRICT delete prevents deck deletion while enrollments exist |

### 5.4 UserCardProgress → Card (N:1 logical) — "Progress refers to Card"

```text
UserCardProgress.cardId ──N:1 (logical)──▶ Card.id
                       Stored as Long ID
```

| Aspect | Current State |
|--------|---------------|
| JPA Relation | None — stored as `Long cardId` field |
| FK in DB | `fk_ucp_card` (added in V1 baseline) |
| Implication | RESTRICT delete prevents card deletion while progress exists |

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

### 6.1 DB `CHECK` Constraints (V1 Baseline)

| Entity | Constraint | Enforcement |
|--------|------------|-------------|
| `UserDeckProgress` | `status IN ('ACTIVE', 'PAUSED', 'ARCHIVED')` | `chk_user_deck_progress_status` (added in V1 baseline) |
| `UserCardProgress` | `status IN ('NEW', 'LEARNING', 'REVIEWING', 'MASTERED')` | `chk_user_card_progress_status` (added in V1 baseline) |

**Note:** `org.hibernate.annotations.@Check` is used on entities for documentation, but actual DB enforcement comes from Liquibase V1 baseline. With `ddl-auto=validate`, Hibernate only validates schema against entities; it does not generate or modify constraints.

### 6.2 Column Constraints

| Table | Column | Constraint |
|-------|--------|------------|
| `auth_users` | `email` | `UNIQUE`, `NOT NULL` |
| `auth_users` | `password_hash` | `NOT NULL` |
| `auth_users` | `role` | `NOT NULL` (with `@ColumnDefault`) |
| `users` | `username` | `UNIQUE`, `NOT NULL` |
| `users` | `auth_user_id` | `NOT NULL` (implied) |
| `decks` | `title` | `NOT NULL` |
| `decks` | `source_language` | `NOT NULL` |
| `decks` | `target_language` | `NOT NULL` |
| `decks` | `owner_id` | `NOT NULL` |
| `cards` | `title` | `NOT NULL` |
| `cards` | `deck_id` | `NOT NULL` |
| `user_deck_progress` | `user_id` | `NOT NULL` |
| `user_deck_progress` | `deck_id` | `NOT NULL` |
| `user_deck_progress` | `status` | `NOT NULL` |
| `user_card_progress` | `user_id` | `NOT NULL` |
| `user_card_progress` | `card_id` | `NOT NULL` |
| `user_card_progress` | `user_deck_progress_id` | `NOT NULL` |
| `user_card_progress` | `status` | `NOT NULL` |

### 6.3 Foreign Key Constraints (V1 Baseline)

| FK Name | From Table | From Column | To Table | To Column | On Delete | On Update |
|---------|------------|-------------|----------|-----------|-----------|-----------|
| `fk_decks_owner` | `decks` | `owner_id` | `users` | `id` | NO ACTION | NO ACTION |
| `fk_cards_deck` | `cards` | `deck_id` | `decks` | `id` | NO ACTION | NO ACTION |
| `fk_users_auth_user` | `users` | `auth_user_id` | `auth_users` | `id` | NO ACTION | NO ACTION |
| `fk_udp_deck` | `user_deck_progress` | `deck_id` | `decks` | `id` | RESTRICT | RESTRICT |
| `fk_ucp_card` | `user_card_progress` | `card_id` | `cards` | `id` | RESTRICT | RESTRICT |
| `fk_ucp_user_deck_progress` | `user_card_progress` | `user_deck_progress_id` | `user_deck_progress` | `id` | RESTRICT | RESTRICT |

**Note:** `fk_decks_owner`, `fk_cards_deck`, and `fk_users_auth_user` are created as inline FK constraints in V1 (`createTable` column constraints), which do not specify `onDelete` in PostgreSQL → default is `NO ACTION`. The other three FKs use `addForeignKeyConstraint` with explicit `onDelete: RESTRICT`. The first group should be migrated to `RESTRICT` via `addForeignKeyConstraint` in Sprint 0.3 (roadmap tasks 16–17).

---

## 7. Required Future Unique Constraints

**Target Sprint:** 0.3 (Liquibase incremental migration after V1 baseline)

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

**Target Sprint:** 0.3 (Liquibase incremental migration after V1 baseline)

| Index | Table | Columns | Purpose | Status |
|-------|-------|---------|---------|--------|
| `idx_udp_user_deck` | `user_deck_progress` | `user_id, deck_id` | Fast lookup for enrollment check + unique constraint | Pending |
| `idx_udp_user_status` | `user_deck_progress` | `user_id, status` | List active/paused decks for user | Pending |
| `idx_ucp_user_deck` | `user_card_progress` | `user_deck_progress_id, status` | Query cards by deck progress + status | ✅ Added in V1 baseline |
| `idx_ucp_user_card` | `user_card_progress` | `user_id, card_id` | Fast card lookup (unique) | ✅ Added in V1 baseline |
| `idx_ucp_next_review` | `user_card_progress` | `user_deck_progress_id, next_review_at` | Scheduled review queries | Pending |
| `idx_cards_deck` | `cards` | `deck_id` | Fast card lookup by deck (for deck deletion check) | Pending |

**Current State (after V1 baseline):**
- `users` table: `idx_user_auth`, `idx_user_username` (unique)
- `user_card_progress`: `idx_ucp_user_deck`, `idx_ucp_user_card` (unique)
- `idx_udp_user_status`, `idx_ucp_deck_status`, `idx_ucp_next_review`, `idx_cards_deck` are pending in Sprint 0.3.

---

## 9. Delete/Cascade Behavior Status

### 9.1 Current Behavior

| Relationship | Current Cascade | On Delete |
|--------------|-----------------|-----------|
| AuthUser → User | None | User deleted → AuthUser remains (orphan) |
| User → Deck | None | Deck stays (but has `owner_id` FK) |
| Deck → Card | `CascadeType.ALL` (JPA) | **Cards deleted when Deck deleted** at JPA level; DB FK `fk_cards_deck` currently uses NO ACTION (to be migrated to RESTRICT in Sprint 0.3) |
| User → UserDeckProgress | None (logical by ID) | Progress stays, references orphaned IDs |
| UserDeckProgress → UserCardProgress | None (logical by ID) | Card progress stays if deck progress deleted |

### 9.2 Unresolved Decisions (Sprint 0.3)

| Scenario | Options | Status |
|----------|---------|--------|
| Delete User | Cascade delete all User data? Restrict if content exists? | **Open** |
| Delete Deck | Cascade delete Cards (current) + Progress? Restrict if progress exists? Soft delete? | **Open** — orphaned progress risk now; FK violation risk after FKs are added |
| Delete Card | Cascade delete UserCardProgress? Restrict if progress exists? | **Open** — orphaned progress risk now; FK violation risk after FKs are added |
| Delete UserDeckProgress | Cascade delete UserCardProgress? Orphan card progress? | **Open** |

### 9.3 Soft Delete Option

| Entity | Soft Delete Candidate | Rationale |
|--------|----------------------|-----------|
| `Deck` | **Yes** | Content deletion affects enrolled users |
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
private Long deckId;  // References Deck.id
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
            ├── Deck[] (owned decks)
            │       └── Card[] (deck cards)
            └── UserDeckProgress[] (enrolled decks)
                    └── UserCardProgress[] (card progress)
```

### 11.2 Access Control Matrix

| Resource | Owner Field | Public Flag | Access Rule |
|----------|-------------|-------------|-------------|
| `AuthUser` | `id` (self) | N/A | Self only (via JWT) |
| `User` | `authUser.id` | N/A | Self only |
| `Deck` | `owner` | `isPublic` | Owner: full. Others: read if `isPublic=true` |
| `Card` | via `deck.owner` | via `deck.isPublic` | Same as parent Deck |
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
| **Deck cascade deletes Cards** | Deleting deck deletes cards → breaks learner progress | 0.3 |

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
| **Deck Java/API naming** | Entity, package, controller, DTO naming should become `Deck` | 0.2 |
| ~~**`decks` table naming**~~ | ~~DB table rename to `decks`~~ — ✅ Done manually in Sprint 0.2 | ~~0.3~~ |

---

## 13. Sprint 0.3 TODO

With Liquibase enabled (`ddl-auto=validate`), the following incremental migrations are planned after V1 baseline:

### 13.1 Migrations Required

```sql
-- V1__baseline_schema.yaml — CREATED (current state)
-- V2__add_constraints_and_indexes.yaml (Sprint 0.3)

-- Unique constraints (pending)
ALTER TABLE user_deck_progress
    ADD CONSTRAINT unique_user_deck UNIQUE (user_id, deck_id);

ALTER TABLE user_card_progress
    ADD CONSTRAINT unique_deck_card UNIQUE (user_deck_progress_id, card_id);

-- Indexes (pending)
CREATE INDEX idx_udp_user_status ON user_deck_progress(user_id, status);
CREATE INDEX idx_ucp_deck_status ON user_card_progress(user_deck_progress_id, status);
CREATE INDEX idx_ucp_next_review ON user_card_progress(user_deck_progress_id, next_review_at);
CREATE INDEX idx_cards_deck ON cards(deck_id);

-- CHECK constraints for language non-empty (pending)
-- ALTER TABLE decks ADD CONSTRAINT chk_source_language
--     CHECK (source_language <> '');
```

### 13.2 Decisions Required Before Sprint 0.3

1. ~~**Copy vs Reference:** Decide and document before adding FKs~~ ✅ Reference accepted in Sprint 0.2
2. **Delete behavior:** RESTRICT vs CASCADE vs SET NULL for each relationship
3. **Soft delete:** Implement for Deck/Card before enabling strict constraints

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
| 2026-07-04 | Updated for Sprint 0.3: V1 Liquibase baseline created, DB schema verified, FK constraints and CHECK constraints documented. |
| 2026-07-05 | Corrected FK delete rules in section 6.3: inline FKs (`fk_decks_owner`, `fk_cards_deck`, `fk_users_auth_user`) use NO ACTION, not RESTRICT. |
