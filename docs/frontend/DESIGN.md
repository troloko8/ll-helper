# Frontend Design Contract — CyberCognition LL Helper

Normative UI/design source of truth for the frontend. Owns design tokens, the
application shell (desktop + mobile navigation), the canonical Stitch screen
registry, domain/UI boundaries, and the minimum reusable UI pattern set.

This document does not prescribe component implementation details, CSS
architecture mechanics, or routing internals — see `frontend/CONVENTIONS.md`
for those. Do not duplicate the token tables or screen registry from this file
into `AGENTS.md`, `frontend/AGENTS.md`, `frontend/CONVENTIONS.md`,
architecture docs, or sprint docs; those files must reference this document
instead.

## Source priority

When sources conflict, resolve in this order:

1. **Real backend HTTP contracts and documented domain behavior** are
   authoritative for behavior (see `docs/architecture/current-architecture.md`
   §11 and `docs/features/learning-flow.md` / `docs/features/ai-generation-flow.md`).
2. **This document (`docs/frontend/DESIGN.md`)** is authoritative for
   frontend UI rules: tokens, navigation shell, screen registry, reusable
   patterns.
3. **Selected canonical Stitch screens** (see Canonical Screen Registry below)
   are visual references only.
4. **Raw Stitch HTML/JavaScript** is prototype code only. It must never be
   copied as production architecture or behavior — no Tailwind, no raw DOM
   structure, no embedded JS logic.

## Product and brand

- **Formal product name:** CyberCognition LL Helper.
- **Authenticated shell wordmark:** LLHelper.
- **Brand mark:** Material Symbols `psychology` icon.
- **Visual direction:** Precise & Technical — dark slate interface accented
  with Electric Cyan, Data Blue, and Logic Purple.
- No alternate branding, wordmark, or old Stitch theme may be used.

## Canonical design tokens

Semantic tokens below are normative. Implement as CSS variables in
`shared/ui/` per `frontend/CONVENTIONS.md` (UI/Styling section); do not
hardcode hex values in components.

### Surfaces

| Token | Value |
|---|---|
| `surface` / `background` | `#0b1326` |
| `surface-container-lowest` | `#060e20` |
| `surface-container-low` | `#131b2e` |
| `surface-container` | `#171f33` |
| `surface-container-high` | `#222a3d` |
| `surface-container-highest` | `#2d3449` |

### Text / outlines

| Token | Value |
|---|---|
| `on-surface` / `on-background` | `#dae2fd` |
| `on-surface-variant` | `#b9cacb` |
| `outline` | `#849495` |
| `outline-variant` | `#3b494b` |

### Primary

| Token | Value |
|---|---|
| `primary` | `#dbfcff` |
| `on-primary` | `#00363a` |
| `primary-container` | `#00f0ff` |
| `surface-tint` / `primary-fixed-dim` | `#00dbe9` |

### Canonical active navigation

| Token | Value |
|---|---|
| `secondary-container` | `#4a8eff` |
| `on-secondary-container` | `#00285b` |

The active navigation item (desktop sidebar or mobile bottom nav) always uses
this pair. No other active-state color combination is canonical.

### Error

| Token | Value |
|---|---|
| `error` | `#ffb4ab` |
| `error-container` | `#93000a` |

### Typography

- **Geist** — headings, body text, forms, buttons, explanations, validation
  messages.
- **JetBrains Mono** — compact metadata only: counters, data labels, badges.
- Navigation labels use natural casing. Never uppercase navigation text.

### Spacing / layout

- **Baseline unit:** 4px.
- **Gutter / mobile margin:** 16px.
- **Desktop page margin:** 32px.
- **Max content width:** 1440px.
- **Desktop sidebar width:** 260px.
- Radii are small and precise. Avoid pill shapes and heavy shadows.

## Application shell

> **Level 1 vertical MVP scoping note (Phase 0.4C):** the full five-destination
> shell below (desktop sidebar and mobile bottom navigation) remains the
> canonical post-vertical target and the canonical Stitch screens are not
> changed by this note. For the Level 1 vertical MVP, the implemented
> authenticated navigation is a temporary reduced subset: only **Learning** is
> a persistent destination. **Created**, **Discover**, and **Progress** are
> fully hidden (not shown disabled/"coming soon"). **Create Deck** is reached
> via a CTA on the Learning screen (e.g. its empty state), not via a
> persistent "Created" destination. **Study** is reached contextually from
> Learning Deck Details (`/study/:deckId`), not as a standalone persistent nav
> item, since a deck-less `/study` entry has no defined product behavior at
> Level 1. No route in the reduced shell is a clickable dead link. See
> `docs/roadmap/current-sprint.md` for the accepted Level 1 MVP scope.

### Desktop

- One persistent, fixed 260px left sidebar containing:
  - **My Decks** accordion with **Learning** and **Created** children;
  - **Discover**;
  - **Study**;
  - **Progress**.
