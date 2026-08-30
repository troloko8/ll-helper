# Database Relationships

> **Project:** LLHelper — AI Language Cards
> **Current level:** Level 0 — Stable Backend Foundation
> **Current sprint:** see `docs/roadmap/current-sprint.md`
> **Last updated:** 2026-08-30
> **Status:** Liquibase migrations V1–V10 applied; V11 defined for G-06. Remaining index gaps: `idx_ucp_next_review`, `idx_cards_deck` (Backlog).

> **Schema Ownership:** All database constraints (unique, check, FK), indexes, and defaults are defined in Liquibase migrations (`backend/src/main/resources/db/changelog/`). Entity annotations describe only Java-to-DB mapping. See `docs/database/schema-ownership.md` for the full policy.

---

## 0. Verification Status

| Source | Status |
|--------|--------|
| JPA entity annotations | Reviewed |
| PostgreSQL actual schema | ✅ Verified |
| `information_schema.columns` | ✅ Verified |
| `information_schema.referential_constraints` | ✅ Verified |
| `pg_indexes` | ✅ Verified |

**Note:** V1–V10 Liquibase migrations applied and V11 is defined. `ddl-auto=validate`. CASCADE delete chains established: `decks → cards → user_card_progress`, `decks → user_deck_progress → user_card_progress`, `users → user_deck_progress → user_card_progress`. Soft delete deferred to Level 1. Remaining pending: `idx_ucp_next_review`, `idx_cards_deck`; AuthUser–User account-deletion flow and lifecycle policy (roadmap task 13).

---

## 1. Purpose

This document describes the current database schema and entity relationships for the LLHelper project.

**Scope:** Current schema definition through Liquibase migration V11.

**Not in this document:**
- Remaining index work (`idx_ucp_next_review`, `idx_cards_deck`) — see Section 8
- Soft delete implementation — deferred to Level 1

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
│              (Long ID in JPA, FK in DB)  (Long ID in JPA, FK in DB)       │
│                                                                              │
│  Note: Progress entities store IDs as Long (logical references). DB FKs      │
│        (V1/V4/V5) use ON DELETE CASCADE for content→progress and            │
│        learning→progress, establishing delete chains: Deck → Card →         │
│        UserCardProgress; Deck → UserDeckProgress → UserCardProgress;        │
│        User → UserDeckProgress → UserCardProgress. See §6.3 and §9.         │
│        Soft delete strategy is deferred to Level 1.                          │
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
| On Delete | `NO ACTION` (V1 baseline) |
| FK Name | `fk_decks_owner` — defined in Liquibase/DB; the entity annotation only mirrors the name |
| Implication | Deleting a `User` who owns `Deck`s is blocked unless Decks are removed/transferred first |

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

**Note:** `CascadeType.ALL` includes `REMOVE`. Deleting a Deck deletes all its Cards through JPA, and `fk_ucp_card` (`ON DELETE CASCADE`, V5) deletes dependent `UserCardProgress` rows at the DB level too — no orphaned rows. Trade-off: this permanently destroys learner progress; soft delete (deferred to Level 1) is the planned mitigation.

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
| FK in DB | `fk_udp_user` (added in V4 migration) |
| Rationale | Logical reference to avoid cross-module coupling; ON DELETE CASCADE — deleting a User deletes all their UserDeckProgress rows, which cascades to UserCardProgress (delete chain established in V4/V5) |

### 5.2 UserDeckProgress → UserCardProgress (1:N) — "Deck progress contains Card progress"

```text
UserDeckProgress.id ──1:N──▶ UserCardProgress.userDeckProgressId
                   Stored as Long ID, not JPA entity reference
```

| Aspect | Current State |
|--------|---------------|
| JPA Relation | None — stored as `Long userDeckProgressId` field |
| FK in DB | `fk_ucp_user_deck_progress` (added in V1 baseline) |
| Rationale | DB-level protection while keeping JPA model simple; ON DELETE CASCADE — deleting a UserDeckProgress deletes all its UserCardProgress rows (V4) |

