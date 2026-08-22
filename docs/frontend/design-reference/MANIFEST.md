# Stitch Screen Manifest — CyberCognition LL Helper

Owner of exact Stitch screen resource IDs for every entry in the Canonical
Screen Registry in `docs/frontend/DESIGN.md`. `DESIGN.md` owns tokens,
navigation shell, and screen *names*; this file owns the resolved *resource
IDs* behind those names. Do not duplicate resource IDs into `DESIGN.md`, and
do not duplicate the token tables or shell rules from `DESIGN.md` into this
file.

**Canonical Stitch project:** `LL Helper Design System` — resource ID
`projects/8241473581937023308` (PUBLIC). Do not use `LingoDeck AI`
(`projects/3601588025628203579`) or any other project — see `DESIGN.md`
Source priority.

**Resolved via:** Stitch MCP (`mcp0_list_screens` / `mcp0_get_project`) on
2026-08-22. Re-resolve the manifest whenever a canonical screen is replaced,
regenerated, renamed, or materially changed in Stitch.

**Screen ID format:** each `Screen ID` below is the trailing segment only.
The full resource ID is `projects/8241473581937023308/screens/<Screen ID>`.

## How to read each entry

- **Flow** — product page/flow this screen belongs to.
- **Platform** — Desktop or Mobile.
- **Canonical name** — the slug from `DESIGN.md`'s Canonical Screen Registry.
- **Screen ID** — exact Stitch screen resource ID (`projects/8241473581937023308/screens/<id>`).
- **State** — UI state this screen instance represents, if applicable.
- **Purpose** — why this screen is referenced.
- **Warnings** — interpretation notes / naming drift / ambiguity.
- **Do not copy** — prototype behavior that must not be carried into production.

---

## Auth

### Login — `login_llhelper`

- Platform: Desktop
- Screen ID: `a7a9bbf0f06b4ce4823a38fd35ac0849`
- Stitch title: "Login - LLHelper"
- Purpose: visual reference for the login form layout only.
- Validation: frontend validation may mirror documented backend constraints for UX, including required fields, email format/length, and register password length. Backend validation and responses remain authoritative.
- Do not copy: raw Stitch HTML/JS; prototype-only credential checks.

### Register — `register_llhelper_refined`

- Platform: Desktop
- Screen ID: `b8c691aab5f94c62854de10febfc4a1f`
- Stitch title: "Register - LLHelper" (no "Refined" suffix in Stitch — naming drift, single unambiguous match, not a different screen)
- Purpose: visual reference for the register form layout only.
- Do not copy: raw Stitch HTML/JS; client-side-only validation as the source of truth for backend validation errors.

No separate mobile Login/Register reference exists. Use the desktop auth screens above as the content/visual reference and apply canonical responsive form/layout rules. Do not introduce a different mobile visual style.

## My Decks — Learning

### Learning (desktop shell) — `learning_llhelper_refined_navigation`

- Platform: Desktop
- Screen ID: `0cb72b02b5db416ea2f8e5b6b33a03cb`
- Stitch title: "Learning - LLHelper Refined MVP" (title drifted from the registry name after later edits in Stitch — same screen, not a different one)
- Purpose: canonical desktop sidebar + Learning tab layout reference.
- States found: `loading_state` → `1e7961cc60a04ae38b3caa66ffff0c36`; `api_error_state` → `0189efb46e3e43b8b507897f1ed95c04`; `empty_state` → `7b1ecb8bc1644f4b8e727449c11e566e` (Stitch title "Learning (Empty State) - Soft Surface Depth" — **state/layout reference only. `DESIGN.md` tokens, typography and application shell override the alternate visual theme.**).
- Do not copy: raw Stitch HTML/JS; any gamification/streak decoration not in `DESIGN.md`.

### Learning (mobile dashboard) — `learning_mobile_dashboard`

- Platform: Mobile
- Screen ID: `48477ef15ed64daeb0bf12cb3d8f8fcf`
- Stitch title: "Learning — Mobile Dashboard"
- Purpose: layout reference only. Per `DESIGN.md`, the page title must read **Learning** ("Dashboard" is Stitch internal naming, not product copy).
- States found: `loading_state` → `4e1f1dd85a7241f8b203043770210d24`; `api_error_state` → `bf694bc2ed3e41c599becdd220607d18`; `empty_state` → `a887cc6f03dd4b6699e58ba76658270f` ("Learning — Empty State (Mobile Refined)").
- Do not copy: the word "Dashboard" as visible product copy; raw Stitch HTML/JS.

## My Decks — Created

