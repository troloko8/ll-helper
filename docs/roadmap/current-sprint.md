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

- [ ] Implement Card Details and the complete Card Editor: view, edit and
  delete cards from Owner Deck Details, with truthful loading, validation,
  error and destructive-confirmation states.
- [ ] Implement Edit Deck, including prefill, validation, visibility mapping,
  save and delete behavior.
- [ ] Complete Discover: search, filters, sorting and pagination/load-more;
  add only controls backed by an agreed API contract.
- [ ] Implement Creator Profile and its public-deck collection.
- [ ] Implement the aggregate Progress dashboard across a user's decks.
- [ ] Complete the remaining product metadata and interactions that have an
  approved design and contract: topic/level metadata, cover imagery and
  bookmarks/social surfaces where they remain in the accepted frontend scope.

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

- [ ] The deferred product routes and interactions above are implemented or
  explicitly re-scoped by an accepted product decision.
- [ ] Every shipped frontend surface has an honest API contract, responsive
  behavior and loading/empty/error states.
- [ ] Authenticated session behavior, content editing, Discover, creator and
  aggregate-progress paths are usable through visible UI navigation.
- [ ] Relevant automated checks and manual UI regressions pass.
- [ ] The product is reviewed as a complete local application before any
  decision to enter the optional public-release gate.

Detailed future release work and non-current technical debt remain in
`docs/roadmap/backlog.md`.
