# Current Sprint

> Level 1 — Vertical Full-Stack Flow. Полный план: `docs/roadmap/roadmap.md`. Задачи вне текущего спринта: `docs/roadmap/backlog.md`. Завершённые спринты: `docs/roadmap/changelog.md`.

## Sprint 1.0 — Vertical Flow

**Цель:** Впервые связать frontend, backend, auth и database в одну живую систему. Один вертикальный сценарий (accepted, Phase 0.4C) — Register → Complete Profile → authenticated app → Create Deck → Manual Add Card → Owner Deck Details → Public Deck Details → Enroll → Learning list/details → Study → per-card progress → повторное открытие Learning list и продолжение позже. Login проверяется отдельно как повторный вход существующего пользователя, а не как обязательный шаг сразу после регистрации: clear/logout local session → Login → Learning list → continue. UI может быть простым; цель — не красивый Dashboard, а работающий full-stack flow.

**Группа 0: Frontend scaffold & technical foundation**

- [x] Создать React/TS приложение (Vite scaffold).
- [x] Установить зависимости: Redux Toolkit, React Router, React Hook Form, Zod, Vitest.
- [x] Утвердить архитектурные решения (FSD, state ownership, API layer, auth, routing, UI, testing).
- [x] Создать frontend AI-context инфраструктуру (`frontend/AGENTS.md`, `frontend/CONVENTIONS.md`, `.windsurf/rules/`).
- [x] **Technical Foundation:** Нормализован scaffold (path aliases, `strict: true`, Vite proxy, `.env.example`), legacy Axios удалён, testing infrastructure настроена (Vitest + jsdom + RTL + MSW).
- [x] Настроить RTK Query base API (`shared/api/`).
- [x] Настроить Redux store с session slice (`entities/session/`) и RTK Query middleware.
- [x] Настроить начальный React Router scaffold: centralized config и базовый `ProtectedRoute`. Полное дерево маршрутов, layouts и guards остаются в Группе 1.

**Группа 0A: Minimal UI and application-boundary foundation — выполнить до feature-компонентов**

- [x] Реализовать canonical CSS variables из `docs/frontend/DESIGN.md`.
- [x] Подключить canonical Geist / JetBrains Mono typography, reset и application background styles.
- [ ] Реализовать shared-примитивы `Button`, `Input`, `Textarea`, `Select` и `FormField`.
- [ ] Реализовать канонические состояния загрузки/ошибки: `Skeleton`, `PageState` и `InlineError`.
- [ ] Стандартизировать семантическую разметку форм: связка label/control/error, keyboard focus, `aria-describedby`/`aria-live`, field error, disabled/loading и async error.
- [ ] Реализовать общий error-presentation contract: global 401 teardown; feature/page-level `403/404/409/429/5xx` через `PageState`/`InlineError`; field validation через `FormField`.
- [ ] Добавить базовое responsive-поведение для Auth и Onboarding экранов.
- [ ] Добавить глобальный application Error Boundary и router-level error surface.
- [ ] Добавить blocking session-bootstrap state вместо пустого экрана и базовый `404 Not Found` route.

**Группа 1: Auth flow**

- [ ] Реализовать contract-first Auth/User API foundation:
  - [ ] Инжектировать RTK Query endpoints для `AUTH-01`, `AUTH-02`, `USER-01` и `USER-07` в соответствующих feature/entity slices.
  - [ ] Описать request/response DTO строго по `BACKEND_CONTRACT_INVENTORY.md`; не хранить `UserResponse` в session slice.
  - [ ] Реализовать React Hook Form + Zod schemas по фактическим backend constraints.
  - [ ] Отобразить `400` field validation, `401` bad credentials, `409` email/username conflict и `429` rate limit; `404 → needsProfile` применять только к `GET /users/me`.
- [ ] Реализовать Login / Register экраны и валидацию.
- [ ] Реализовать Complete Profile (`/onboarding/profile`) по canonical Stitch references.
- [ ] Реализовать session lifecycle:
  - [ ] Session с 4 состояниями: `initializing | anonymous | needsProfile | authenticated`.
  - [ ] Session bootstrap через `GET /api/v1/users/me`: `200` → `authenticated`; `404` → `needsProfile`; `401` → clear token → `anonymous`.
  - [ ] Реализовать public/auth, onboarding и authenticated route layouts/guards: `initializing` показывает blocking `PageState`; `anonymous` допускается к `/login` и `/register`; `needsProfile` — только к `/onboarding/profile`; `authenticated` — к product routes.
  - [ ] Реализовать `/` → `/learning`; authenticated пользователь на auth/onboarding routes также перенаправляется в `/learning`.
  - [ ] При logout/401 очищать token, session state и RTK Query cache через `baseApi.util.resetApiState()`.
