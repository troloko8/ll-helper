# Current Sprint

> Level 1 — Vertical Full-Stack Flow. Полный план: `docs/roadmap/roadmap.md`. Задачи вне текущего спринта: `docs/roadmap/backlog.md`. Завершённые спринты: `docs/roadmap/changelog.md`.

## Sprint 1.0 — Vertical Flow

**Цель:** Пройти полный пользовательский путь через интерфейс: Register → Complete Profile → Created → Create Deck → Manual Add Card → повторное открытие колоды через Created → Discover → Public Deck Details → Enroll → Learning list/details → Study → per-card progress → Logout → Login → продолжить обучение. Ручное изменение URL, вызов API из Postman и очистка localStorage не заменяют отсутствующие пользовательские переходы.

**Уточнение scope (2026-09-20, по запросу пользователя):** базовые Created и Discover, необходимые данные для их карточек и видимый Logout включены в этот спринт. Это заменяет прежний direct-link-only MVP и shell только с Learning. Принятые маршруты и границы функциональности — `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md` §0.10; shell — `docs/frontend/DESIGN.md`. Study остаётся контекстным, отдельный Progress dashboard не требуется.

**Как читать checklist:** `[x]` в группах реализации означает наличие соответствующего кода, а не прохождение всего пользовательского сценария. Done Criteria закрываются после проверки сценария на живом backend. Существующие результаты реализации сохранены; новые пробелы и исправления перечислены в группах 4A–4F.

**Основания ревизии:** проверены router, AppShell, Deck/Learning API slices, Add Card, Public/Owner/Learning Details, Study и logout; проверены HTML и изображения канонических Created/Discover desktop/mobile через Stitch MCP. Ручной smoke и тесты в рамках этой ревизии не запускались.

| Возможность | Фактическое состояние на момент ревизии | Что ещё нужно |
|---|---|---|
| Register / Complete Profile | Уже отмечены выполненными в этом спринте | Повторить в полном smoke |
| Create Deck | Пользователь подтвердил создание колоды | Проверить public/private в сквозном сценарии |
| Manual Add Card | Форма, API и тесты есть; пользователь сообщил о проблеме валидации | Воспроизвести и исправить; отдельно подтвердить ручное сохранение без AI (4A) |
| Single-card AI | Код есть; пользователь подтвердил успешное создание через AI | Не заменяет Manual Add Card |
| Created / Discover | Маршрутов и frontend queries списков нет; backend DECK-06/DECK-03 есть, но без cardCount/isEnrolled | Подготовить данные и создать экраны (4B–4D) |
| Enroll / Learning / Study / progress | Код экранов, API и поведенческие тесты есть; публичная колода доступна только через URL | Связать через Discover, проверить обновление и сохранение прогресса (4D–5) |
| Logout | Функция очистки есть, production UI её не вызывает | Добавить доступную кнопку и проверить повторный вход (4F) |
| Postman / AI workflow prompts | Коллекция есть; факт полного прогона не зафиксирован. Каталог ai-workflows с reusable prompts не найден | Явные задачи проверки и подготовки (5–6) |

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
- [x] Реализовать shared-примитивы `Button`, `Input`, `Textarea`, `Select` и `FormField`.
- [x] Реализовать канонические состояния загрузки/ошибки: `Skeleton`, `PageState` и `InlineError`.
- [x] Стандартизировать семантическую разметку форм: связка label/control/error, keyboard focus, `aria-describedby`/`aria-live`, field error, disabled/loading и async error.
- [x] Реализовать общий error-presentation contract: global 401 teardown; feature/page-level `403/404/409/429/5xx` через `PageState`/`InlineError`; field validation через `FormField`.
- [x] Добавить базовое responsive-поведение для Auth и Onboarding экранов.
- [x] Добавить глобальный application Error Boundary и router-level error surface.
- [x] Добавить blocking session-bootstrap state вместо пустого экрана и базовый `404 Not Found` route.

**Группа 1: Auth flow**

- [x] Реализовать contract-first Auth/User API foundation:
  - [x] Инжектировать RTK Query endpoints для `AUTH-01`, `AUTH-02`, `USER-01` и `USER-07` в соответствующих feature/entity slices.
  - [x] Описать request/response DTO строго по `BACKEND_CONTRACT_INVENTORY.md`; не хранить `UserResponse` в session slice.
  - [x] Реализовать React Hook Form + Zod schemas по фактическим backend constraints.
  - [x] Отобразить `400` field validation, `401` bad credentials, `409` email/username conflict и `429` rate limit; `404 → needsProfile` применять только к `GET /users/me`.