### Created Decks (desktop) — `created_decks_llhelper_refined_mvp`

- Platform: Desktop
- Screen ID: `9ed6baf88f8748c68dee4082ec6a5c31`
- Stitch title: "Created Decks - LLHelper Refined MVP"
- States found: `api_error_state` → `c12fdcbaff4e4a8bb5cab608841fdc5e`; `empty_state` → `6ef12dc0e96d4ac4acc333c420481898` ("Created Decks (Empty State) - LLHelper Refined").
- Do not copy: raw Stitch HTML/JS; ratings/likes/popularity badges on deck cards (excluded per `DESIGN.md`).

### Created Decks (mobile shell) — `created_decks_mobile_with_bottom_nav`

- Platform: Mobile
- Screen ID: `2588b0e2fa8c4bdc9eb27bb0462d8856`
- Stitch title: "Created Decks - Mobile with Bottom Nav"
- Purpose: **canonical mobile shell reference** — bottom nav order/labels, top header layout.
- States found: `api_error_state` → `b909ce2e83cc473d8e0565b18c194ece`; `empty_state` → `4ac98a6a78fa442193a1da411859ade7`; `loading_state` → `c4fcfe553ca4466db388967a669ba494`.
- Do not copy: raw Stitch HTML/JS; any bottom-nav item beyond the exact five in `DESIGN.md` (Learning, Created, Discover, Study, Progress); Settings destination.

## Create / Edit Deck

### Create Deck (desktop) — `create_deck_llhelper`

- Platform: Desktop
- Screen ID: `316d55fea52c4c0c9dd310cd3d503d04`
- Stitch title: "Create Deck - LLHelper"
- States found: `validation_error_state` → `22e2d42dcc26455784ceb583e30aea30`; `submission_error_state` → `e6d5d6fdb3ed40cda47504e1621e95ff`.
- Purpose: confirms the Private Deck / `isPrivate` control placement (`DESIGN.md` domain boundary).
- Do not copy: raw Stitch HTML/JS; any client-side-only deck-creation success state that isn't driven by the backend response.

### Create Deck (mobile) — `create_deck_refined_mobile_state`

- Platform: Mobile
- Screen ID: `5240c4fae5304c46ab191e32263c8bc8`
- Stitch title: "Create Deck — Refined Mobile State"
- Do not copy: raw Stitch HTML/JS.

### Edit Deck (desktop) — `edit_deck_llhelper_refined_1`

- Platform: Desktop
- Screen ID: `b4ba921c83ff451093153a41164070ab`
- Stitch title: "Edit Deck - LLHelper Refined"
- Do not copy: raw Stitch HTML/JS.

### Edit Deck (mobile) — `edit_deck_refined_mobile_state`

- Platform: Mobile
- Screen ID: `09f1d4e790ea4296938b95b95372a884`
- Stitch title: "Edit Deck — Refined Mobile State"
- Do not copy: raw Stitch HTML/JS.

## Deck Details

### Deck Details (Owner, desktop) — `deck_details_owner_llhelper_refined`

- Platform: Desktop
- Screen ID: `b713dd7ed4ae482ba0d1dddc4b91c31f`
- Stitch title: "Deck Details (Owner) - LLHelper Refined"
- States found: `api_error_state` → `7f45c3d2132046b39ecfff39a892d786`; `empty_state` → `2a52cd2db39445bcb9d7662e75fa8226`; `loading_state` → `6824accdee2b4c318950af1d2ead2e52`.
- Do not copy: any learning-progress UI on this screen — **Owner/Public Deck Details must not display learning progress** (`DESIGN.md` domain boundary); raw Stitch HTML/JS.

### Deck Details (Owner, mobile) — `deck_details_owner_mobile_2`

- Platform: Mobile
- Screen ID: `ccdfafe064aa4365ba041ed02607151b`
- Stitch title: "Deck Details (Owner) — Mobile"
- States found: `api_error_state` → `350c42b842964c4fa6748332714a62d6`; `empty_state` → `3487d49d5ba7464484f4891eec8c1c8e`; `loading_state` → `3fd36bb548eb463c8c3d55aa9af7cedf`.
- Do not copy: learning-progress UI; raw Stitch HTML/JS.

### Deck Details (Public, desktop) — `deck_details_public_llhelper_refined`

- Platform: Desktop
- Screen ID: `90c46e8a1e2946ad84fa8cffd3ecc210`
- Stitch title: "Deck Details (Public) - LLHelper Refined"
- Do not copy: learning-progress UI; ratings/likes/follow/bookmark UI without a backend contract; raw Stitch HTML/JS.

