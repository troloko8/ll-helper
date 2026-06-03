---
trigger: always_on
description: 
globs: 
---

# Documentation Sync Rule

Before making any code change, check whether the change affects project documentation.

If the change affects architecture, API, database schema, learning flow, AI flow, security, package structure, or roadmap progress, the corresponding markdown documentation must be updated in the same change.

## Documentation that must stay in sync

- `docs/architecture/current-architecture.md`
- `docs/database/relationships.md`
- `docs/features/learning-flow.md`
- `docs/features/ai-generation-flow.md`
- `docs/roadmap/LL_Helper_Project_Roadmap.md`
- `backend/IMPROVEMENTS.md`
- `backend/CONVENTIONS.md`
- `backend/AGENTS.md`
- `LLHelper.postman_collection.json` when API changes

## When to update `current-architecture.md`

Update this file when the change affects:

- package structure
- domain modules
- controller/service/repository/entity/DTO/mapper structure
- request lifecycle
- authentication flow
- learning flow
- AI generation flow
- known architecture issues
- accepted/open decisions
- current API surface
- technology stack

## When to update `relationships.md`

Update this file when the change affects:

- entities
- table names
- foreign keys
- cascade behavior
- orphanRemoval
- unique constraints
- indexes
- delete behavior
- soft delete behavior
- copy vs reference decision
- JPA annotations: `@OneToOne`, `@OneToMany`, `@ManyToOne`, `@ManyToMany`
- `@JoinColumn`
- `@Column(nullable = ...)`
- `@Table(uniqueConstraints = ...)`
- `@Check`
- `@ColumnDefault`
- enum storage strategy
- ID-only logical references such as `Long userId`, `Long cardId`, `Long deckId`
- service logic that depends on relationships
- enroll/review queries
- delete behavior even if implemented only in service layer

If a change affects entities or database relationships, do not update only `current-architecture.md`.

Also check whether `docs/database/relationships.md` must be updated.

## When to update `learning-flow.md`

Update this file when the change affects:

- enroll flow
- study cards selection
- review logic
- progress calculation
- status transitions
- answer checking strategy
- spaced repetition intervals
- UserDeckProgress / UserCardProgress behavior

## When to update `ai-generation-flow.md`

Update this file when the change affects:

- AI card generation logic
- prompt template
- OpenAI provider implementation
- rate limiting behavior
- bulk generation flow
- AI error handling
- AI configuration properties
- ownership checks for card creation/generation

## When to update Roadmap

Update the roadmap when:

- a task from a sprint is completed
- a task is moved to another sprint
- a new task is discovered
- an open decision is resolved
- a done criterion becomes true
- project scope changes

Do not silently leave roadmap tasks outdated.

Use markdown task checkboxes:

- `[ ]` for not done
- `[x]` for done
- `[~]` or `In progress:` only if the file convention supports it

Prefer checkboxes over strikethrough for completed tasks.

Bad:

~~Add mapper layer~~

Good:

- [x] Add mapper layer

## Before editing code

Ask internally:

1. Does this change affect architecture?
2. Does this change affect API?
3. Does this change affect DB schema?
4. Does this change affect learning flow?
5. Does this change affect AI generation flow?
6. Does this complete or change a roadmap task?
7. Does this require Postman update?
8. Does this require tests?

If yes, update the relevant docs together with the code.

## Output requirement

When finishing a task, always report:

1. Code files changed
2. Documentation files changed
3. Tests added/updated
4. Postman updated or not needed
5. Roadmap updated or not needed

If documentation was not updated, explain why.