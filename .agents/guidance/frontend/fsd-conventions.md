# FSD Conventions — Frontend

Apply these mechanical rules when creating, moving, importing, or reviewing code in `frontend/src/`.

## Dependency direction

```text
app → pages → widgets → features → entities → shared
```

A layer may depend only on lower layers. `shared` must not import from domain layers; `entities` must not import from `features`; and so on.

The only valid top-level directories under `src/` are `app/`, `pages/`, `widgets/`, `features/`, `entities/`, and `shared/`. Do not add `processes/`, `layouts/`, `routes/`, `styles/`, or a top-level `api/`. Do not recreate the removed legacy `src/api/`.

## Shared boundary

`shared/` contains business-agnostic UI primitives, utilities, base API transport, generic types, and app-wide non-domain constants. Deck, Card, User, Auth, Learning, and Progress logic or types belong in domain layers.

`shared/api/` may contain the base RTK Query API, generic `fetchBaseQuery` configuration, token-storage transport adapter, error normalization, and generic transport types. It must not contain auth use cases, domain endpoints or DTOs, or imports from `app`, `features`, or `entities`.

## Pages and slice segments

Pages belong in the `pages` layer, never inside a feature.

Use only the slice segments that are needed:

| Segment | Responsibility |
|---|---|
| `ui/` | React components |
| `api/` | RTK Query endpoint injection and hooks |
| `model/` | Types, Redux slices, selectors, domain logic |
| `lib/` | Pure helpers for the slice |
| `index.ts` | Public API when imported externally |

Do not invent segments to avoid reconsidering a slice boundary.

## Public APIs and slice creation

- A slice imported externally must export through `index.ts`.
- Import from a slice root, not its internals.
- `shared/ui`, `shared/lib`, and `shared/api` expose their own public APIs.
- Create a slice only when real product responsibility and code exist; do not create empty placeholder slices.
- `.gitkeep` directories are acceptable only during the initial scaffold. They do not make a slice real, and an otherwise empty slice must not remain after scaffolding.

## Cross-slice access

- Features may depend on entities.
- Features must not import other features directly; move shared domain logic to an entity or business-agnostic logic to shared.
- Widgets may compose features and entities.
- Pages may compose all lower layers.