### Deck Details (Public, mobile) — `deck_details_public_mobile_refined`

- Platform: Mobile
- Screen ID: `06388e7896124660b6830e9291cb9f74`
- Stitch title: "Deck Details (Public) — Mobile Refined"
- Do not copy: learning-progress UI; ratings/likes/follow/bookmark UI without a backend contract; raw Stitch HTML/JS.

### Learning Deck Details (desktop) — `learning_deck_details_llhelper_refined`

- Platform: Desktop
- Screen ID: `3386e5e8e70b4cdbb18051e660b3da83`
- Stitch title: "Learning Deck Details - LLHelper Refined"
- Purpose: **separate enrolled-deck flow** from Owner/Public Deck Details — this is where `UserDeckProgress`/`UserCardProgress` UI belongs.
- Do not copy: raw Stitch HTML/JS; any client-side computation of mastery/progress numbers not sourced from the backend response.

### Learning Deck Details (mobile) — `learning_deck_details_mobile_refined_2`

- Platform: Mobile
- Screen ID: `cac865fc9ea94e2abcad0a2af3ac0922`
- Stitch title: "Learning Deck Details — Mobile Refined"
- Do not copy: raw Stitch HTML/JS; client-side progress computation.

## Add/Edit Card

### Add/Edit Card (desktop) — `add_edit_card_llhelper_refined`

- Platform: Desktop
- Screen ID: `3166a46c0529467f972671db8357463c`
- Stitch title: "Add/Edit Card - LLHelper Refined"
- States found: `ai_generation_loading_state` → `2260370d74d94d279e5662f4fdccede6`; `ai_generation_error_state` → `64cf5e689b9a4566b8f4376bc9102bfd`; `submission_error_state` → `e6d7a5851d2947ca96c41481becd0f0f`; `validation_error_state` → `7f79f0550f2041ff815c9604dabb44f5`.
- Do not copy: raw Stitch HTML/JS or embedded prompt-building JS for AI generation — AI generation logic is backend-owned (`docs/features/ai-generation-flow.md`).

### Add Card (mobile) — `add_card_mobile`

- Platform: Mobile
- Screen ID: `87e6c8d854a34b95829ea88d11997d2d`
- Stitch title: "Add Card — Mobile"
- Note: `1f9fcd44429c46b7abf14e3199b21609` ("Add Card — Refined Mobile State") is a non-canonical supplementary variant — its heading text is "Ephemeral Node", forbidden Node terminology per `DESIGN.md`. Do not use it as the base screen for `add_card_mobile` unless a future task explicitly selects it (see Non-canonical section).
- Do not copy: raw Stitch HTML/JS.

## Study

### Study: English B1 (desktop) — `study_english_b1_llhelper_refined`

- Platform: Desktop
- Screen ID: `28d18c4a73b547fb92fc949a6bc5d4a8`
- Stitch title: "Study: English B1 - LLHelper Refined"
- States found: `loading_state` → `b21ae87df0b646bc90ca84af7888d97e`; `study_all_caught_up` → `82a546b4a81049b9b92d144a0e00ba1c`; `study_session_complete` → `b1b0f012a4e142de90776804ae47f022`; API error variant → `a031c3ee82f1463f8aa29b77a7d3d96b` ("Study — API Error (Skeleton Overlay)", maps to `api_error_state` family).
- Purpose: study-card interaction layout reference only.
- Do not copy: raw Stitch HTML/JS; **any client-side exact-answer comparison** — study answer correctness always comes from the backend response (`DESIGN.md` domain boundary, `docs/features/learning-flow.md`); self-grading buttons as a source of truth.

### Study: English B1 (mobile) — `study_english_b1_mobile`

- Platform: Mobile
- Screen ID: `32b53362748742a19dfc7b4cc15b1a97`
- Stitch title: "Study: English B1 — Mobile"
- States found: `loading_state` → `2894882fd954456a8ffc5eda7e95fe65`; `study_session_complete` → `ae6e28fd937b4d2e8bf96fa1d7098745`; `study_all_caught_up` → `6d42f1332a8b409cb376c7b81cc6f4e8`; `api_error_state` → `b5f6562b8ff3464b8d1bd25f0390f510`.
- Do not copy: raw Stitch HTML/JS; client-side answer correctness; self-grading buttons as a source of truth.

## Discover

### Discover (desktop) — `discover_llhelper_refined`