### 5.3 UserDeckProgress → Deck (N:1 logical) — "Progress refers to Deck"

```text
UserDeckProgress.deckId ──N:1 (logical)──▶ Deck.id
                       Stored as Long ID
```

| Aspect | Current State |
|--------|---------------|
| JPA Relation | None — stored as `Long deckId` field |
| FK in DB | `fk_udp_deck` (added in V1 baseline) |
| Implication | ON DELETE CASCADE — deleting a Deck deletes all dependent UserDeckProgress rows, which then cascades to UserCardProgress (delete chain established in V5) |

### 5.4 UserCardProgress → Card (N:1 logical) — "Progress refers to Card"

```text
UserCardProgress.cardId ──N:1 (logical)──▶ Card.id
                       Stored as Long ID
```

| Aspect | Current State |
|--------|---------------|
| JPA Relation | None — stored as `Long cardId` field |
| FK in DB | `fk_ucp_card` (added in V1 baseline) |
| Implication | ON DELETE CASCADE — deleting a Card deletes all dependent UserCardProgress rows (delete chain established in V5) |

### 5.5 UserCardProgress → User (N:1 logical) — "Progress belongs to User"

```text
UserCardProgress.userId ──N:1 (logical)──▶ User.id
                       Stored as Long ID
```

| Aspect | Current State |
|--------|---------------|
| JPA Relation | None — stored as `Long userId` field |
| FK in DB | `fk_ucp_user` (added in V4 migration) |

---

## 6. Current Constraints

### 6.1 Current DB `CHECK` Constraints

| Entity | Constraint | Enforcement |
|--------|------------|-------------|
| `UserDeckProgress` | `status IN ('ACTIVE', 'PAUSED', 'ARCHIVED')` | `chk_user_deck_progress_status` (added in V1 baseline) |
| `UserCardProgress` | `status IN ('NEW', 'LEARNING', 'REVIEWING', 'MASTERED')` | `chk_user_card_progress_status` (added in V1 baseline) |
| `UserCardProgress` | `times_seen >= 0` | `chk_ucp_times_seen_non_negative` (added in V7) |
| `UserCardProgress` | `times_correct >= 0` | `chk_ucp_times_correct_non_negative` (added in V7) |
| `UserCardProgress` | `times_wrong >= 0` | `chk_ucp_times_wrong_non_negative` (added in V7) |
| `UserCardProgress` | `correct_streak >= 0` | `chk_ucp_correct_streak_non_negative` (added in V7) |
| `Deck` | `source_language IN ('EN','RU','DE',...)` | `chk_decks_source_language` (added in V6) |
| `Deck` | `target_language IN ('EN','RU','DE',...)` | `chk_decks_target_language` (added in V6) |

**Note:** No entity uses `org.hibernate.annotations.@Check` — verified against actual entity source (`backend/src/main/java`). All `CHECK` constraints are defined and enforced exclusively in Liquibase migrations, per `docs/database/schema-ownership.md`. With `ddl-auto=validate`, Hibernate only validates schema against entities; it does not generate or modify constraints.

### 6.2 Column Constraints

