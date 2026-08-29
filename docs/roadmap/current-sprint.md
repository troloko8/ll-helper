# Current Sprint

> Level 1 — Vertical Full-Stack Flow. Полный план: `docs/roadmap/roadmap.md`. Задачи вне текущего спринта: `docs/roadmap/backlog.md`. Завершённые спринты: `docs/roadmap/changelog.md`.

## Sprint 1.0 — Vertical Flow

**Цель:** Впервые связать frontend, backend, auth и database в одну живую систему. Один вертикальный сценарий (accepted, Phase 0.4C) — Register → Complete Profile → authenticated app → Create Deck → Manual Add Card → Owner Deck Details → Public Deck Details → Enroll → Learning list/details → Study → per-card progress → повторное открытие Learning list и продолжение позже. Login проверяется отдельно как повторный вход существующего пользователя, а не как обязательный шаг сразу после регистрации: clear/logout local session → Login → Learning list → continue. UI может быть простым; цель — не красивый Dashboard, а работающий full-stack flow.

**Группа 0: Frontend scaffold & foundation**

- [x] Создать React/TS приложение (Vite scaffold).
- [x] Установить зависимости: Redux Toolkit, React Router, React Hook Form, Zod, Vitest.
- [x] Утвердить архитектурные решения (FSD, state ownership, API layer, auth, routing, UI, testing).
- [x] Создать frontend AI-context инфраструктуру (`frontend/AGENTS.md`, `frontend/CONVENTIONS.md`, `.windsurf/rules/`).
- [x] **Technical Foundation:** Нормализован scaffold (path aliases, `strict: true`, Vite proxy, `.env.example`), legacy Axios удалён, testing infrastructure настроена (Vitest + jsdom + RTL + MSW).
- [x] Настроить RTK Query base API (`shared/api/`).
- [x] Настроить Redux store с session slice (`entities/session/`) и RTK Query middleware.
- [x] Настроить React Router (centralized config, layout routes, protected routes).
- [ ] Базовые формы: Login, Register, Create Deck.

**Группа 1: Auth flow**

- [ ] Login / Register экраны и валидация.
- [ ] Complete Profile экран (`/onboarding/profile`, новый) — требует Stitch-задачу, см. § "Phase 0.4C — принятые решения" ниже.
- [ ] Session с 4 состояниями: `initializing | anonymous | needsProfile | authenticated`.
- [ ] Обработка 401/403/validation errors на frontend (зависит от backend G-03).
- [ ] Сохранение токена и редирект после auth.

**Группа 2: Deck & cards flow**

- [ ] Create deck screen (`/decks/new`).
- [ ] Owner Deck Details (`/decks/:deckId/manage`).
- [ ] Manual Add Card screen (`/decks/:deckId/cards/new`) — Level 1 требование.
- [ ] Public Deck Details + Enroll (`/decks/:deckId`) — достижим только по прямой ссылке (Discover отложен); требует Stitch-действие "View public page" на Owner Deck Details.
- [ ] Single-card AI generation — **optional, отдельная задача после manual smoke**, не в этой группе.
- [ ] ~~AI generate cards screen~~ / ~~Deck list / deck details view~~ — заменено на точный список выше (Phase 0.4C); Created Decks list — deferred.

**Группа 3: Study flow**

- [ ] Learning list (`/learning`) — требует backend G-06.
- [ ] Learning Deck Details (`/learning/:deckId`) — показывает backend-provided per-card progress + frontend-derived per-deck counts (см. Phase 0.4C § Progress semantics).
- [ ] Enroll in deck (через Public Deck Details).
- [ ] Study screen (`/study/:deckId`, достижим только контекстно из Learning Deck Details): карточки, submit answer, see result — требует backend G-08 (`REVIEWING` включён в выборку).
- [ ] ~~Progress view (отдельный экран)~~ — aggregate Progress dashboard deferred (Phase 0.4C); progress показывается внутри Learning Deck Details.

**Группа 4: End-to-end smoke**

- [ ] Ручной прогон (основной flow): register → complete profile → authenticated app → create deck → manual add card → owner deck details → public deck details → enroll → learning list/details → study → per-card progress → повторное открытие learning list и продолжение позже.
- [ ] Ручной прогон (повторный вход, отдельно от регистрации): clear/logout local session → login → learning list → continue.
- [ ] Обновить `LLHelper.postman_collection.json` и `LLHelper.postman_environment.json` по необходимости.
- [ ] Проверить CORS и base API URL.

**Группа 5: Documentation**

- [x] Обновить `docs/architecture/current-architecture.md` — frontend architecture section added.
- [ ] Обновить `docs/features/learning-flow.md` при изменениях flow/UX.
- [ ] Обновлять `docs/roadmap/current-sprint.md` по ходу.

## ✅ Done Criteria (Level 1)

- [ ] Есть frontend
- [ ] Можно зарегистрироваться и завершить Complete Profile
- [ ] Можно создать deck
- [ ] Можно создать card вручную (manual add card — обязательно для Level 1; AI generation не является обязательным Level 1 criterion — optional отдельной задачей после manual smoke)
- [ ] Можно подписаться / enroll на deck через Public Deck Details
- [ ] Можно пройти study flow
- [ ] Per-card progress сохраняется и отображается на Learning Deck Details (отдельный aggregate Progress dashboard не требуется для Level 1)
- [ ] Можно выйти (logout/clear session), войти повторно через Login и продолжить через Learning list
- [ ] Основные endpoint flows проходят через Postman
- [ ] Есть AI workflow prompts
- [ ] Проектом можешь пользоваться ты сам

