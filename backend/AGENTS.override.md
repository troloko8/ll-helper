# Codex Adapter — LLHelper Backend

Codex auto-loads this file instead of the same-directory `backend/AGENTS.md`. Read only `backend/AGENTS.md` → `Hard gates` once per run before backend work unless it is already in context. Its `Where to look` table is the Windsurf route and is replaced by the table below. Keep the root instructions already loaded; do not reread them.

Load only the guidance, skill, reference, or normative document required by the task.

| Need | Read |
|------|------|
| JPA entity conventions | `.agents/guidance/backend/entity-conventions.md` |
| Liquibase migration conventions | `.agents/guidance/backend/liquibase-conventions.md` |
| MapStruct conventions | `.agents/guidance/backend/mapstruct-conventions.md` |
| Backend test conventions | `.agents/guidance/backend/testing-conventions.md` |
| Cross-cutting entity + migration, FK, index, cascade, constraint, or timestamp decisions | `.agents/skills/database/SKILL.md` |
| Test strategy and test-level decisions | `.agents/skills/testing/SKILL.md` |
| Documentation ownership and synchronization | `.agents/guidance/documentation-sync.md` |

Apply the scoped guidance whenever the task creates, modifies, reviews, or reasons about the matching file or concern. Use a skill's references progressively; do not load all references by default.