| Table | Column | Constraint |
|-------|--------|------------|
| `auth_users` | `email` | `UNIQUE`, `NOT NULL` |
| `auth_users` | `password_hash` | `NOT NULL` |
| `auth_users` | `role` | `NOT NULL`; entity default `"USER"` in Java field initializer (no `@ColumnDefault`) |
| `users` | `username` | `UNIQUE`, `NOT NULL` |
| `users` | `auth_user_id` | `NOT NULL` (implied) |
| `decks` | `title` | `NOT NULL` |
| `decks` | `source_language` | `NOT NULL`, enum CHECK (`chk_decks_source_language`), no default (V6) |
| `decks` | `target_language` | `NOT NULL`, enum CHECK (`chk_decks_target_language`), no default (V6) |
| `decks` | `owner_id` | `NOT NULL` |
| `cards` | `title` | `NOT NULL` |
| `cards` | `deck_id` | `NOT NULL` |
| `user_deck_progress` | `user_id` | `NOT NULL` |
| `user_deck_progress` | `deck_id` | `NOT NULL` |
| `user_deck_progress` | `status` | `NOT NULL` |
| `user_deck_progress` | `enrolled_at` | `NOT NULL` (V11 backfills existing rows from `last_studied_at` or migration time) |
| `user_card_progress` | `user_id` | `NOT NULL` |
| `user_card_progress` | `card_id` | `NOT NULL` |
| `user_card_progress` | `user_deck_progress_id` | `NOT NULL` |
| `user_card_progress` | `status` | `NOT NULL` |

### 6.2.1 Timestamp Columns

All timestamp columns use `timestamptz` (TIMESTAMP WITH TIME ZONE) and `java.time.Instant` for UTC-safe storage.

**Technical timestamps** (database-managed via DEFAULT + triggers):
- `auth_users.created_at`, `auth_users.updated_at`
- `users.created_at`, `users.updated_at`
- `decks.created_at`, `decks.updated_at`
- `cards.created_at`, `cards.updated_at`

Entity mapping: `@Column(name = "created_at", nullable = false, insertable = false, updatable = false)`

**Business timestamps** (application-managed):
- `user_deck_progress.enrolled_at` — set from the injected application `Clock` when enrollment is created; used for Start Learning ordering
- `user_deck_progress.last_studied_at` — set when user studies cards from deck
- `user_card_progress.last_reviewed_at` — set when user reviews specific card
- `user_card_progress.next_review_at` — calculated by spaced repetition algorithm

Entity mapping: `@Column(name = "last_reviewed_at")` (without `insertable=false, updatable=false`)

**Migration history:**
- V9: technical timestamps migrated from `timestamp` to `timestamptz` with DEFAULT + triggers
- V10: business timestamps migrated from `timestamp` to `timestamptz` using explicit `AT TIME ZONE 'Asia/Jerusalem'`
- V11: `enrolled_at timestamptz` added, existing rows backfilled, then constrained `NOT NULL`; no database default because the application owns this business timestamp

See `docs/database/schema-ownership.md` → "Business timestamps vs Technical timestamps" for detailed rules.

### 6.3 Foreign Key Constraints (Current State — V5)

| FK Name | From Table | From Column | To Table | To Column | On Delete | On Update |
|---------|------------|-------------|----------|-----------|-----------|-----------|
| `fk_decks_owner` | `decks` | `owner_id` | `users` | `id` | NO ACTION | NO ACTION |
| `fk_cards_deck` | `cards` | `deck_id` | `decks` | `id` | **CASCADE** | RESTRICT |
| `fk_users_auth_user` | `users` | `auth_user_id` | `auth_users` | `id` | NO ACTION | NO ACTION |
| `fk_udp_deck` | `user_deck_progress` | `deck_id` | `decks` | `id` | **CASCADE** | RESTRICT |
| `fk_ucp_card` | `user_card_progress` | `card_id` | `cards` | `id` | **CASCADE** | RESTRICT |
| `fk_ucp_user_deck_progress` | `user_card_progress` | `user_deck_progress_id` | `user_deck_progress` | `id` | CASCADE | RESTRICT |
| `fk_udp_user` | `user_deck_progress` | `user_id` | `users` | `id` | CASCADE | RESTRICT |
| `fk_ucp_user` | `user_card_progress` | `user_id` | `users` | `id` | CASCADE | RESTRICT |