- [ ] Реализовать Auth + onboarding orchestration:
  - [ ] Register → сохранить token → `needsProfile` → Complete Profile (`POST /users`) → `authenticated` → `/learning`.
  - [ ] Login → сохранить token → `GET /users/me`: `200` → `/learning`; `404` → `/onboarding/profile`; `401` → очистить session → `/login`.
  - [ ] Complete Profile validation/conflict сохраняет валидную token/session и позволяет повторить отправку.
  - [ ] Logout является локальным Level 1 flow: очистить token/session/API cache → `/login`; backend logout остаётся deferred.
- [ ] Покрыть MSW + RTL тестами bootstrap, refresh with token, Register/Profile/Login/Logout orchestration, redirects, `400/401/409/429` и очистку cache между пользователями.

**Группа 1A: Reduced authenticated application shell — выполнить до Learning screens**

- [ ] Реализовать `AppShell` как authenticated layout.
- [ ] Для Level 1 оставить только `Learning` как persistent destination; `Created`, `Discover` и `Progress` полностью скрыть.
- [ ] Реализовать согласованное desktop/mobile responsive-поведение без dead links; не строить полный post-vertical shell заранее.

**Группа 2: Learning read flow**

- [ ] Learning list (`/learning`) — backend G-06 готов; frontend ещё не реализован.
- [ ] Learning Deck Details (`/learning/:deckId`) — показывает backend-provided per-card progress + frontend-derived per-deck counts (см. Phase 0.4C § Progress semantics).

**Группа 3: Deck & card authoring flow**

- [ ] Create deck screen (`/decks/new`).
- [ ] После готовности `/decks/new` добавить рабочий Create Deck CTA на Learning screen; до этого не показывать dead link.
- [ ] Owner Deck Details (`/decks/:deckId/manage`).
- [ ] Manual Add Card screen (`/decks/:deckId/cards/new`) — Level 1 требование.
- [ ] Single-card AI generation — **optional, отдельная задача после manual smoke**, не в этой группе.
- [ ] ~~AI generate cards screen~~ / ~~Deck list / deck details view~~ — заменено на точный список выше (Phase 0.4C); Created Decks list — deferred.

**Группа 4: Public deck, enroll & study flow**

- [ ] Public Deck Details + Enroll (`/decks/:deckId`) — достижим только по прямой ссылке (Discover отложен); отдельный переход с Owner Deck Details не требуется.
- [ ] Enroll in deck через Public Deck Details.
- [ ] Study screen (`/study/:deckId`, достижим только контекстно из Learning Deck Details): карточки, submit answer, see result — backend G-08 готов (`LEARNING` → `REVIEWING` → `NEW`, max 10; `MASTERED` исключён).
- [ ] После готовности `/study/:deckId` добавить контекстный Study CTA на Learning Deck Details; отдельный persistent Study destination не создавать.
- [ ] ~~Progress view (отдельный экран)~~ — aggregate Progress dashboard deferred (Phase 0.4C); progress показывается внутри Learning Deck Details.

**Группа 5: End-to-end smoke**

- [ ] Ручной прогон (основной flow): register → complete profile → authenticated app → create deck → manual add card → owner deck details → public deck details → enroll → learning list/details → study → per-card progress → повторное открытие learning list и продолжение позже.
- [ ] Ручной прогон (повторный вход, отдельно от регистрации): clear/logout local session → login → learning list → continue.
- [ ] Обновить `LLHelper.postman_collection.json` и `LLHelper.postman_environment.json` по необходимости.
- [ ] Проверить CORS и base API URL.

**Группа 6: Documentation**

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

1. Группа 0 (technical scaffold) — выполнена; затем Группа 0A (minimal UI/application boundaries).
2. Группа 1 (Auth + onboarding).
3. Группа 1A (reduced authenticated shell).
4. Группа 2 (Learning read flow).
5. Группа 3 (Deck/Card authoring).
6. Группа 4 (Public Deck + Enroll + Study).
7. Группа 5 (end-to-end smoke).
8. Группа 6 (docs).

## Phase 0.4 — Global Frontend Integration Audit

**Статус: ✅ завершена** (Phase 0.4A/0.4B/0.4C — documentation/audit-only; runtime code unchanged). Runtime frontend feature implementation ещё не начата — см. упорядоченные задачи ниже.

- [x] Phase 0.4A — Backend Contract Inventory (`docs/frontend/integration/BACKEND_CONTRACT_INVENTORY.md`) — repository-grounded аудит контроллеров, DTO, security и error contract.
- [x] Phase 0.4B — Frontend Integration Map (`docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md`) — screen-by-screen карта всех 26 canonical Stitch references → candidate route → backend contract → readiness. После закрытия G-06: 8 ready / 7 partial / 9 blocked / 2 deferred.
- [x] Phase 0.4C — принятые решения: exact Level 1 vertical MVP, route map, Register→Complete Profile flow, session-модель, navigation scoping, Progress semantics, blocker categorization (vertical vs release/security vs deferred), backend → Stitch → frontend order. См. `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md` §0 для полного текста решений.

### Phase 0.4C — принятый Level 1 vertical MVP

