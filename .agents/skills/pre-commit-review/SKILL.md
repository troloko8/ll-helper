---
name: pre-commit-review
description: Review the current LLHelper Git diff for commit readiness against sprint scope, architecture, documentation sync, API/Postman, database, security, and testing requirements. Do not commit or push.
---

# Pre-commit Review

Review the real current Git state. Do not modify files unless the user separately asks for fixes. Never commit or push as part of this skill.

## Collect and scope the diff

Collect staged, unstaged, and untracked files. Read `docs/roadmap/current-sprint.md` fresh. Load only the normative documents connected to changed behavior; use `.agents/guidance/documentation-sync.md` as the ownership router.

## Review dimensions

### Sprint and level

Treat the single `## Sprint X.Y` header in `docs/roadmap/current-sprint.md` as the runtime source of truth. Do not rewrite that header based on another roadmap file or conversation memory.

Check whether the diff belongs to the current sprint, accidentally pulls later-level scope forward, completes a task or Done Criterion, or needs a task-status update. Read `docs/roadmap/roadmap.md` only when level scope or Done Criteria matter.

Report the current sprint title, scope impact, completed task/criterion, and any status update needed without inventing a sprint change.

### Code and security

Review correctness, unnecessary complexity, duplicated logic, naming, validation, authorization/ownership, transaction boundaries, entity leakage, controller business logic, service responsibility, and repository misuse. Apply the root, backend, and frontend `AGENTS` gates relevant to changed paths.

Report critical issues, required fixes, and optional improvements separately.

### Architecture and documentation

For every changed architecture, package, API, DB, security, flow, frontend-integration, or roadmap fact, identify the normative owner through `.agents/guidance/documentation-sync.md`. Report documentation changed, documentation missing, or why no documentation update is required.

### API and Postman

If endpoints, methods, DTOs, auth, status codes, validation errors, or error shape changed, check `LLHelper.postman_collection.json`, `docs/frontend/integration/BACKEND_CONTRACT_INVENTORY.md`, affected entries in `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md`, and the API surface in `docs/architecture/current-architecture.md` where applicable.

Report whether each update is required and list exact endpoints.

### Database

If entities, mappings, columns, constraints, indexes, cascade/orphan removal, soft delete, migrations, ID-only references, or copy/reference policy changed, use `.agents/skills/database/SKILL.md` to load only the necessary guidance.

Report database impact, whether `docs/database/relationships.md` needs an update, whether a migration is required now or deferred by current scope, and integrity/security/performance risks.

### Tests

Check required coverage for service logic, learning transitions, parsers, validation, exception mapping, ownership/security, repository queries, and critical frontend behavior. Use `.agents/skills/testing/SKILL.md` for backend test-level decisions.

Report affected tests, missing tests, and the minimum coverage required before commit.

## Verdict

Return exactly one readiness level:

- `✅ Ready to commit`
- `⚠️ Ready after small fixes`
- `❌ Not ready to commit`

Use this shape:

```text
Verdict:
Reason:

Required before commit:
1.

Optional after commit:
1.
```

If ready, suggest a Conventional Commits message with an imperative subject of at most 72 characters, an appropriate type/scope, technical bullets when useful, sprint-task reference only when established by the current sprint, and `BREAKING CHANGE:` only when applicable. Mention synchronized documentation when that work is part of the diff.
