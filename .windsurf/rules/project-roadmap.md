---
trigger: always_on
description: 
globs: 
---

# Project Roadmap Rule

Always use these project control documents when relevant:

- `docs/roadmap/LL_Helper_Project_Roadmap.md` — project direction and current level
- `docs/architecture/current-architecture.md` — current backend architecture snapshot
- `docs/database/relationships.md` — current database/entity relationship snapshot
- `docs/features/learning-flow.md` — current learning flow snapshot
- `docs/features/ai-generation-flow.md` — current AI generation flow snapshot

Use `docs/architecture/current-architecture.md` as the current backend architecture snapshot.

Use `docs/database/relationships.md` as the current database/entity relationship snapshot.

Do not assume ideal architecture or ideal database design if these documents say otherwise.

Current level is Level 0 — Stable Backend Foundation.

Sprint 0.1 (Architecture Freeze) is COMPLETE.

Current sprint: **Sprint 0.2 — Backend Cleanup**.

When proposing tasks, architecture, tests, APIs, docs, or refactoring, align suggestions with the current roadmap level.

Do not suggest Level 2, Level 3, or Level 4 features unless the user explicitly asks for future planning.

For the current stage (Sprint 0.2), prioritize:

1. 🔴 Ownership check (only deck owner can create/generate cards)
2. GlobalExceptionHandler (AI exceptions, 403, 404, 409, 429)
3. UserDeck/UserCard model check
4. Copy vs reference decision (document only)
5. DTO cleanup
6. Mapper layer
7. Entity leakage removal
8. Validation
9. RateLimiter reset bug fix
10. validateBulkSize() call in CardServiceImpl
11. Bulk failure logging