**MVP surfaces:** Login, Register, Complete Profile, Learning list, Create Deck, Owner Deck Details, Manual Add Card, Public Deck Details + Enroll, Learning Deck Details, Study.

Полный exact route map, Register → Complete Profile flow, session-модель/bootstrap, navigation scoping, Progress semantics и deferred surfaces — accepted decisions, нормативно владеют:
- Route map, flow, Progress semantics → `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md` §0 (routes §0.3, session bootstrap §0.7, Progress §0.8).
- Session/routing architecture (implemented vs target) → `frontend/CONVENTIONS.md`.
- Navigation/UI shell scoping → `docs/frontend/DESIGN.md`.
- Deferred surfaces/capabilities → `docs/roadmap/backlog.md` и map §0.2/§0.4.

### Phase 0.4C — backend blockers (статус выполнения; полный контекст и deferred capabilities — map §0.4)

**Vertical implementation blockers** (нужны для локального single-user smoke):
- [x] G-01 `GET /api/v1/users/me` — JWT-protected session bootstrap возвращает `200 UserResponse` для существующего профиля, `404 {"message": ...}` для валидного JWT без профиля и общий контролируемый `401 {"message":"Authentication required"}` для отсутствующего/invalid/expired/malformed JWT.
- [x] G-03 контролируемый 401 для expired/malformed/invalid JWT — `JwtAuthenticationFilter` перехватывает `JwtException`/`IllegalArgumentException`, очищает `SecurityContext` и делегирует в общий `RestAuthenticationEntryPoint`; тот же `{"message":"Authentication required"}` 401, что и при отсутствующем токене. Подтверждено `JwtSecurityFilterChainTest` (реальный `SecurityFilterChain`).
- G-02 Register → Complete Profile orchestration — разбито на подзадачи:
  - [x] Product decision: отдельный экран Complete Profile принят (Phase 0.4C).
  - [x] Backend `POST /users` уже существует (`USER-01`, без изменений).
  - [x] Complete Profile Stitch (desktop/mobile/validation/conflict/submitting) — canonical references зарегистрированы в `docs/frontend/DESIGN.md` и `docs/frontend/design-reference/MANIFEST.md`.
  - [ ] Frontend onboarding orchestration (`/onboarding/profile` → `POST /users` → `/learning`, `needsProfile` session state).
  - [ ] End-to-end Register → Profile verification (ручной smoke).
- [x] G-06 Learning Decks list endpoint — `GET /api/v1/learning/decks`: только `ACTIVE` enrollment текущего пользователя, batch progress aggregation, Continue/Start ordering по `lastStudiedAt`/`enrolledAt`, V11 `enrolled_at` + индекс `(user_id, status)`.
- [x] G-08 Study selection включает `REVIEWING`: приоритет `LEARNING` → `REVIEWING` → `NEW`, детерминированная сортировка по `card.id` внутри статуса, max 10; `MASTERED` исключён. Подтверждено service unit tests.
- [x] G-12 `docs/features/learning-flow.md` исправлен (409, не 403)

G-05 закрыт: `GET /decks/{id}` и `GET /cards/{id}` используют общий `DeckAccessPolicy`; public и owner-private чтение разрешено, чужой private контент возвращает контролируемый 403. Подтверждено service unit tests и `@WebMvcTest`.

**Public deployment/security blockers** (обязательны до первого публичного deployment):
- [ ] G-04 unfiltered `GET /api/v1/decks`
- [ ] `CARD-04` unfiltered `GET /api/v1/cards`
- [x] G-05 private visibility protection для `GET /decks/{id}` и `GET /cards/{id}`
- [ ] Catch-all `500` не должен возвращать raw exception message

### Ordered backend → Stitch → frontend tasks

1. ~~Backend: G-01, G-03, G-06, G-08~~ — выполнено.
2. ~~Backend security: G-05~~ — выполнено.
3. ~~Documentation correction G-12~~ — выполнено (`docs/features/learning-flow.md`).
4. ~~Stitch: Complete Profile (desktop/mobile/validation/conflict/submitting).~~ — выполнено.
5. Frontend: минимальный UI/application-boundary фундамент — подробный checklist в **Группе 0A**.
6. Frontend: Auth + onboarding — подробный checklist в **Группе 1**.
7. Frontend: reduced authenticated `AppShell` — подробный checklist в **Группе 1A**.
8. Frontend: Learning list + Learning Deck Details — **Группа 2**.
9. Frontend: Create Deck + Owner Deck Details — **Группа 3**.
10. Frontend: Manual Add Card — **Группа 3**.
11. Frontend: Public Deck Details + Enroll — **Группа 4**.
12. Frontend: Study + per-card progress display — **Группа 4**, semantics в map §0.8.
13. Ручной end-to-end smoke + Postman sync — **Группа 5**.
14. Release hardening: G-04, `CARD-04`, G-05 regression verification, безопасное тело 500.
15. Первый deployment.
16. Optional: single-card AI generation отдельной задачей после manual smoke; не блокирует шаг 15.
