---
description: Review changed files before commit according to LL Helper roadmap, architecture rules, documentation sync policy, tests, and Postman impact.
---

# Pre-commit Review Workflow

Review the current git diff.

Use these documents as context if available:

- `docs/roadmap/LL_Helper_Project_Roadmap.md`
- `docs/architecture/current-architecture.md`
- `docs/database/relationships.md`
- `docs/features/learning-flow.md`
- `docs/features/ai-generation-flow.md`
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
- missing ownership checks (only deck owner can create/generate cards — see `AGENTS.md` Ownership Rule)
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
- `docs/features/learning-flow.md`
- `backend/AGENTS.md`
- `backend/CONVENTIONS.md`

## 4. Documentation sync check

Documentation is part of the source code.

If code changes affect architecture, API, database schema, learning logic, AI generation, security, or roadmap progress, related markdown documentation must be updated in the same task.

Check:

- Were architecture docs updated if architecture changed?
- Were DB docs updated if entities/relations changed?
- Was `docs/features/learning-flow.md` updated if learning logic changed (enroll flow, study selection, review, status transitions, answer checking)?
- Was roadmap updated if a task was completed?
- Was improvements/backlog updated if a new issue was found?
- Was conventions doc updated if a new project convention appeared?
- If security/ownership rules changed in code, was `backend/AGENTS.md` Ownership Rule section updated?
- If new module/package created, was `docs/architecture/current-architecture.md` package tree updated?

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

Use `docs/database/relationships.md` as the current DB relationship snapshot.

Check whether the changed code affects:

- entities
- JPA annotations
- table names
- column names
- nullable fields
- defaults
- primary keys
- foreign keys
- unique constraints
- indexes
- check constraints
- enum values
- cascade settings
- orphanRemoval
- soft delete
- migrations
- ID-only logical references
- copy vs reference decision

If yes:

- `docs/database/relationships.md` must be updated
- Liquibase migration may be required
- roadmap/database tasks may need update

Output:

- DB impact: yes/no
- `docs/database/relationships.md` update needed: yes/no
- Migration needed now: yes/no
- Migration should be deferred to Sprint 0.3: yes/no
- Risk: orphaned data / FK violation / duplicate rows / slow query / security issue

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
```

### Suggested commit message

If verdict is **✅ Ready to commit**, generate a commit message following Conventional Commits format:

**Format:**
```
type(scope): brief description

- Bullet point describing change 1
- Bullet point describing change 2
- Bullet point describing change 3

Fixes Sprint X.Y Task #N (if applicable)
```

**Type options:**
- `feat`: new feature
- `fix`: bug fix
- `refactor`: code restructuring without behavior change
- `docs`: documentation only
- `test`: adding/updating tests
- `chore`: tooling, dependencies, config
- `perf`: performance improvement
- `style`: code style/formatting

**Scope examples:**
- `security` — auth, ownership, permissions
- `learning` — enroll, study, review flow
- `ai` — card generation, OpenAI integration
- `deck` — deck CRUD operations
- `card` — card CRUD operations
- `api` — endpoint/DTO changes
- `db` — entity/schema changes
- `arch` — architecture/structure changes

**Guidelines:**
- First line max 72 chars
- Use imperative mood: "add", not "added" or "adds"
- Bullet points should be specific and technical
- Reference Sprint task if change completes/fixes roadmap item
- Include breaking changes with `BREAKING CHANGE:` prefix if needed
- Mention updated docs if documentation-sync rule triggered

**Example:**
```
feat(security): add ownership check for card operations

- Add SecurityUtils.getCurrentUserId() (returns User.id, not AuthUser.id)
- Ownership check: create/update/delete/bulk-generate cards (deck owner only)
- Replace CardServiceImpl.getCurrentUserId() with SecurityUtils
- Replace LearningServiceImpl.getCurrentUserId() with SecurityUtils
- Add @EntityGraph to CardDescRepository.findWithOwnerById()
- Add Postman test case for 403 ownership violation
- Update IMPROVEMENTS.md: JWT userId claim now HIGH priority

Fixes Sprint 0.2 Task #1
```

Output:

- Suggested commit message (if ready to commit)
- Brief explanation of type/scope choice