- [x] Реализовать Login / Register экраны и валидацию.
- [x] Реализовать Complete Profile (`/onboarding/profile`) по canonical Stitch references.
- [x] Реализовать session lifecycle:
  - [x] Session с 4 состояниями: `initializing | anonymous | needsProfile | authenticated`.
  - [x] Session bootstrap через `GET /api/v1/users/me`: `200` → `authenticated`; `404` → `needsProfile`; `401` → clear token → `anonymous`.
  - [x] Реализовать public/auth, onboarding и authenticated route layouts/guards: `initializing` показывает blocking `PageState`; `anonymous` допускается к `/login` и `/register`; `needsProfile` — только к `/onboarding/profile`; `authenticated` — к product routes.
  - [x] Реализовать `/` → `/learning`; authenticated пользователь на auth/onboarding routes также перенаправляется в `/learning`.
  - [x] При `401` очищать token, session state и RTK Query cache через `baseApi.util.resetApiState()`.
  - [x] При logout очищать token, session state и RTK Query cache через `baseApi.util.resetApiState()`.
- [x] Реализовать Auth + onboarding orchestration:
  - [x] Register → сохранить token → `needsProfile` → Complete Profile (`POST /users`) → `authenticated` → `/learning`.
  - [x] Login → сохранить token → `GET /users/me`: `200` → `/learning`; `404` → `/onboarding/profile`; `401` → очистить session → `/login`.
  - [x] Complete Profile validation/conflict сохраняет валидную token/session и позволяет повторить отправку.
  - [x] Logout является локальным Level 1 flow: очистить token/session/API cache → `/login`; backend logout остаётся deferred.
- [x] Покрыть MSW + RTL тестами bootstrap, refresh with token, Register/Profile/Login/Logout orchestration, redirects, `400/401/409/429` и очистку cache между пользователями.

**Группа 1A: Reduced authenticated application shell — выполнить до Learning screens**

- [x] Реализовать `AppShell` как authenticated layout.
- [x] Удерживать общий RTK Query кеш текущего пользователя подпиской в `AppShell` между переходами по авторизованным страницам; проверено отсутствие повторного запроса после стандартного периода удаления неиспользуемого кеша.
- [x] Реализован первоначальный shell только с `Learning`; расширение до принятого scope — 4C/4D/4F. `Progress` остаётся скрытым.
- [x] Реализовать согласованное desktop/mobile responsive-поведение без dead links; не строить полный post-vertical shell заранее.

**Группа 2: Learning read flow**

- [x] Learning list (`/learning`) — backend G-06 и frontend реализованы.
- [x] Learning Deck Details (`/learning/:deckId`) — показывает backend-provided per-card progress + frontend-derived per-deck counts (см. Phase 0.4C § Progress semantics).

**Группа 3: Deck & card authoring flow**

- [x] Create deck screen (`/decks/new`).
- [x] После готовности `/decks/new` добавить рабочий Create Deck CTA на Learning screen; до этого не показывать dead link.
- [x] Owner Deck Details (`/decks/:deckId/manage`).
- [x] Manual Add Card screen (`/decks/:deckId/cards/new`) — Level 1 требование.
- [x] Single-card AI generation реализована; успешное создание подтверждено пользователем. Optional: не закрывает обязательную ручную ветку, которая проверяется в 4A.
- [ ] Принять UX-решение для карточки в Owner Deck Details: либо карточка открывает отдельный read-only Card Details с последующим действием Edit (тогда нужны новый canonical Stitch reference и отдельный route), либо действие Edit сразу открывает существующую Add/Edit Card форму с заполненными данными. Зафиксировать выбранный entry point и route в integration map; при выборе отдельного Card Details сначала подготовить desktop/mobile дизайн и зарегистрировать его в `DESIGN.md`/`MANIFEST.md`. Runtime-реализация остаётся вместе с deferred полноценным Card Editor после первого deployment.
- Created Decks list включён в продолжение этого спринта (4C); полноценный Card Editor/Edit Deck остаётся вне scope.

**Группа 4: Public deck, enroll & study flow**

