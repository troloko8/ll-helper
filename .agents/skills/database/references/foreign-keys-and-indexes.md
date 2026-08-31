# Foreign Keys and Indexes

Use this reference for relationship-policy and indexing decisions. For migration syntax, follow `.agents/guidance/backend/liquibase-conventions.md`.

## Cascade or restrict

Default to `RESTRICT`. Use `CASCADE` only when the child has no independent business value and the parent strictly owns its lifecycle.

Do not cascade deletion of users, learning progress, payments, bids, audits/history, or other business records unless an explicit deletion policy is documented. Prefer soft delete or `RESTRICT` while user-facing deletion policy remains unsettled.

Existing precedents must be verified against `docs/database/relationships.md` before relying on them:

- Deck to cards: cascade was accepted because cards have no independent lifecycle outside a deck.
- User to deck/card learning progress: cascade was accepted because progress has no meaning without the user.
- Auth user to profile and user to owned deck historically used non-cascading behavior pending an explicit account/deck deletion policy.

## When to add an index

PostgreSQL does not automatically index child-side FK columns. Consider an index for frequent joins, ownership checks, filtering, parent delete/update checks, and lookup queries.

Do not treat a historical backlog threshold as the current plan. Read the relevant scope heading of `docs/roadmap/current-sprint.md` and open `docs/roadmap/backlog.md` only when future indexing work is relevant. Use query evidence such as `EXPLAIN ANALYZE` when performance is the reason.

For actual current entities, constraints, and indexes, search `docs/database/relationships.md` and read the relevant entry and policy section rather than the full document.
