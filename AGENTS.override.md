# Codex Adapter — LLHelper

This file is auto-loaded by Codex instead of the same-directory `AGENTS.md`. Read `AGENTS.md` once per run before task work, unless it is already in context. Apply its shared hard gates and documentation ownership, but ignore its `.windsurf/**` routing entries and use this adapter for Codex routing. Do not reread either root file during the same task.

## Routing

- Treat `.windsurf/**` as the Windsurf compatibility layer. Do not use it as the owner of Codex instructions and do not edit it unless the user explicitly requests a Windsurf change.
- Read `.agents/guidance/documentation-sync.md` when the task or current diff changes architecture, API behavior, database schema, security, a documented feature flow, frontend integration, tests, or roadmap progress. Pure read-only analysis and mechanical edits that change none of those owned facts do not require it.
- For backend work, read `backend/AGENTS.override.md` and follow its section-level instruction for `backend/AGENTS.md` before selecting scoped guidance or skills.
- For frontend work, read `frontend/AGENTS.override.md` and follow its section-level instruction for `frontend/AGENTS.md` before selecting scoped guidance.
- For entity, migration, relationship, foreign-key, index, constraint, or timestamp decisions, use `.agents/skills/database/SKILL.md`.
- For backend test-level or test-strategy decisions, use `.agents/skills/testing/SKILL.md`.
- Before creating a design, planning, audit, or decision document, use `.agents/skills/design-decision/SKILL.md` to find the existing normative owner first.
- For commit-readiness review, use `.agents/skills/pre-commit-review/SKILL.md`.
- For maintenance of the agent infrastructure itself, use `.agents/skills/ai-infrastructure-review/SKILL.md`.

Read only the relevant heading of `docs/roadmap/current-sprint.md` fresh whenever current sprint, level, scope, priority, or test timing matters; expand only if the question crosses sections. Never copy dynamic project state into static guidance or skills.
