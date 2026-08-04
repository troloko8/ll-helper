# Foreign Keys and Indexes — Deep Reference

For FK *syntax* hard gates (explicit `addForeignKeyConstraint`, default `RESTRICT`), see `backend/.windsurf/rules/liquibase-conventions.md` — this file covers the **decision framework**, not the syntax.

## Cascade vs Restrict — how to decide

Use `RESTRICT` (default) unless the child row has **no independent business value** and the parent-child lifecycle is strictly owned by the parent.

**Do not use `CASCADE`** for users, learning progress, payments, bids, audit/history, or other business records unless an explicit deletion policy is documented. Prefer soft delete or `RESTRICT` for user-facing business entities until the deletion policy is clear.

**Precedent in this codebase:**
- `Deck → Cards`: `CASCADE` accepted for MVP (V5) — cards have no independent value without their deck
- `User → UserDeckProgress → UserCardProgress`: `CASCADE` (V4) — progress has no meaning without the user
- `AuthUser → User`, `User → Deck` (`fk_users_auth_user`, `fk_decks_owner`): still `NO ACTION` — deferred until `DELETE /api/v1/me` + soft delete policy is implemented (see `docs/roadmap/backlog.md` → Level 1 Backend)

## When to add an index

PostgreSQL does **not** automatically index child-side foreign key columns. Decide based on: joins, ownership checks, filtering, delete/update checks, frequent lookup queries.

**Current index backlog** (deferred to Level 2 — not critical for MVP, add after real slow-query evidence or `EXPLAIN ANALYZE`, or at >1000 users / >10 000 cards): see `docs/roadmap/backlog.md` → Level 2 → "Индексация БД" for the concrete list (`idx_decks_owner`, `idx_ucp_due_cards`, etc.).

## Current relationship snapshot

For the actual current entities, FKs, and constraints, always check `docs/database/relationships.md` — do not assume this reference reflects the live schema.