**Note:** `fk_decks_owner` and `fk_users_auth_user` remain `NO ACTION` (inline FK in V1 baseline). `fk_cards_deck`, `fk_udp_deck`, `fk_ucp_card` migrated to CASCADE in V5; V4 added `fk_udp_user`/`fk_ucp_user`/`fk_ucp_user_deck_progress` with CASCADE. Delete chains: `decks → cards → user_card_progress`, `decks → user_deck_progress → user_card_progress`, and `users → user_deck_progress → user_card_progress`. Soft delete deferred to Level 1.

---

## 7. Unique Constraints

**Status:** ✅ Implemented (V2, V3) — except the rejected alternative.

| Constraint | Tables/Columns | Business Rule | Status |
|------------|----------------|---------------|--------|
| `UNIQUE(user_id, deck_id)` | `user_deck_progress` | One enrollment per user per deck | ✅ Implemented (V2) |
| `UNIQUE(user_deck_progress_id, card_id)` | `user_card_progress` | One card progress per deck enrollment per card | ✅ Implemented (V3) |
| `UNIQUE(user_id, card_id)` | `user_card_progress` | Alternative: one card progress per user per card (simpler but more restrictive) | ❌ Rejected alternative — removed in V3 |

**Recommended for current enrollment-based model:**
- `UNIQUE(user_id, deck_id)` on `user_deck_progress`
- `UNIQUE(user_deck_progress_id, card_id)` on `user_card_progress`

> Do not add both `UNIQUE(user_deck_progress_id, card_id)` and `UNIQUE(user_id, card_id)` unless the final learning model requires it. If the same card can appear in multiple enrolled decks for the same user, `UNIQUE(user_id, card_id)` would incorrectly block that.

**Current State:**
- `UNIQUE(user_id, deck_id)` on `user_deck_progress` — ✅ Added in V2 migration (`uk_user_deck_progress_user_deck`)
- `UNIQUE(user_deck_progress_id, card_id)` on `user_card_progress` — ✅ Added in V3 migration (`uk_user_card_progress_deck_card`)

**Note:** V1 had an incorrect `UNIQUE(user_id, card_id)` (`idx_ucp_user_card`) that blocked learning the same card in multiple enrolled decks. Removed in V3.

---

## 8. Indexes

**Status:** Partially implemented — G-06 added the user/status lookup index; `idx_ucp_next_review` and `idx_cards_deck` remain pending (Backlog).

| Index | Table | Columns | Purpose | Status |
|-------|-------|---------|---------|--------|
| `uk_user_deck_progress_user_deck` | `user_deck_progress` | `user_id, deck_id` | Fast lookup for enrollment check + unique constraint | ✅ Added in V2 |
| `idx_user_deck_progress_user_status` | `user_deck_progress` | `user_id, status` | List active learning decks for current user | ✅ Added in V11 |
| `idx_ucp_user_deck` | `user_card_progress` | `user_deck_progress_id, status` | Query cards by deck progress + status | ✅ Added in V1 baseline |
| `uk_user_card_progress_deck_card` | `user_card_progress` | `user_deck_progress_id, card_id` | Fast card lookup (unique) | ✅ Added in V3 (replaces the incorrect V1 `idx_ucp_user_card`) |
| `idx_ucp_next_review` | `user_card_progress` | `user_deck_progress_id, next_review_at` | Scheduled review queries | Pending (Backlog) |
| `idx_cards_deck` | `cards` | `deck_id` | Fast card lookup by deck (for deck deletion check) | Pending (Backlog) |

**Current State:**
- `users` table: `idx_user_username` (unique). `idx_user_auth` was a duplicate of `uk_users_auth_user_id` and was removed in V8.
- `user_card_progress`: `idx_ucp_user_deck` (V1), `uk_user_card_progress_deck_card` (V3, unique)
- `user_deck_progress`: `uk_user_deck_progress_user_deck` (V2, unique), `idx_user_deck_progress_user_status` (V11)
- Still pending: `idx_ucp_next_review`, `idx_cards_deck` — tracked in `docs/roadmap/backlog.md`.

---

## 9. Delete/Cascade Behavior Status

