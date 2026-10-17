# Frontend Naming Conventions

This document is the source of truth for frontend variable, function,
parameter, and domain-term naming. Structural naming for files, exports, hooks,
and constants remains in `frontend/CONVENTIONS.md`.

## Core rule

Name an identifier by its domain role and, when useful, its processing state.
The reader should understand what the value represents without reconstructing
that meaning from its type or distant call sites.

Prefer:

- `rawTitlesText` over `data`, `value`, or `text` when it contains the bulk input;
- `normalizedTitle` over `title` while describing a normalization step;
- `titleEntry` over `item` when iterating parsed title records;
- `duplicateCount` over `count`;
- `bulkTitlesResult` over `result` when the value crosses more than a few lines;
- `sourceLineIndex` over `index` when the original position matters.

## Processing states

Use state qualifiers only when they distinguish real stages of a transformation:

```text
rawTitle -> normalizedTitle -> validatedTitle
rawTitlesText -> preparedTitleEntries -> submittedTitles
```

Do not add `raw`, `normalized`, `validated`, `current`, or `final` when there is
no competing state in the same scope.

## Collections, booleans, counters, and units

- Use plural nouns for collections: `titleEntries`, `validationErrors`.
- Name collection elements with the singular domain term: `titleEntry`.
- Name booleans as states or questions and use a semantic boolean prefix:
  `is` for a state (`isLimitExceeded`, `isValid`), `has` for possession or
  presence (`hasDuplicates`), and `can` for capability (`canSubmit`).
- State what a number counts: `duplicateCount`, `visibleEntryCount`.
- Include units when they are not inherent: `timeoutMs`, `fileSizeBytes`.

## Generic names

Avoid `data`, `item`, `value`, `object`, `temp`, `result`, and `draft` when a
domain-specific name would add information.

These names are acceptable in a narrow scope when the meaning is already
unambiguous. Framework-owned properties may keep their framework names and be
aliased at the boundary:

```ts
const { data: deck, error: deckError } = useGetDeckQuery(deckId)
const parseResult = prepareBulkTitles(rawTitlesText)
```

Use `draft` only for a value whose unfinished, user-editable nature is important
to the behavior, and qualify it with the domain when needed, such as
`cardDraft`. For the multiline bulk input, prefer `rawTitlesText` because it
describes both the content and its pre-processing state.

## Functions and events

- Use verb phrases for functions: `prepareBulkTitles`, `removeTitleEntry`.
- Name event handlers `handle<Action>` inside a component and callbacks
  `on<Action>` in its public props.
- Name actions as completed domain events where that matches the state change:
  `bulkTitlesInputUpdated`, `bulkGenerationRequested`.
- Do not use `handleData`, `processValue`, or similar names that hide the action.

## Consistency and refactoring

- Reuse the same domain term across types, state, UI props, tests, and API
  adapters unless a boundary intentionally uses different terminology.
- Prefer a small consistent vocabulary over synonyms such as `entry`, `item`,
  and `record` for the same concept.
- Do not rename framework contracts, backend DTO fields, or public API fields
  merely to satisfy local style; translate or alias them at the boundary.
- Naming-only refactors must preserve behavior and update affected tests and
  public exports atomically.
- Do not perform repository-wide renames without a scoped task and verification.

## Bulk title vocabulary

Use these terms consistently in the bulk card generation feature:

| Meaning | Preferred name |
|---|---|
| Multiline textarea content before parsing | `rawTitlesText` |
| One untrimmed source line | `rawTitleLine` |
| Trimmed title used for validation | `normalizedTitle` |
| Case-insensitive deduplication key | `titleDeduplicationKey` |
| Parsed title with source position | `titleEntry` |
| Collection ready for preview or submission | `preparedTitleEntries` |
| Titles captured for a request | `submittedTitles` |
| Result of preparing the input | `preparedTitles` or `preparationResult` |
| Original zero-based line position | `sourceLineIndex` |
| Number of excluded duplicates | `duplicateCount` |

Choose one of the listed alternatives within a scope and keep it consistent.