- The canonical active state always uses `secondary-container` (`#4a8eff`) /
  `on-secondary-container` (`#00285b`).
- Authenticated page content starts after the same fixed sidebar offset
  (260px) on every authenticated route.

### Mobile

- Compact top header.
- Fixed bottom navigation with exactly these five destinations, in this
  order: **Learning, Created, Discover, Study, Progress**.
- No horizontal scrolling anywhere in the mobile shell.
- The desktop sidebar must never be squeezed into the mobile layout.
- **Settings is not a destination** in the current canonical navigation
  (desktop or mobile).

## Domain / UI boundaries

These are hard rules for any UI built against this contract:

- **Deck** and **Card** are content. They carry no per-user learning state.
- **UserDeckProgress** and **UserCardProgress** are learning state, distinct
  from content.
- **Owner/Public Deck Details** must not display learning progress.
- **Enrolled/Learning Deck Details** is a separate screen/flow from
  Owner/Public Deck Details.
- **Study answer correctness comes from the backend response.** The frontend
  must never implement client-side exact-answer comparison as the source of
  truth for correctness.
- **Create/Edit Deck** includes the Private Deck / `isPrivate` control.

See `docs/features/learning-flow.md` for the backend-owned progress/answer
model these boundaries are derived from.

## Canonical screen registry

**Canonical Stitch project:** `LL Helper Design System` — resource ID
`projects/8241473581937023308`. Do not use any other Stitch project (e.g.
`LingoDeck AI`) as a reference.

The following named Stitch screens are the approved visual references for
each product surface. Any screen not listed here has no canonical visual
reference yet — do not invent one; ask before designing ad hoc.

Exact Stitch screen resource IDs behind each name below are owned by
`docs/frontend/design-reference/MANIFEST.md` and must not be duplicated here.

### Desktop references

- `login_llhelper`
- `register_llhelper_refined`
- `onboarding_profile_setup_llhelper`
- `learning_llhelper_refined_navigation`
- `created_decks_llhelper_refined_mvp`
- `create_deck_llhelper`
- `edit_deck_llhelper_refined_1`
- `deck_details_owner_llhelper_refined`
- `deck_details_public_llhelper_refined`
- `learning_deck_details_llhelper_refined`
- `add_edit_card_llhelper_refined`
- `study_english_b1_llhelper_refined`
- `discover_llhelper_refined`
- `creator_profile_llhelper_refined`
- `learning_progress_llhelper_mvp`

### Mobile references

- `created_decks_mobile_with_bottom_nav` — canonical mobile shell.
- `complete_your_profile_mobile_base`
- `learning_mobile_dashboard` — layout reference; page title must be
  **Learning**.
- `create_deck_refined_mobile_state`
- `edit_deck_refined_mobile_state`
- `deck_details_owner_mobile_2`
- `deck_details_public_mobile_refined`
- `learning_deck_details_mobile_refined_2`
- `add_card_mobile`
- `study_english_b1_mobile`
- `discover_mobile`
- `creator_profile_mobile` — layout only; do not add Follow behavior.
- `learning_progress_mobile_2`

### State naming families to preserve

- `loading_state`
- `api_error_state`
- `empty_state`
- `validation_error_state`
- `submission_error_state`
- `username_conflict_state`
- `submitting_state`
- `ai_generation_loading_state`
- `ai_generation_error_state`
- `study_all_caught_up`
- `study_session_complete`

## Reusable UI patterns (minimum expected)

- `AppShell`
- `DesktopSidebar`
- `MobileHeader`
- `MobileBottomNavigation`
- `Button` — variants: primary, secondary, danger, loading, disabled
- `Input` / `Textarea` / `Select` — states: default, focus, error, disabled
- `DeckCard` — variants: learning, created, public
- `StatusBadge`
- Thin `ProgressBar`
- `CardInventory` — desktop table / mobile list
- `Skeleton`
- `PageState` / `InlineError` / `ApiErrorPresentation`
- Destructive confirmation dialog

Do not prescribe a large generic component library beyond this list in
advance; extend it only when a real product screen requires a new reusable
pattern.

## Non-canonical (explicitly excluded)

The following must not appear in production frontend UI/architecture:

- Any alternate `DESIGN.md` theme other than this document.
- Tailwind as production styling (see `frontend/CONVENTIONS.md` — CSS Modules
  + semantic CSS variables is the styling strategy).
- Raw Stitch JavaScript.
- Node/Dataset/Protocol terminology.
- Client-side answer correctness as a source of truth.
- Self-grading buttons as a source of truth for study results.
- Ratings, likes, popularity counts, follower counts, and Follow behavior.
- Bookmark/favorites behavior without a backing backend contract.
- Settings in the current main navigation.
- The old desktop sidebar squeezed into mobile.
- Light-theme mobile state variants.
