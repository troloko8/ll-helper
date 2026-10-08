# Current Sprint

> Level 2 — Product Completion. Full roadmap: `docs/roadmap/roadmap.md`.
> Completed Sprint 1.0 evidence: `docs/roadmap/changelog.md`. Future release
> work and deferred tasks: `docs/roadmap/backlog.md`.

## Sprint 1.1 — Full Frontend

**Goal:** complete the agreed product frontend before deciding whether LLHelper
needs a public deployment. Sprint 1.0 proved the end-to-end flow; this sprint
turns that vertical slice into a complete, coherent application rather than
starting hosting, HTTPS, Docker, or release operations prematurely.

**Starting point (2026-10-08):** Sprint 1.0 is complete: Register → Complete
Profile → Created → Discover → Enroll → Learning → Study → persisted progress
→ Logout/Login works locally through the UI. Its evidence is recorded in
`docs/roadmap/changelog.md`.

**Scope boundary:** public deployment is explicitly out of scope. The existing
deployment checklist stays in `docs/roadmap/backlog.md` as a future, optional
release gate after the frontend is complete and its purpose is agreed. Local
production builds and the existing Nginx syntax check remain useful developer
checks, but do not start hosting or imply a public release.

### Product surfaces

- [ ] Implement Card Details and the complete Card Editor: view at
  `/decks/:deckId/cards/:cardId`, edit at
  `/decks/:deckId/cards/:cardId/edit`, and delete from Owner Deck Details,
  with truthful loading, validation, error and destructive-confirmation states.
- [ ] Implement Edit Deck at `/decks/:deckId/edit`, including prefill,
  validation, visibility mapping, save and delete behavior.
- [ ] Complete Discover: search, filters, sorting and pagination/load-more;
  add only controls backed by an agreed API contract.
- [ ] Implement Creator Profile and its public-deck collection at
  `/creators/:username`.
- [ ] Implement the aggregate Progress dashboard across a user's decks at
  `/progress`.

### Stitch fidelity and state coverage

- [ ] Audit every canonical screen in
  `docs/frontend/design-reference/MANIFEST.md` against the implementation and
  repair material layout, navigation or responsive gaps. Desktop and mobile
  references are one feature, not separate optional pages.
- [ ] Implement or verify the explicit state matrix from the manifest:
  loading, API error and empty/no-results states for Learning, Created,
  Discover, Owner Deck Details and Progress; validation, conflict, submitting
  and submission-error states for the relevant forms; and loading, API error,
  all-caught-up and session-complete states for Study.
- [ ] Use responsive adaptations where Stitch has no mobile reference (Card
  Details and Edit Deck); do not treat the missing mobile Edit Deck asset as
  permission to omit the mobile experience.
- [ ] Do not promote prototype-only social controls, ratings, likes, follows or
  bookmarks into product scope without a separate accepted API/product decision.

### Session, learning and content experience

- [ ] Define and implement a `currentUser` freshness/invalidation policy.
- [ ] Add refresh-token and backend-logout behavior with a documented browser
  session contract.
- [ ] Complete learning scheduling (`nextReviewAt`) and expose any required UI
  state without changing learning semantics implicitly.
- [ ] Implement bulk AI generation and an actionable partial-failure UX.
- [ ] Resolve remaining content/learning list pagination contracts before a UI
  depends on them.

### Supporting product work

- [ ] Implement only the backend endpoints, DTOs, validation and tests needed
  by the selected frontend surface; update their normative API and feature
  documentation in the same change.
- [ ] Keep all implemented routes reachable through the application shell,
  responsive and keyboard-accessible, with loading, empty, error and retry
  states.
- [ ] Add proportionate frontend and backend regression coverage as each
  surface is completed.
- [ ] Reconcile this checklist against `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md`
  before starting each surface; record newly accepted scope there rather than
  inventing uncontracted UI.

## ✅ Done Criteria (Full Frontend)

- [ ] Every canonical Stitch page and state in the manifest is implemented,
  verified as already complete, or explicitly re-scoped by an accepted product
  decision.
- [ ] Every shipped frontend surface has an honest API contract, responsive
  behavior and loading/empty/error states.
- [ ] Authenticated session behavior, content editing, Discover, creator and
  aggregate-progress paths are usable through visible UI navigation.
- [ ] Relevant automated checks and manual UI regressions pass.
- [ ] The product is reviewed as a complete local application before any
  decision to enter the optional public-release gate.

Detailed future release work and non-current technical debt remain in
`docs/roadmap/backlog.md`.
