---
trigger: model_decision
description: Use when creating, moving, or importing frontend code to enforce Feature-Sliced Design layer boundaries and slice conventions.
---

# FSD Conventions — Frontend

Mechanical rules for Pragmatic Feature-Sliced Design in `frontend/src/`.

## Layer dependency direction (hard gate)

```
app → pages → widgets → features → entities → shared
```

- A file in layer N may import from layer N+1 (lower) or deeper.
- A file in layer N must **never** import from a higher layer.
- Violations: `shared/` importing from `entities/`, `entities/` importing from `features/`, etc.

## Allowed layers

The only valid top-level directories under `src/` are:

```
app/  pages/  widgets/  features/  entities/  shared/
```

Do not create additional top-level FSD layers (e.g. `processes/`, `layouts/`, `routes/`, `styles/`, `api/`).
The legacy `src/api/` directory has been removed; do not recreate it.

## Domain code forbidden in shared

`shared/` must contain **only** business-agnostic code:
- UI primitives (Button, Input, Modal)
- Generic utilities (formatDate, cn)
- API base configuration
- Type utilities
- Constants (app-wide, non-domain)

**Forbidden in shared:** Deck, Card, User, Auth, Learning, Progress — any domain-specific logic, types, or components.

**`shared/api/` boundary:** May contain the `createApi` base instance, generic `fetchBaseQuery` configuration, a token-storage transport adapter (`getToken`/`setToken`/`clearToken` over `localStorage`), generic HTTP transport utilities (token attachment via adapter, error normalization), and business-agnostic transport types (`ApiError`, pagination metadata). Must **not** contain login/register/logout use cases, domain endpoint definitions, domain DTO types, or imports from `app/`/`features/`/`entities/`.

## Pages do not belong inside features

- `pages/` is a separate FSD layer.
- A feature slice must not contain a `pages/` segment.
- Features expose UI components and hooks; pages compose them into route-level views.

## Standard slice segments

A slice may contain these segments (use only what's needed):

| Segment | Purpose |
|---------|---------|
| `ui/` | React components |
| `api/` | RTK Query endpoint injection / API hooks |
| `model/` | Types, Redux slices, selectors, domain logic |
| `lib/` | Pure utility/helper functions for this slice |
| `index.ts` | Public API (required if slice is imported externally) |

Do not invent non-standard segments. If a concept doesn't fit, reconsider slice boundaries.

## Public APIs

- Every slice imported by another slice **must** export through `index.ts`.
- External code must import from the slice root (`@/entities/deck`), not internals (`@/entities/deck/model/types`).
- `shared/` sub-modules (`shared/ui`, `shared/lib`, `shared/api`) each expose their own `index.ts`.

## No premature/empty slices

- Do not create a slice directory until there is real product code to place in it.
- `.gitkeep` placeholder directories are acceptable only during initial scaffold; they do not satisfy "slice exists."
- If a slice has only empty sub-directories, it should not exist yet.

## Cross-slice access

- Features may depend on entities (e.g. `features/create-deck` imports `entities/deck` types).
- Features must not directly import other features. If shared logic is needed, extract to entities or shared.
- Widgets may compose features and entities.
- Pages may compose anything below them.