### 9.1 Current Behavior

| Relationship | Current Cascade | On Delete |
|--------------|-----------------|-----------|
| AuthUser → User | `fk_users_auth_user` NO ACTION | Deleting `AuthUser` while a `User` row exists is rejected by DB; deleting `User` leaves `AuthUser` without a profile (orphan). No account-deletion flow defined. |
| User → Deck | `fk_decks_owner` NO ACTION | User deletion blocked while they own Decks; Decks stay if `User` is removed only after Decks are deleted or transferred |
| Deck → Card | `CascadeType.ALL` (JPA) + `fk_cards_deck` CASCADE | **Cards deleted when Deck deleted** — aligned at JPA and DB level (V5) |
| User → UserDeckProgress | None (logical by ID), `fk_udp_user` CASCADE | Progress cascade-deleted when User deleted (V4) |
| UserDeckProgress → UserCardProgress | `fk_ucp_user_deck_progress` CASCADE | Card progress cascade-deleted when deck progress deleted (V4) |
| Deck → UserDeckProgress | `fk_udp_deck` CASCADE | Enrollment cascade-deleted when Deck deleted (V5) |
| Card → UserCardProgress | `fk_ucp_card` CASCADE | Card progress cascade-deleted when Card deleted (V5) |

### 9.2 Delete Behavior Decisions (Sprint 0.3)

| Scenario | Decision | Status |
|----------|----------|--------|
| Delete User | Progress rows cascade via V4, but `fk_decks_owner` blocks deletion while owned Decks exist | ⚠️ **Partially resolved** — account/content deletion flow remains open |
| Delete Deck | CASCADE: Deck → Cards → UserCardProgress; Deck → UserDeckProgress → UserCardProgress (V5) | ✅ **Resolved** — CASCADE accepted for MVP; soft delete deferred to Level 1 |
| Delete Card | CASCADE: Card → UserCardProgress (V5) | ✅ **Resolved** |
| Delete UserDeckProgress | CASCADE: UserDeckProgress → UserCardProgress (V4) | ✅ **Resolved** |
| Delete AuthUser | `fk_users_auth_user` NO ACTION — no defined account-deletion flow | **Open** — roadmap task 13: deleting `AuthUser` is blocked if `User` exists; deleting `User` leaves orphaned `AuthUser` row |

### 9.3 Soft Delete Option

| Entity | Soft Delete Candidate | Rationale |
|--------|----------------------|-----------|
| `Deck` | **Yes** | Content deletion affects enrolled users |
| `Card` | **Yes** | Card deletion affects learning progress |
| `User` | Maybe | User deletion affects owned content |
| Progress entities | No | Progress is transient/resettable |

---

## 10. Copy vs Reference Status

**Core model decision:** Enrolled progress references the original Deck and Card records. (Copy/fork alternative is deferred.)

### Current Implementation: Reference (by ID)

```java
// UserCardProgress stores IDs, not JPA entity references
@Column(nullable = false)
private Long cardId;  // References Card.id

@Column(nullable = false)
private Long userDeckProgressId;  // References UserDeckProgress.id
```

### Implications

| Aspect | Reference (Current) | Copy (Alternative) |
|--------|---------------------|-------------------|
| **Pros** | Simple, no data duplication, instant updates | Owner can edit without affecting others, versioning possible |
| **Cons** | Owner edits affect all learners, deletion breaks progress | Data duplication, complexity in sync/merge |
| **Current Behavior** | Deck owner deletes card → `UserCardProgress` cascade-deleted at DB level (`fk_ucp_card ON DELETE CASCADE`, V5) | N/A (not implemented) |

### Accepted Decision

**Accepted for current MVP: Reference model.**

`UserDeckProgress` and `UserCardProgress` reference original deck/cards by ID. Copy/fork model is deferred.

