---
description: Review changed files before commit according to LL Helper roadmap, architecture rules, documentation sync policy, tests, and Postman impact.
---

# Pre-commit Review Workflow

Review the current git diff.

Context (read only what's relevant): `docs/roadmap/current-sprint.md` (always read fresh — never assume from memory), `docs/roadmap/roadmap.md` (only if scope/level/milestone impact), `docs/architecture/current-architecture.md`, `docs/database/relationships.md`, `docs/features/learning-flow.md`, `docs/features/ai-generation-flow.md`, `backend/CONVENTIONS.md`, `backend/IMPROVEMENTS.md`, `backend/AGENTS.md`.

## 1. Roadmap alignment

Read `docs/roadmap/current-sprint.md` fresh now. **Treat the `## Sprint X.Y` header in that file as the single runtime source of truth for the current sprint. Do not edit the header. Do not use `roadmap.md`, `changelog.md`, or `backlog.md` to "correct" the sprint number; `roadmap.md` is only for level and Done Criteria.**

Verify: is this change part of the current sprint? Does it accidentally pull in later-level scope (check `roadmap.md`)? Does it complete a current-sprint task or done criterion? Output: `Current sprint: <Sprint X.Y — ...>`, sprint/level impact, completed tasks, `current-sprint.md` updates needed (task/criterion status only — never the sprint number).

## 2. Code review

Check: correctness, unnecessary complexity, duplicated logic, broken naming, missing validation, missing ownership checks (`backend/AGENTS.md` Hard gates), bad transaction boundaries, entity leakage from API, controller business logic, service responsibility violations, repository misuse. Output: critical issues, recommended fixes, optional improvements.

## 3. Architecture & documentation sync

Documentation is part of the source code — if the change affects package structure, controller/service/repo/entity/DTO/mapper layout, request lifecycle, auth flow, learning flow, AI generation flow, API surface, or DB model, the owning doc must be updated in the same commit. Use `.windsurf/rules/documentation-sync.md` as the routing table (which doc owns which fact) instead of re-deriving it here.

Output: documentation files changed, documentation files missing, documentation not needed because...

## 4. API / Postman impact

If the change affects endpoints, HTTP methods, request/response DTOs, auth requirements, status codes, validation errors, or error response shape: `LLHelper.postman_collection.json` must be updated, and the API Surface section of `current-architecture.md` may need an update.

Output: Postman update required (y/n), API docs update required (y/n), exact endpoints affected.

## 5. Database impact

Use `docs/database/relationships.md` as the current snapshot. If the change affects entities, JPA annotations, columns, constraints, indexes, cascade/orphanRemoval, soft delete, migrations, ID-only logical references, or copy-vs-reference decisions:

Output: DB impact (y/n), `relationships.md` update needed (y/n), migration needed now vs deferred to a later sprint (check `current-sprint.md`), risk (orphaned data / FK violation / duplicate rows / slow query / security issue).

## 6. Tests impact

Check whether tests are needed for: service logic, learning progress transitions, AI parser, validation, exception handling, ownership/security checks, repository queries. Output: existing tests affected, new tests recommended, minimum tests before commit.

## 7. Final commit readiness verdict

Return one of:

- ✅ Ready to commit
- ⚠️ Ready after small fixes
- ❌ Not ready to commit

Use this format:

```text
Verdict:
Reason:

Required before commit:
1.
2.
3.

Optional after commit:
1.
2.
```

### Suggested commit message

If verdict is **✅ Ready to commit**, generate a Conventional Commits message:

```
type(scope): brief description

- Specific, technical bullet per change
- ...

Fixes Sprint X.Y Task #N (if applicable)
```

**Type:** `feat`/`fix`/`refactor`/`docs`/`test`/`chore`/`perf`/`style`.
**Scope:** module name (`security`, `learning`, `ai`, `deck`, `card`, `api`, `db`, `arch`, ...).
**Guidelines:** imperative mood, first line ≤72 chars, reference the sprint task if applicable, mark `BREAKING CHANGE:` if any, mention updated docs if the documentation-sync rule triggered.

Output: suggested commit message (if ready), brief explanation of type/scope choice.