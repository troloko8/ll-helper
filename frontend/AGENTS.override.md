# Codex Adapter — LLHelper Frontend

Codex auto-loads this file instead of the same-directory `frontend/AGENTS.md`. Read `frontend/AGENTS.md` → `Hard gates` once per run before frontend work unless it is already in context. Also read its `Before implementing... UI` or `Before implementing... API-facing code` section only when that branch applies. Its `Where to look` tables are Windsurf routes and are replaced below. Keep the root instructions already loaded; do not reread them.

Load only the guidance or normative document required by the task.

| Need | Read |
|------|------|
| FSD layer, slice, import, or public-API conventions | `.agents/guidance/frontend/fsd-conventions.md` |
| Frontend testing conventions or test-strategy review | `.agents/guidance/frontend/testing-conventions.md` |
| Documentation ownership and synchronization | `.agents/guidance/documentation-sync.md` |
| Detailed frontend conventions | `frontend/CONVENTIONS.md` |
| Design-system tokens, shell, and canonical screens | `docs/frontend/DESIGN.md` |
| Backend HTTP contract consumed by frontend | `docs/frontend/integration/BACKEND_CONTRACT_INVENTORY.md` |
| Screen routes, integration readiness, blockers, and MVP status | `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md` |

Apply FSD guidance when creating, moving, importing, or reviewing frontend code. Apply frontend testing guidance when writing or reviewing tests or deciding whether coverage is required.

For `DESIGN.md`, the backend inventory, and the frontend integration map, search headings or exact screen/route names first and read only the relevant entry plus necessary context. Do not load these large documents in full by default.