Protection strategy (implemented):
- Service-level ownership checks (who may mutate a deck/card).
- DB-level delete behavior: CASCADE (see Section 9), not RESTRICT — simpler for MVP; soft delete deferred to Level 1 for use cases that need to preserve progress history.

### Decision Timeline

| Stage | Action |
|--------|--------|
| Design | ~~Document current state (reference by ID)~~ ✅ |
| Design | ~~Decide strategy~~ ✅ — Reference accepted. Ownership checks enforced. |
| Implemented | ~~Add FK constraints with delete behavior~~ ✅ — CASCADE (V1/V4/V5). Soft delete remains deferred to Level 1. |

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
| ~~**No unique constraint on `(user_id, deck_id)`**~~ | ~~Duplicate enrollments possible~~ | ✅ Fixed in V2 migration |
| ~~**No unique constraint on card progress**~~ | ~~Duplicate card progress rows possible~~ | ✅ Fixed in V3 migration |
| ~~**Progress entities use IDs, no FK constraints**~~ | ~~Orphaned progress possible if content deleted~~ | ✅ Fixed: deck/card FKs since V1, `fk_udp_user`/`fk_ucp_user` added in V4, CASCADE finalized in V5 |
| ~~**Deck cascade deletes Cards**~~ | ~~Deleting deck deletes cards → breaks learner progress~~ | ✅ Accepted decision — see Section 9.2 (soft delete deferred to Level 1) |

### 12.2 High Priority

| Issue | Impact | Fix Sprint |
|-------|--------|------------|
| **Missing performance indexes** | `idx_ucp_next_review`, `idx_cards_deck` not created; see §8 and `docs/roadmap/backlog.md` | Backlog |
| **Cross-reference consistency is not enforced in DB** | Independent FKs do not guarantee that `UserCardProgress.userId` matches the parent `UserDeckProgress.userId`, or that `cardId` belongs to the enrolled Deck. Currently enforced by application logic. | Backlog |
| ~~**Languages stored as VARCHAR, not enum**~~ | ~~Invalid language values possible~~ | ✅ Fixed — `CHECK` constraints via V6 |
| ~~**No DB-level CHECK constraints**~~ | ~~Invalid status values possible via raw SQL~~ | ✅ Fixed — V6 (language), V7 (progress counters) |
| ~~**Verify FK indexes manually**~~ | ~~PostgreSQL does not automatically index referencing FK columns~~ | ✅ Done — V8 removed a duplicate index found during review |

### 12.3 Medium Priority

| Issue | Impact | Fix Sprint |
|-------|--------|------------|
| **No soft delete** | Content deletion permanently destroys learner progress (referential integrity itself is enforced via CASCADE) | Level 1 |
| **No account-deletion flow** | AuthUser → User: `NO ACTION` — deleting `User` leaves orphaned `AuthUser`; deleting `AuthUser` while `User` exists is blocked by FK. Account/profile deletion flow undefined. | Backlog (roadmap task 13) |
| ~~**Deck Java/API naming**~~ | ~~Entity, package, controller, DTO naming should become `Deck`~~ | ✅ Done |
| ~~**`decks` table naming**~~ | ~~DB table rename to `decks`~~ — ✅ Done manually | |

---

## 13. Migration History & Remaining Work

With Liquibase enabled (`ddl-auto=validate`), the following incremental migrations were applied after the V1 baseline:

### 13.1 Applied Migrations