- [x] Public Deck Details + Enroll (`/decks/:deckId`) реализован по прямой ссылке. Вход через Discover ещё предстоит сделать (4D); сам экран повторно не создавать.
- [x] Enroll in deck через Public Deck Details.
- [x] Study screen (`/study/:deckId`, достижим только контекстно из Learning Deck Details): карточки, submit answer, see result — backend G-08 готов (`LEARNING` → `REVIEWING` → `NEW`, max 10; `MASTERED` исключён).
- [x] Study получает `{deckId, deckTitle, cards}` одним запросом LEARN-02; загрузка Learning list ради заголовка удалена.
- [x] После готовности `/study/:deckId` добавить контекстный Study CTA на Learning Deck Details; отдельный persistent Study destination не создавать.
- ~~Progress view (отдельный экран)~~ — aggregate Progress dashboard deferred (Phase 0.4C); progress показывается внутри Learning Deck Details.

### Группа 4A — Надёжное ручное добавление карточки

Основа уже существует: `features/add-card`, `pages/add-card`, `CARD-01`. Автоматическая проверка нового learning-content contract выполнена; успешный ручной smoke ещё не подтверждён.

- [x] Воспроизведён title-only сценарий: frontend Zod и backend `CardRequest` разрешали сохранить карточку без `definition` и `translation`, после чего Study не имел содержательной подсказки.
- [x] По решению пользователя ручной POST и PUT используют общий `CardRequest`: `title` и `translation` обязательны, `definition`/`examples`/`synonyms` необязательны. `deckId` создания перенесён в `POST /decks/{deckId}/cards`. AI вынесен в `CardGenerationController` (`POST /card-generations`, `/card-generations/bulk`), `autoGenerate` удалён; frontend, Postman и контракт синхронизированы. AI-результат без непустого `translation` отклоняется до сохранения; проверки frontend/backend покрывают новые контракты.
- [ ] Вручную сохранить карточку через Save (`POST /decks/{deckId}/cards`), увидеть её на Owner Deck Details и после refresh. Для study-fixture заполнить definition/translation, чтобы подсказка была осмысленной.
- [ ] Повторить AI-ветку как regression: созданная карточка сохраняется, loading/error не ломают дальнейший ручной ввод. Успех AI не закрывает предыдущий пункт.

**Результат:** подтверждён обязательный Manual Add Card, можно готовить колоды для следующего сценария.

### Группа 4B — Контракты карточек Created / Discover

Основа: `DECK-06 GET /decks/mine`, `DECK-03 GET /decks`. Канонические Created desktop/mobile тоже показывают количество карточек; прежняя неопределённость по этому полю снята визуальной проверкой Stitch. Текущие DTO ещё не содержат новые поля.

- [ ] Добавить backend-provided `cardCount` для обеих коллекций; значение — число content cards, включая `0`, а не число карточек в обучении. Сохранить различие public-only DECK-03 и owner-scoped DECK-06 (включая private).
- [ ] Добавить в публичную коллекцию `isEnrolled` для текущего пользователя с согласованной семантикой ACTIVE enrollment; выбрать и зафиксировать DTO публичного списка до frontend-интеграции. Не выдавать значение другого пользователя и не путать владение с enrollment.
- [ ] Получать counts/enrollment без загрузки всех карточек каждой колоды и без отдельного запроса на каждый элемент списка. Фронтенд не должен собирать карточку каталога серией detail-запросов.
- [ ] Проверить расчёт и пользовательскую изоляцию service-тестами; JSON полей, пустые списки и сохранение HTTP-контракта — controller-тестами. Реальные query/visibility/count результаты проверить на PostgreSQL в живом прогоне; mocks не считаются проверкой SQL.
- [ ] В той же задаче синхронизировать backend inventory, integration map и Postman с реально реализованными DTO; затем обновить frontend types/fixtures. Сейчас новые поля остаются планом.

**Результат:** обе коллекции возвращают всё необходимое для принятого набора данных в макетах.

### Группа 4C — Created: вернуться к собственным колодам

Зависимость: 4B. References: `created_decks_llhelper_refined_mvp`, `created_decks_mobile_with_bottom_nav`; exact IDs и состояния — `docs/frontend/design-reference/MANIFEST.md` → My Decks — Created.

