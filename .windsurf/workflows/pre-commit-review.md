---
description: Review changed files before commit according to LL Helper roadmap, architecture rules, documentation sync policy, tests, and Postman impact.
---

# Pre-commit Review Workflow

Review the current git diff.

Use these documents as context if available:

- `docs/roadmap/LL_Helper_Project_Roadmap.md`
- `docs/architecture/current-architecture.md`
- `docs/database/relationships.md`
- `docs/features/learning-mode.md`
- `docs/process/documentation-sync.md`
- `backend/CONVENTIONS.md`
- `backend/IMPROVEMENTS.md`
- `backend/AGENTS.md`

## 1. Roadmap alignment

Check whether the change matches the current roadmap level.

Current focus: Level 0 — Stable Backend Foundation.

Verify:

- Is this change part of the current sprint?
- Does it accidentally introduce Level 1/2/3/4 scope?
- Does it complete any roadmap task?
- Should any roadmap checkbox be updated?

Output:

- Current roadmap level impact
- Completed roadmap tasks
- Roadmap updates needed

## 2. Code review

Review changed code for:

- correctness
- unnecessary complexity
- duplicated logic
- broken naming
- missing validation
- missing ownership checks
- bad transaction boundaries
- entity leakage from API
- controller business logic
- service responsibility violations
- repository misuse

Output:

- Critical issues
- Recommended fixes
- Optional improvements

## 3. Architecture impact

Check whether the change affects:

- package structure
- domain modules
- controller/service/repository/entity/DTO/mapper structure
- request lifecycle
- authentication flow
- learning flow
- AI generation flow
- API surface
- database model

If yes, say which architecture docs must be updated.

Required docs may include:

- `docs/architecture/current-architecture.md`
- `docs/database/relationships.md`
- `docs/features/learning-mode.md`
- `backend/AGENTS.md`
- `backend/CONVENTIONS.md`

## 4. Documentation sync check

Documentation is part of the source code.

If code changes affect architecture, API, database schema, learning logic, AI generation, security, or roadmap progress, related markdown documentation must be updated in the same task.

Check:

- Were architecture docs updated if architecture changed?
- Were DB docs updated if entities/relations changed?
- Was learning-mode doc updated if learning logic changed?
- Was roadmap updated if a task was completed?
- Was improvements/backlog updated if a new issue was found?
- Was conventions doc updated if a new project convention appeared?

Output:

- Documentation files changed
- Documentation files missing
- Documentation not needed because...

## 5. API / Postman impact

Check whether the change affects:

- endpoints
- HTTP methods
- request DTOs
- response DTOs
- auth requirements
- status codes
- validation errors
- error response shape

If yes:

- `LLHelper.postman_collection.json` must be updated
- Current API Surface in `current-architecture.md` may need update

Output:

- Postman update required: yes/no
- API docs update required: yes/no
- Exact endpoints affected

## 6. Database impact

Check whether the change affects:

- entities
- table names
- column names
- foreign keys
- unique constraints
- indexes
- cascade behavior
- orphanRemoval
- soft delete
- migrations

If yes:

- `docs/database/relationships.md` must be updated
- Flyway migration may be required
- roadmap/database tasks may need update

Output:

- DB impact: yes/no
- Migration needed: yes/no
- Relationships doc update needed: yes/no

## 7. Tests impact

Check whether tests are needed for:

- service logic
- learning progress transitions
- AI parser
- validation
- exception handling
- ownership/security checks
- repository queries

Output:

- Existing tests affected
- New tests recommended
- Minimum tests before commit

## 8. Final commit readiness verdict

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