```sql
-- V1__baseline_schema.yaml — CREATED (current state)
-- V2__enrollment_unique_constraint.yaml — CREATED (Sprint 0.3)
-- V3__card_progress_unique_constraint.yaml — CREATED (Sprint 0.3)
-- V4__learning_user_fk_constraints.yaml — CREATED (Sprint 0.3)
-- V5__cascade_delete_deck_card.yaml — CREATED (Sprint 0.3)

-- FK constraints on user_id
-- ✅ DONE (V4): ALTER TABLE user_deck_progress ADD CONSTRAINT fk_udp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ✅ DONE (V4): ALTER TABLE user_card_progress ADD CONSTRAINT fk_ucp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ✅ DONE (V4): ALTER TABLE user_card_progress DROP CONSTRAINT fk_ucp_user_deck_progress; ADD CONSTRAINT fk_ucp_user_deck_progress FOREIGN KEY (user_deck_progress_id) REFERENCES user_deck_progress(id) ON DELETE CASCADE;
-- ✅ DONE (V5): DROP + re-add fk_udp_deck ON DELETE CASCADE (was RESTRICT);
-- ✅ DONE (V5): DROP + re-add fk_ucp_card ON DELETE CASCADE (was RESTRICT);
-- ✅ DONE (V5): DROP + re-add fk_cards_deck ON DELETE CASCADE (was NO ACTION) — aligns DB with JPA CascadeType.ALL;
-- ✅ DONE (V6): DROP DEFAULT '' from decks.source_language / target_language;
-- ✅ DONE (V6): ADD CONSTRAINT chk_decks_source_language / chk_decks_target_language CHECK (enum values);

-- Unique constraints
-- ✅ DONE (V2): ALTER TABLE user_deck_progress ADD CONSTRAINT uk_user_deck_progress_user_deck UNIQUE (user_id, deck_id);
-- ✅ DONE (V3): DROP INDEX idx_ucp_user_card (incorrect UNIQUE(user_id, card_id));
-- ✅ DONE (V3): ALTER TABLE user_card_progress ADD CONSTRAINT uk_user_card_progress_deck_card UNIQUE (user_deck_progress_id, card_id);

-- CHECK constraints
-- ✅ DONE (V7): ALTER TABLE user_card_progress ADD CONSTRAINT chk_ucp_times_seen_non_negative CHECK (times_seen >= 0);
-- ✅ DONE (V7): ALTER TABLE user_card_progress ADD CONSTRAINT chk_ucp_times_correct_non_negative CHECK (times_correct >= 0);
-- ✅ DONE (V7): ALTER TABLE user_card_progress ADD CONSTRAINT chk_ucp_times_wrong_non_negative CHECK (times_wrong >= 0);
-- ✅ DONE (V7): ALTER TABLE user_card_progress ADD CONSTRAINT chk_ucp_correct_streak_non_negative CHECK (correct_streak >= 0);

-- ✅ DONE (V8): Dropped duplicate index `idx_user_auth` on `users.auth_user_id` (`uk_users_auth_user_id` already provides an implicit index). Added preconditions for idempotency.
-- ✅ DONE (V9): Migrated technical `created_at`/`updated_at` columns from `timestamp` to `timestamptz` for `auth_users`, `users`, `decks`, `cards`; added `DEFAULT CURRENT_TIMESTAMP` and `BEFORE UPDATE` triggers for `updated_at`.
-- ✅ DONE (V10): Migrated business `last_studied_at`/`last_reviewed_at`/`next_review_at` columns from `timestamp` to `timestamptz` for `user_deck_progress`, `user_card_progress` using `AT TIME ZONE 'Asia/Jerusalem'`.
```

### 13.2 Pending Indexes

```sql
CREATE INDEX idx_ucp_next_review ON user_card_progress(user_deck_progress_id, next_review_at);
CREATE INDEX idx_cards_deck ON cards(deck_id);
```

### 13.3 Decisions Made

1. ~~**Copy vs Reference:** Decide and document before adding FKs~~ ✅ Reference accepted
2. ~~**Delete behavior:** RESTRICT vs CASCADE vs SET NULL for each relationship~~ ✅ CASCADE accepted (V4/V5)
3. **Soft delete:** Implement for Deck/Card — deferred to Level 1, independent of the CASCADE decision above

---

## Appendix A — Schema Inspection Queries