- [ ] Добавить query DECK-06 и страницу `/created`: title, language pair, public/private, cardCount, Open → `/decks/:deckId/manage`, Create New Deck → `/decks/new`.
- [ ] Подключить Created в desktop/mobile navigation вместе с готовым маршрутом. Сохранить доступный Create Deck и при пустом, и при непустом списке; после создания оставлять пользователя на Owner Deck Details для добавления карточек.
- [ ] Добавить loading/error/retry/empty состояния по references; убрать из адаптации действия редактирования/удаления, которых нет в принятом scope.
- [ ] Связать invalidation: создание колоды обновляет Created; manual/AI add обновляет count в списках и detail. Проверить возврат без ручного refresh.
- [ ] Проверить через UI и RTL/MSW: после ухода со страницы и нового входа собственная колода снова находится в Created, чужая private не появляется; Open и Create доступны с клавиатуры и на mobile.

**Результат:** созданная колода больше не теряется после ухода с Owner Deck Details.

### Группа 4D — Discover: найти публичную колоду и начать обучение

Зависимость: 4B/4C. References: `discover_llhelper_refined`, `discover_mobile` и их loading/error/empty states в manifest. Принята ограниченная адаптация: список и переходы; поиск, фильтры, Load more, bookmark, декоративные обложки и topic/level chips остаются вне этого спринта (map §0.10).

- [ ] Добавить query DECK-03 и `/discover`: public deck title, language pair, creator username, cardCount и Enrolled badge по backend-данным. Карточка открывает существующий `/decks/:deckId`.
- [ ] Подключить Discover в desktop/mobile navigation и добавить Browse public decks в пустой Learning state. Create Deck должен оставаться доступным и после появления learning decks.
- [ ] Реализовать loading/error/retry/empty состояния без dummy-карточек и неподдерживаемых элементов макета. Проверить public/private и переход Discover → Public Deck Details.
- [ ] Доработать Public Deck Details: до enrollment — Start learning; для уже добавленной колоды — Open learning → `/learning/:deckId`. Состояние получать из server state (например, существующего LEARN-05), включая прямое открытие/refresh, а не только из navigation state.
- [ ] После успешного Enroll обновлять Discover enrollment state и Learning list, затем открывать Learning Deck Details. При конфликте 409 сверять актуальное enrollment и предоставлять путь в Learning; остальные ошибки не считать успехом.
- [ ] Проверить RTL/MSW и вручную: Discover → public details → Enroll → Learning Details → Learning list; повторное открытие и enrollment без дубликатов. Для пустой колоды показать понятное состояние без обещания готовой study-сессии.

**Результат:** публичную колоду можно найти и добавить к обучению без знания её ID и изменения URL.

### Группа 4E — Study и сохранение прогресса: довести существующий путь

Зависимость: 4D. `pages/learning`, `pages/learning-deck-details`, `pages/study`, `features/review-card` и LEARN-02–05 уже реализованы.

- [ ] Пройти Learning list → Learning Deck Details → Study по кнопкам. Исправить найденные разрывы переходов/ошибки; новые дубли этих экранов не создавать.
- [ ] Проверить правильный и неправильный ответы, переход к следующей карточке, завершение партии (до 10) и Continue studying. Правильность и статусы брать из review response; пустую очередь обрабатывать без зависания.
- [ ] Проверить, что после review обновляются Learning Details и Learning list; per-card status и derived counts соответствуют ответам сервера, сохраняются после refresh и повторного открытия. Mastery может оставаться 0% до MASTERED — один правильный ответ не равен освоению карточки.
- [ ] При найденных дефектах добавить адресные behavioral regressions. Для основного smoke сначала наполнить колоду, затем enroll; синхронизация карточек, добавленных после enrollment, отдельно от этого сценария и не должна подразумеваться UI-текстом без проверки backend.

**Результат:** Study и progress подтверждены на живых данных, а не только на mocked responses.

### Группа 4F — Logout и повторный вход через интерфейс

Зависимость для финальной проверки: 4E. `features/logout/model/logout.ts` уже очищает token/session/cache; production-кнопки нет.

- [ ] Добавить видимое действие Log out в authenticated shell на desktop/mobile, использующее существующий logout use case. Не вводить backend logout или Settings page; размещение — `DESIGN.md` → Application shell.
- [ ] Проверить реальным кликом очистку сессии, переход в Login и отсутствие protected content при Back/refresh; расширить тесты до пользовательского действия, а не только вызова функции.
- [ ] Войти тем же пользователем: Created и Learning доступны, сохранённый прогресс восстановлен, Study можно продолжить. Войти другим пользователем: кеш колод/профиля/прогресса предыдущего пользователя не виден.

**Результат:** критерий повторного входа выполняется без ручной очистки localStorage.

### Группа 5 — Полный ручной smoke и Postman