**Приоритет выполнения:**

1. Группа 0 (scaffold & foundation) — scaffold ✅, Technical Foundation ✅ (см. Группа 0 выше)
2. Группа 1 (auth) — Phase 0.4 завершена (см. ниже); runtime frontend больше не заблокирован самим аудитом, но **последовательно зависит от бэкенд/Stitch-пререквизитов** — см. § "Ordered backend → Stitch → frontend tasks" ниже.
3. Группа 2 (decks/cards)
4. Группа 3 (study)
5. Группа 4 (end-to-end smoke)
6. Группа 5 (docs)

## Phase 0.4 — Global Frontend Integration Audit

**Статус: ✅ завершена** (Phase 0.4A/0.4B/0.4C — documentation/audit-only; runtime code unchanged). Runtime frontend feature implementation ещё не начата — см. упорядоченные задачи ниже.

- [x] Phase 0.4A — Backend Contract Inventory (`docs/frontend/integration/BACKEND_CONTRACT_INVENTORY.md`) — repository-grounded аудит контроллеров, DTO, security и error contract.
- [x] Phase 0.4B — Frontend Integration Map (`docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md`) — screen-by-screen карта всех 26 canonical Stitch references → candidate route → backend contract → readiness (6 ready / 7 partial / 11 blocked / 2 provisionally deferred).
- [x] Phase 0.4C — принятые решения: exact Level 1 vertical MVP, route map, Register→Complete Profile flow, session-модель, navigation scoping, Progress semantics, blocker categorization (vertical vs release/security vs deferred), backend → Stitch → frontend order. См. `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md` §0 для полного текста решений.

### Phase 0.4C — принятый Level 1 vertical MVP

**MVP surfaces:** Login, Register, Complete Profile (новый, Stitch ещё не создан), Learning list, Create Deck, Owner Deck Details, Manual Add Card, Public Deck Details + Enroll, Learning Deck Details, Study.

Полный exact route map, Register → Complete Profile flow, session-модель/bootstrap, navigation scoping, Progress semantics и deferred surfaces — accepted decisions, нормативно владеют:
- Route map, flow, Progress semantics → `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md` §0 (routes §0.3, session bootstrap §0.7, Progress §0.8).
- Session/routing architecture (implemented vs target) → `frontend/CONVENTIONS.md`.
- Navigation/UI shell scoping → `docs/frontend/DESIGN.md`.
- Deferred surfaces/capabilities → `docs/roadmap/backlog.md` и map §0.2/§0.4.

### Phase 0.4C — backend blockers (не реализованы; полный контекст и deferred capabilities — map §0.4)

**Vertical implementation blockers** (нужны для локального single-user smoke):
- [ ] G-01 `GET /api/v1/users/me`
- [ ] G-03 контролируемый 401 для expired/malformed/invalid JWT
- G-02 Register → Complete Profile orchestration — разбито на подзадачи:
  - [x] Product decision: отдельный экран Complete Profile принят (Phase 0.4C).
  - [x] Backend `POST /users` уже существует (`USER-01`, без изменений).
  - [ ] Complete Profile Stitch (desktop/mobile/validation/conflict/submitting) — см. §0.5.
  - [ ] Frontend onboarding orchestration (`/onboarding/profile` → `POST /users` → `/learning`, `needsProfile` session state).
  - [ ] End-to-end Register → Profile verification (ручной smoke).
- [ ] G-06 Learning Decks list endpoint
- [ ] G-08 Study selection должен включать `REVIEWING`
- [x] G-12 `docs/features/learning-flow.md` исправлен (409, не 403)

G-05 — не vertical-блокер, но стоит рано в порядке (шаг 2 ниже) как security-приоритет для Owner/Public trust boundary.

**Public deployment/security blockers** (обязательны до первого публичного deployment):
- [ ] G-04 unfiltered `GET /api/v1/decks`
- [ ] `CARD-04` unfiltered `GET /api/v1/cards`
- [ ] G-05 (полная реализация) private visibility protection для `GET /decks/{id}` и `GET /cards/{id}`
- [ ] Catch-all `500` не должен возвращать raw exception message

### Ordered backend → Stitch → frontend tasks

1. Backend: G-01, G-03, G-06, G-08.
2. Backend security (рано): G-05.
3. ~~Documentation correction G-12~~ — выполнено (`docs/features/learning-flow.md`).
4. Stitch: Complete Profile (desktop/mobile/validation/conflict/submitting) + Owner→Public "View public page" action (должен быть виден только для `isPublic=true`).
5. Frontend: Auth + onboarding (`needsProfile` session state).
6. Frontend: Learning list + Learning Deck Details.
7. Frontend: Create Deck + Owner Deck Details.
8. Frontend: Manual Add Card.
9. Frontend: Public Deck Details + Enroll.
10. Frontend: Study + per-card progress display.
11. E2E ручной smoke + Postman sync.
12. Release hardening: G-04, `CARD-04`, G-05 verification (если уже закрыт на шаге 2 — только regression-проверка, не повторная реализация), безопасное тело 500.
13. Первый deployment.
14. Optional: single-card AI generation отдельной задачей, после manual smoke; не блокирует шаг 13.