Useful SQL to verify actual DB state before writing new migrations:

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
| Current sprint | `docs/roadmap/current-sprint.md` |
| Roadmap | `docs/roadmap/roadmap.md` |
| Backend conventions | `backend/AGENTS.md`, `backend/CONVENTIONS.md` |
| Improvements backlog | `backend/IMPROVEMENTS.md` |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-02 | Initial version — Sprint 0.1 Architecture Freeze |
| 2026-07-04 | Updated for Sprint 0.3: V1 Liquibase baseline created, DB schema verified, FK constraints and CHECK constraints documented. |
| 2026-07-05 | Corrected FK delete rules in section 6.3: inline FKs (`fk_decks_owner`, `fk_cards_deck`, `fk_users_auth_user`) use NO ACTION, not RESTRICT. |
| 2026-07-06 | V2 migration created: added `UNIQUE(user_id, deck_id)` on `user_deck_progress` (`uk_user_deck_progress_user_deck`). Updated Known Issues and Sprint 0.3 TODO. |
| 2026-07-06 | V3 migration created: dropped incorrect `UNIQUE(user_id, card_id)` (`idx_ucp_user_card`), added correct `UNIQUE(user_deck_progress_id, card_id)` (`uk_user_card_progress_deck_card`) on `user_card_progress`. Resolved roadmap task 19. |
| 2026-07-06 | V4 migration created: added FK `fk_udp_user` + `fk_ucp_user` (`user_id → users.id`) with CASCADE delete. Changed `fk_ucp_user_deck_progress` from RESTRICT to CASCADE. Delete chain: `users → user_deck_progress → user_card_progress`. |
| 2026-07-07 | V5 migration created: CASCADE delete for `fk_udp_deck`, `fk_ucp_card`, `fk_cards_deck`. Decision: CASCADE accepted for MVP (Sprint 0.3); soft delete deferred to Level 1. Full delete chains established. |
| 2026-07-07 | V6 migration created: Language enum for `decks.source_language`/`target_language`. Removed `defaultValue ''`, added CHECK constraints. Java enum `Language` in `common/model/`. Deck entity + DTOs updated. |
| 2026-07-07 | V7 migration created: CHECK constraints on `user_card_progress` counters (`times_seen >= 0`, `times_correct >= 0`, `times_wrong >= 0`, `correct_streak >= 0`) to prevent negative values. |
| 2026-07-13 | V8 migration created: Removed duplicate index `idx_user_auth` on `users.auth_user_id` (unique constraint `uk_users_auth_user_id` already creates index). Added preconditions for idempotency. |
| 2026-07-13 | V9 migration created: Migrated technical timestamps (`created_at`, `updated_at`) from `timestamp` to `timestamptz` for `auth_users`, `users`, `decks`, `cards`. Added DEFAULT CURRENT_TIMESTAMP and triggers for auto-update. Entities updated to `java.time.Instant` with `insertable=false, updatable=false`. |
| 2026-07-13 | V10 migration created: Migrated business timestamps (`last_studied_at`, `last_reviewed_at`, `next_review_at`) from `timestamp` to `timestamptz` for `user_deck_progress`, `user_card_progress` using explicit `AT TIME ZONE 'Asia/Jerusalem'`. Entities updated to `Instant` without `insertable/updatable=false` (application-managed). Added section 6.2.1 "Timestamp Columns". |
| 2026-07-30 | Doc audit: removed "Sprint 0.3 pending" framing. V2–V10 resolved unique constraints, FK policies, cascades, CHECK constraints, timestamp ownership, and duplicate-index cleanup. Remaining performance indexes tracked in §8 and `docs/roadmap/backlog.md`. Corrected Section 4.3/10 risk notes — FK protection already existed since V1, CASCADE finalized in V5. Header now points to `current-sprint.md`. |
| 2026-08-30 | V11 defined: added application-managed `user_deck_progress.enrolled_at`, safely backfilled existing rows, enforced `NOT NULL`, and added `idx_user_deck_progress_user_status(user_id, status)` for the G-06 Learning Decks list. |