Выполняется после 4A–4F с живыми frontend/backend/PostgreSQL. В каждом пункте при закрытии записать дату, окружение/ревизию и краткий результат без credentials/tokens.

- [ ] Проверить API base URL и подключение браузера к backend. При dev proxy отдельно проверить нужную deployment-схему origin/CORS перед релизом; успешный proxy-запрос сам по себе не доказывает cross-origin CORS.
- [ ] Основной flow без ручного URL: Register → Complete Profile → Created → Create **public** Deck → Manual Add Card → Created → повторное открытие Owner Deck Details → Discover → Public Deck Details → Enroll → Learning Details → Study → per-card progress → Learning list → повторное открытие.
- [ ] Через видимый Logout выйти, войти тем же пользователем и продолжить Study. Refresh на Created/Learning Details сохраняет доступ к колодам и backend-прогресс.
- [ ] Проверка вторым аккаунтом: публичная колода первого находится через Discover и enroll-ится; его private-колода отсутствует в Discover и Created второго. Private deck остаётся доступной владельцу в Created; её enrollment сейчас запрещён даже владельцу.
- [ ] Проверить desktop/mobile/keyboard, пустые состояния, ошибки и retry на изменённых переходах. Исправить блокирующие дефекты и повторить затронутый сценарий.
- [x] Postman collection/environment ранее синхронизированы с существующим API. Это не отметка о прохождении сценариев.
- [ ] После 4B обновить Postman для новых DTO и пройти Auth/Profile → Deck/Create/List/Mine → Manual Card → Public Detail → Enroll → Learning/List/Details → Study/Review → повторное чтение progress; проверить ключевые success/error assertions и записать результат.

### Группа 6 — AI workflow prompts, документация и закрытие

- [x] `docs/architecture/current-architecture.md` содержит frontend architecture section.
- [ ] Подготовить минимальные reusable prompts в предусмотренном roadmap каталоге `ai-workflows/`: review diff, suggest tests, update Postman и scoped design decision. Сначала сверить существующие skills и ссылаться на их правила, не копировать архитектурные инструкции. Это developer workflow, не prompt генерации учебной карточки.
- [ ] Проверить применение prompts на одном завершённом изменении: они запрашивают нужный контекст, дают проверяемый результат и не объявляют непрогнанные тесты успешными.
- [ ] Синхронизировать изменившиеся факты по владельцам: DTO — inventory/Postman; маршруты/scope — map; runtime architecture — CONVENTIONS; UI — DESIGN; learning semantics — learning-flow. В этой ревизии runtime не меняется; обновления реализации выполняются с соответствующей задачей.
- [ ] Провести финальные frontend build/lint/format/tests и backend checks, относящиеся к изменениям. Сопоставить каждый Done Criterion с ручным результатом группы 5 либо проверкой prompts выше.
- [ ] Закрыть Sprint 1.0 только после всех обязательных критериев; затем перенести итоги в changelog и начать Sprint 1.1 по roadmap. Неблокирующие дальнейшие улучшения оставить в backlog.

## ✅ Done Criteria (Level 1)

- [x] Есть frontend
- [x] Можно зарегистрироваться и завершить Complete Profile
- [x] Можно создать deck — подтверждено пользователем 2026-09-20; public/private regression входит в группу 5.
- [ ] Можно создать card **вручную**, с корректной валидацией и сохранением после refresh — 4A. AI-успех подтверждён отдельно и не закрывает этот критерий.
- [ ] Можно повторно найти свои колоды через Created — 4B/4C/5.
- [ ] Можно найти public deck через Discover, открыть Public Deck Details и enroll-иться — 4B/4D/5.
- [ ] Можно пройти Study из Learning через UI — 4E/5.
- [ ] Per-card progress сохраняется и отображается на Learning Deck Details после refresh/повторного входа — 4E/5; отдельный aggregate Progress dashboard не требуется.
- [ ] Можно нажать Logout, войти повторно через Login и продолжить через Learning list — 4F/5; clear session вручную не заменяет кнопку.
- [ ] Основные endpoint flows проходят через Postman — группа 5.
- [ ] Есть проверенные AI workflow prompts — группа 6.
- [ ] Проектом можно пользоваться самостоятельно без ручного URL/API/localStorage — полный flow группы 5.

**Приоритет выполнения:**