- Platform: Desktop
- Screen ID: `97b05b9f24f84410845beb00803e26df`
- Stitch title: "Discover - LLHelper Refined"
- States found: `api_error_state` → `7d6fc47e2a4d487789efb22fe6ba0009`; `loading_state` → `5a3ee7028bcb4b7d9b8d3ecebfa41231`; `empty_state` → `c93b42eb746249e3b5f06cd7d2ec47e6` (Stitch title "Discover (No Results) - LLHelper Refined").
- Do not copy: raw Stitch HTML/JS; ratings/likes/popularity sort or badges — excluded per `DESIGN.md` until a backend contract exists.

### Discover (mobile) — `discover_mobile`

- Platform: Mobile
- Screen ID: `9aaf765ffdfb4a0595da18e8c28d0bb6`
- Stitch title: "Discover — Mobile"
- States found: `api_error_state` → `f87fd1a533a4495194720d6d3a3d065a`; `loading_state` → `6ab80ffecc5d40c6ac73f3684a6f764b`; `empty_state` → `6332e210465d47d58f011bc22a663d72` ("Discover (No Results) — Mobile").
- Do not copy: raw Stitch HTML/JS; ratings/likes/popularity UI.

## Creator Profile

### Creator Profile (desktop) — `creator_profile_llhelper_refined`

- Platform: Desktop
- Screen ID: `8df316a65ffe4ed9b54799830d854dad`
- Stitch title: "Creator Profile - LLHelper Refined"
- Do not copy: raw Stitch HTML/JS; **Follow button, follower counts, or any social behavior** — excluded per `DESIGN.md` without a backend contract.

### Creator Profile (mobile) — `creator_profile_mobile`

- Platform: Mobile
- Screen ID: `87d2a4d2e36940c6b8fb7299259a23a4`
- Stitch title: "Creator Profile — Mobile"
- Purpose: layout only, per `DESIGN.md` — **do not add Follow behavior**.
- Do not copy: raw Stitch HTML/JS; Follow button/follower counts.

## Progress

### Learning Progress (desktop) — `learning_progress_llhelper_mvp`

- Platform: Desktop
- Screen ID: `e13aff5d17fc4a1e8fece209220f277f`
- Stitch title: "Learning Progress - LLHelper MVP"
- States found: `api_error_state` → `b31bc072d6d34cc8bf38b8669cf1c9dd`; `empty_state` → `4c31e4fbed824d3e972ed3ef6ee6c792`; `loading_state` → `497786dcf61d42fe81c04e706284646c` ("Learning Progress — Loading State (Minimalist)" — **state/layout reference only. `DESIGN.md` tokens, typography and application shell override the alternate visual theme.**).
- Do not copy: raw Stitch HTML/JS; any progress number not sourced from `UserDeckProgress`/`UserCardProgress` backend data.

### Learning Progress (mobile) — `learning_progress_mobile_2`

- Platform: Mobile
- Screen ID: `786fef679a554769bdf277a497e261c9`
- Stitch title: "Learning Progress — Mobile"
- States found: `api_error_state` → `61efdd5100f7452eab64285063da4702`; `empty_state` → `0579e6f9cf6a4646b07247abe3b2dbc5`; `loading_state` → `0e6da83508d24bf9a569afe4b85bf2e5`.
- Do not copy: raw Stitch HTML/JS; client-side-computed progress numbers.

## Non-canonical screens found in the project (excluded)

The canonical Stitch project also contains screens with no entry in
`DESIGN.md`'s Canonical Screen Registry. These are **not** references for any
current product surface and must not be used:

- `e6350013fb8f43f18bea091ebee2c841` — "My Decks — Loading State" (desktop). "My Decks" is a sidebar accordion, not a standalone page, per `DESIGN.md` shell.
- `58719fc4cbc54eafa68277e1af62e185` — "Vocabulary Flashcard App" (mobile). Unrelated orphan screen, no corresponding registry entry.
- `1f9fcd44429c46b7abf14e3199b21609` — "Add Card — Refined Mobile State" (mobile). Non-canonical supplementary variant of `add_card_mobile` — its HTML heading reads "Ephemeral Node", forbidden Node terminology per `DESIGN.md`. Not the base screen; do not use unless a future task explicitly selects it.

## Summary

- All 26 canonical registry entries (14 desktop + 12 mobile) are resolved to
  an exact Stitch screen resource ID in the canonical project. None remain
  ambiguous.
- 2 naming-drift notes (screen exists, Stitch title text differs slightly
  from the registry slug, no ambiguity): `register_llhelper_refined`,
  `learning_llhelper_refined_navigation`.
- 3 non-canonical/orphan screens found in the project and excluded (see above), including one supplementary variant of `add_card_mobile`.