1. **4A:** воспроизвести и исправить валидацию, подтвердить Manual Add Card.
2. **4B:** подготовить cardCount для Created/Discover и isEnrolled для Discover, синхронизировать контракты.
3. **4C:** Created и возврат к созданным колодам.
4. **4D:** Discover → Public Deck Details → Enroll → Learning.
5. **4E:** проверить существующие Study/progress и исправить найденные дефекты.
6. **4F:** видимый Logout → Login → продолжение.
7. **5:** полный пользовательский smoke и Postman с фиксацией результатов.
8. **6:** prompts, документация, итоговые checks и закрытие. Группы 0–4 описывают уже созданный фундамент.

## Phase 0.4 — Global Frontend Integration Audit

**Статус: ✅ завершена** (Phase 0.4A/0.4B/0.4C были documentation/audit-only; runtime code в рамках самой фазы не менялся). Последующая runtime frontend implementation уже идёт по упорядоченным задачам и checklist выше.

- [x] Phase 0.4A — Backend Contract Inventory (`docs/frontend/integration/BACKEND_CONTRACT_INVENTORY.md`) — repository-grounded аудит контроллеров, DTO, security и error contract.
- [x] Phase 0.4B — Frontend Integration Map (`docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md`) — screen-by-screen карта всех 26 canonical Stitch references → candidate route → backend contract → readiness. После закрытия G-06: 8 ready / 7 partial / 9 blocked / 2 deferred.
- [x] Phase 0.4C — принятые решения: exact Level 1 vertical MVP, route map, Register→Complete Profile flow, session-модель, navigation scoping, Progress semantics, blocker categorization (vertical vs release/security vs deferred), backend → Stitch → frontend order. См. `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md` §0 для полного текста решений.

### Phase 0.4C — исходный Level 1 vertical MVP и последующее расширение

**MVP surfaces:** Login, Register, Complete Profile, Learning list, Create Deck, Owner Deck Details, Manual Add Card, Public Deck Details + Enroll, Learning Deck Details, Study.

Это исходное решение Phase 0.4C. Актуальное расширение включает Created, Discover и видимый Logout; см. map §0.10 и группы 4A–4F выше.

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
  - [x] Frontend onboarding orchestration (`/onboarding/profile` → `POST /users` → `/learning`, `needsProfile` session state).
  - [ ] End-to-end Register → Profile verification (ручной smoke).
- [x] G-06 Learning Decks list endpoint — `GET /api/v1/learning/decks`: только `ACTIVE` enrollment текущего пользователя, batch progress aggregation, Continue/Start ordering по `lastStudiedAt`/`enrolledAt`, V11 `enrolled_at` + индекс `(user_id, status)`.
- [x] G-08 Study selection включает `REVIEWING`: приоритет `LEARNING` → `REVIEWING` → `NEW`, детерминированная сортировка по `card.id` внутри статуса, max 10; `MASTERED` исключён. Подтверждено service unit tests.
- [x] G-12 `docs/features/learning-flow.md` исправлен (409, не 403)

G-05 закрыт: `GET /decks/{id}` и `GET /cards/{id}` используют общий `DeckAccessPolicy`; public и owner-private чтение разрешено, чужой private контент возвращает контролируемый 403. Подтверждено service unit tests и `@WebMvcTest`.

**Completed backend foundations for collection screens:**
- [x] Owner-scoped deck collection `GET /api/v1/decks/mine` возвращает все public/private decks текущего пользователя; подтверждено service unit test и `@WebMvcTest`. Created UI теперь в scope (4C), дополнение cardCount — 4B.

**Public deployment/security blockers** (обязательны до первого публичного deployment):
- [x] G-04 `GET /api/v1/decks` возвращает только public decks; private decks отфильтрованы repository query. Подтверждено service unit test и `@WebMvcTest`.
- [x] `CARD-04` `GET /api/v1/cards` возвращает только cards из public decks; private-deck cards отфильтрованы repository query. Подтверждено service unit test и `@WebMvcTest`.
- [x] G-05 private visibility protection для `GET /decks/{id}` и `GET /cards/{id}`
- [x] Catch-all `500` не возвращает raw exception message; безопасный контракт описан в inventory §7. Подтверждено `@WebMvcTest` для исключений с внутренними деталями и без message.

### Ordered backend → Stitch → frontend tasks

Исходные prerequisites отражены в группах 0–4 и блоках выше. Единственный актуальный порядок оставшихся работ — **Приоритет выполнения** после Done Criteria; повторный список здесь не поддерживается. Release/security regressions сохраняются перед первым публичным deployment в Sprint 1.1.
