# Backlog

Задачи вне текущего спринта: будущие уровни, отложенные улучшения, технический долг. Текущий спринт: `docs/roadmap/current-sprint.md`. Общий план: `docs/roadmap/roadmap.md`.

> Объединяет детальные задачи Level 1–4 из `LL_Helper_Project_Roadmap.md` и старый `NEXT_TODO.md` (2026-07-30). Пункты не переоценивались на актуальность построчно — часть из них может уже быть частично сделана или устареть, см. пометки.

## Planned Sprints (после Sprint 0.4)

### Sprint 1.0 — Vertical Flow

> **Цель:** Впервые связать frontend, backend, auth и database в одну живую систему.
> Один вертикальный сценарий (accepted, Phase 0.4C) — Register → Complete Profile → authenticated app → Create Deck → Manual Add Card → Owner Deck Details → Public Deck Details → Enroll → Learning list/details → Study → per-card progress → повторное открытие Learning list и продолжение позже. Login проверяется отдельно как повторный вход существующего пользователя: clear/logout session → Login → Learning list → continue.
> UI может быть простым. Цель — не красивый Dashboard, а работающий full-stack flow.

1. Создать React/TS app
2. Настроить routes и API client
3. Login / Register
4. Create deck + Add cards
5. Enroll + Study + See progress

### Sprint 1.1 — First Deployment (Level 1.5)

> **Цель:** Сразу после работающего вертикального flow — собрать и запустить систему в интернете.

1. Dockerfile backend + frontend
2. Docker Compose + PostgreSQL
3. GitHub Actions (build + tests)
4. Один server / облачная платформа (VPS, Railway, Render)
5. HTTPS + health endpoint
6. Environment variables + secrets
7. Базовые структурированные logs
8. DB backup
9. README: как запустить и задеплоить

### Sprint 1.2 — Architecture Documentation

1. Создать ER-диаграмму текущей схемы БД (Mermaid, в `docs/database/relationships.md`), показать Content Layer + Learning Layer, включая реальные `CASCADE` и `NO ACTION` правила (см. `relationships.md` §6.3)
2. Обновить `docs/architecture/current-architecture.md` с ссылкой на ER-диаграмму
3. Подготовить архитектурную схему для портфолио/собеседований

### Sprint 1.3 — AI Workflow & Agent Infrastructure

> ✅ **Существенно выполнено 2026-07-30**, вне исходного порядка (см. `changelog.md` → "AI Infrastructure Reorganization"). Ниже — то, что осталось после реорганизации.

**Группа 1: Понять архитектуру** — ✅ выполнено (root/backend AGENTS.md, rules с glob/model_decision, skills, workflows разделены и задокументированы)

**Группа 2: Создать skills**

- [ ] `create-test-file` skill — генерация unit + @WebMvcTest шаблона для модуля + `TestData` fixtures для нового entity
- [ ] `add-liquibase-migration` skill — шаблон changeset с правильным именованием и FK-стилем
- [x] `database` и `testing` skills созданы (2026-07-30) — покрывают часть этой группы; `create-test-file`/`add-liquibase-migration` как отдельные генерирующие skills пока не созданы

**Группа 3: Обновить workflows**

- [x] `pre-commit-review.md` обновлён — динамическое чтение `current-sprint.md` (2026-07-30)
- [ ] Создать `start-sprint.md` workflow — что проверяет перед началом нового спринта (создание `current-sprint.md` из backlog/roadmap, проверка что только один активный спринт)
- [ ] Создать `finish-sprint.md` workflow — перенос завершённых задач в `changelog.md`, незавершённых — в следующий спринт/`backlog.md`, проверка code/tests/docs перед пометкой "done"

## Level 1 — Vertical Full-Stack Flow (детали)

### Backend improvements

- **🔴 Добавить `@Transactional` на `CardServiceImpl.delete()` и `update()`** — оба метода делают несколько DB-запросов без транзакции (findById + findWithOwnerById + deleteById/save). Риск: при partial failure нет rollback
- **Добавить `deckId` валидацию при удалении/обновлении карты** — эндпоинты `DELETE /cards/{id}` и `PUT /cards/{id}` не проверяют, что карта принадлежит конкретному деку из контекста запроса. Вариант: добавить `card.getDeckId() == deckId` проверку, возможно рефактор URL на `/decks/{deckId}/cards/{cardId}`
- Pagination для `DeckCardResponse.cards` — при большом количестве карточек в деке
- Создать `CardWithDeckResponse` DTO — для endpoint'ов где нужна полная информация о deck вместе с card
- Добавить `cardCount` в `DeckListResponse` — `@Formula` в entity или отдельный query для эффективного подсчёта без загрузки всего списка

### Backend — Learning API, AI generation, User self-service

**Learning API:**
- `GET /api/v1/user-decks/{userDeckId}/study-cards?limit=10`
- `POST /api/v1/user-cards/{userCardId}/answer`
- `GET /api/v1/user-decks/{userDeckId}/progress`

**Review logic (минимум):** trim / lowercase / remove extra spaces + manual override

**Progress logic (Level 0):**
- `NEW` → 1 answered → `LEARNING`
- 2 correct → `REVIEWING`
- 3 correct in a row → `MASTERED`
- wrong → reset consecutive correct

**Level 1 — Learning scheduling:**
- Реализовать расчёт `nextReviewAt`.
- Добавить service unit test `review_shouldCalculateNextReview_basedOnDifficulty`.

**AI generation DTOs:**
- [ ] Специализированный `BulkGenerateResponse` со статусом для каждого тайтла (success/failed/reason) вместо `List<CardResponse>`. Аналогично `AiCardGenerateRequest`/`AiCardGenerateResponse` для single generation
- [ ] Partial response для bulk failures — `BulkGenerateResponse.created[]` + `failed[]` (title + reason), вместо silent skip

**User self-service API:**
- `GET /api/v1/users/me` — implemented (Sprint 1.0 G-01; see `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md` §0.4/§0.7 and `docs/frontend/integration/BACKEND_CONTRACT_INVENTORY.md` USER-07).
- `PUT /api/v1/me`, `DELETE /api/v1/me` — separate self-service endpoints, not part of the G-01 decision; path not normalized to `/users/me` and remains open/deferred.
- При `DELETE /api/v1/me`: решить FK delete rules для `fk_users_auth_user`, `fk_decks_owner`. Варианты: soft delete (User/AuthUser/Deck помечаются deleted, FK остаются NO ACTION) — **рекомендовано**; hard delete + CASCADE; hard delete + RESTRICT

**Rate Limiting tests:** unit tests для `UserRateLimiter` — N запросов в пределах лимита, N+1 → exception, разные `RateLimitAction` независимы, TTL очищает buckets через 1 час, разные пользователи независимы, `checkLimitByUserId()`/`checkLimitByEmail()` независимы

### Frontend (Level 1)

> Corrected Phase 0.4C — stack/architecture below previously described a stale pre-implementation plan (TanStack Query/Axios, no Redux) that no longer matches `frontend/CONVENTIONS.md`. This is a point fix of this block only, not a full backlog review.

Стек: React + TypeScript + React Router 7 + RTK Query + Redux Toolkit (session state) — Axios удалён, см. `frontend/CONVENTIONS.md`.

Accepted Level 1 vertical MVP screens (см. `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md` §0.1/§0.3): Login · Register · Complete Profile · Learning list · Create Deck · Owner Deck Details · Manual Add Card · Public Deck Details + Enroll · Learning Deck Details · Study.

Deferred surfaces/contracts (см. `FRONTEND_INTEGRATION_MAP.md` §0.2): Created Decks list · Discover list/search · Creator Profile · aggregate Progress dashboard · Edit Deck/Edit Card (Card Editor, после первого deployment) · single-card AI (optional, отдельная задача после manual smoke) · bulk AI · pagination · refresh token · backend logout.

Архитектура: FSD (`app/pages/widgets/features/entities/shared`), см. `frontend/CONVENTIONS.md`.

Пока без: Storybook, e2e tests, микрофронтендов

### Performance (Level 1)

- **🔴 HIGH: JWT userId claim** — `SecurityUtils.getCurrentUserId()` делает 2 DB queries на каждый endpoint. Изменить `JwtService.generateToken()` (добавить `userId` claim), `JwtAuthenticationFilter` (извлекать `userId` из токена), `SecurityUtils.getCurrentUserId()` (читать из `SecurityContext`, 0 DB queries). **Breaking change:** старые токены перестанут работать. Обновить `UserRateLimiter` — заменить `checkLimitByEmail()` на `checkLimitByUserId()`

### Security (Level 1)

- **🔴 CRITICAL: IP-based rate limiting для `/auth/register`** — создать `IpRateLimiter.java` (аналогично `UserRateLimiter`), `AuthServiceImpl.register()` добавить `ipRateLimiter.checkLimit(ip, AUTH_REGISTER)`, extract IP через `HttpServletRequest.getRemoteAddr()`/`X-Forwarded-For`. Limit: 10 req/10 min per IP

### Database (Level 1)

- **Migration rollback tests** — документировать какие миграции rollback-safe (V2–V10: проверить `liquibase:rollback`, если невозможен — комментарий в migration)

### AI Workflow (Level 1)

Создать `.windsurf/prompts/`: `update-postman.md`, `suggest-tests.md`, `design-note.md`, `code-review.md`

## Level 2 — Portfolio / Interview-ready (детали)

**Architecture cleanup:** чистая доменная структура, clean service responsibilities, transaction boundaries, no fat controllers, no entity leakage, consistent DTOs/naming

**Database quality:** Liquibase fully adopted, `ddl-auto=validate`, indexes, unique constraints, FK checked, cascade strategy documented
- Unique constraints и indexes уже описаны нормативно в `docs/database/relationships.md` §7–8 — не дублировать точные имена таблиц/колонок здесь
- Проверить и реализовать pending indexes из `docs/database/relationships.md` §8 (`idx_ucp_next_review`, `idx_cards_deck`); индекс `(user_id, status)` для `user_deck_progress` закрыт в V11 как часть G-06.

**Индексация БД:**

- Текущий нормативный список реализованных и pending indexes находится в `docs/database/relationships.md` §8. Не дублировать его здесь.
- Дополнительные кандидаты, требующие проверки через реальные запросы и `EXPLAIN ANALYZE`:
  - `idx_decks_owner(owner_id)` — для выборки Deck по владельцу.
  - `idx_ucp_due_cards(user_deck_progress_id, status, next_review_at)` — составной индекс для spaced-repetition выборки due cards.
- Добавлять дополнительные индексы только после подтверждения query pattern и отсутствия подходящего существующего индекса.

**Security:** authentication vs authorization, JWT structure, password hashing, Spring Security filter chain, SecurityContext, protected endpoints, ownership checks, CORS

**Security Standards (декларативная безопасность):**
- Мигрировать с императивных ownership checks на `@PreAuthorize`:
  - `UserServiceImpl.updateUser()`/`deleteUser()` — заменить `validateUserOwnership()` на `@PreAuthorize("@userSecurity.isOwner(#id)")`
  - `CardServiceImpl.createCard()`/`bulkGenerate()` — заменить `validateDeckOwnership()` на `@PreAuthorize("@deckSecurity.isOwner(#deckId)")`
- Создать security beans: `@Component DeckSecurity`, `@Component UserSecurity`, `@Component CardSecurity`
- Централизовать ownership logic в переиспользуемых методах
- Role-based access: admin может редактировать любые ресурсы
- Рассмотреть custom `@OwnershipRequired` аннотацию
- **🔴 N+1 в ownership validation:** текущий подход делает 2 запроса (1 ownership check, 1 бизнес-логика). Решения: оптимизировать императивный код (загрузить entity один раз), кэш, или AOP
- Rule-файл с примерами Level 0-1 vs Level 2+ подходов, migration guide, SpEL expressions, решение N+1 — материал для этого уже частично в этом backlog-пункте; отдельный `.windsurf/rules/security-standards.md` создавать по необходимости, когда миграция на `@PreAuthorize` реально начнётся (см. `backend/AGENTS.md` за текущими hard gates)

**Rate Limiting (Advanced):**
- IP-based rate limiting — extract IP, обработка `X-Forwarded-For`/`X-Real-IP`
- Distributed rate limiting (Redis) — замена Caffeine, `INCR` + `EXPIRE`, Lua для atomic operations
- Global rate limits — 100 req/min per user, 20 req/min per IP (anonymous)
- Per-user AI generation limit — `userId` параметр в `AiCardGenerationService.generateCardData()`, `checkLimitByUserId(userId, 10, Duration.ofHours(1))`
- Rate limit headers — `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- `UserRateLimiter.reset(email, RateLimitAction)` — explicit bucket clearing method + `reset_shouldClearBucket_whenCalled` test (currently `@Disabled` in Level 0 test suite)

**Testing — Integration (Testcontainers PostgreSQL):**
- Настроить `@Testcontainers`, `@ServiceConnection`, `PostgreSQLContainer`

**Level 2 — Integration testing:**
- `nextReviewAt` scheduling: проверить сохранение и выбор due cards через PostgreSQL/Testcontainers.
- `LearningFlowIntegrationTest.java` — полный flow: создать user → deck → cards → enroll → study-cards → review → повторный enroll → 409
- Ownership/security tests: User A создаёт deck, User B не может изменить/удалить (403), неавторизованный запрос (401)
- Database constraints tests: Liquibase применяет все migrations, unique/FK constraints, фактические `ON DELETE CASCADE`/`NO ACTION` rules (см. `relationships.md` §6.3), TIMESTAMPTZ, triggers на `updated_at`
- Race-condition сценарии: два одновременных enroll → один проходит, второй 409 через `DataIntegrityViolationException`
- `@WebMvcTest` для контроллеров — полный набор статусов (400/401/403/404/409)
- `@DataJpaTest` для custom queries: find cards due for review, find progress by user/card, count mastered, unique constraint, сортировка+limit
- Coverage reports (JaCoCo), migration rollback tests

**Testing — разделение Unit/Slice и Integration:**
- Naming: `*Test` (Surefire, unit/slice) vs `*IT` (Failsafe, integration) — пример: `LearningServiceImplTest` vs `LearningFlowIntegrationIT`
- Maven Failsafe plugin — привязать к `integration-test`/`verify` фазам, `<includes>**/*IT.java</includes>`
- `./mvnw test` — unit/slice tests + один Level 0 `ApplicationContextLoadsTest` с Testcontainers; `./mvnw verify` — всё выше + полный набор `*IT` через Failsafe

**CI (GitHub Actions) — порядок и оптимизация:**
- Триггеры: `push`/`pull_request` на `main`
- Порядок: build → unit/slice tests (fail-fast) → integration tests (после успешных unit) → отчёт (обязательный статус для merge)
- Кэш `~/.m2/repository` по хэшу `pom.xml`
- Параллельность независимых групп тестов внутри unit-стадии
- E2E — только на PR в `main` или перед деплоем
- Quality gates (после стабилизации CI): JaCoCo threshold, Checkstyle/SpotBugs, branch protection

**API Documentation:** OpenAPI/Swagger

**DevOps:** Dockerfile backend/frontend, `docker-compose.yml`, `.env.example`, GitHub Actions (build + tests)

**Frontend:** Stable UI (loading/error states, form validation, protected routes, API error handling, responsive layout, reusable components). Тесты (RTL): Login form, Deck form, Study card component

**AI Workflow Level 2:**
- Скрипты: `/scripts/ai-context.sh`, `/scripts/changed-files.sh`, `/scripts/generate-ai-review-context.sh`
- `/docs/process/pre-commit-checklist.md`
- Semi-automated Postman: AI получает controller files → обновляет коллекцию → ручная проверка

## Level 3 — Production Candidate (детали)

**Product:** Landing page · Onboarding · Public/private decks · Share by link · Copy deck · Edit own enrolled deck/overrides · Better AI generation preview · Generation retry/error recovery · Basic user settings · Better progress dashboard

**Backend:** `StudySession`/`StudySessionAnswer` entity · AI generation history · AI prompt versioning · Refresh tokens · Monitoring basics · Pagination everywhere · Soft delete where needed · Copy/fork модель для enrolled decks (snapshot при enroll)

**Logging (API-wide):**
- Полноценное логирование всех API endpoints (request: method/path/query/userId; response: status/duration)
- Structured logging (JSON), единый формат для production
- Correlation ID / Request ID через MDC
- Логирование ключевых событий: auth, AI generation, bulk failures, ownership violations, rate limit exceed, ошибки
- Отдельный лог-уровень для OpenAI вызовов (latency, tokens, retry count)
- Централизованный сбор логов (ELK / Loki / CloudWatch)

**Rate Limiting (Production):**
- Rate limit headers по IETF draft
- Adaptive rate limiting — dynamic limits по нагрузке, circuit breaker для AI provider, backpressure для bulk
- Monitoring & metrics — Prometheus (`rate_limit_exceeded_total`, `rate_limit_remaining`), Grafana, alerting

**Admin & Audit:**
- Audit log для изменений User/Deck/Card (who, what, when, old_value, new_value)
- Отдельный admin API (`/api/v1/admin/users/{id}`, `/api/v1/admin/decks/{id}`) с отдельными правами
- Admin role — редактирование/удаление любых ресурсов

**AI Level 3:** Fallback provider (optional) · Generation history · Prompt templates/versioning · Response schema validation · Retry strategy · Cost estimation

**Testing:** больше integration tests · frontend integration tests · Playwright basics · security tests forbidden access · AI service mocked tests

**DevOps:** Real deployment · Staging/prod configs · DB backup · Logs · Health checks · Basic monitoring

**AI Workflow Level 3:** Pipeline-скрипт `project-review` (git diff + changed files + controllers + DTOs + migrations + tests + docs). PR template: What changed / DB changes / API changes / Tests / Postman updated? / Docs updated? / AI review done?

## Level 4 — Product / Startup-grade (детали)

**Product:** Teacher dashboard · Student groups/classes · Student progress · Deck marketplace/library · Paid decks · Subscriptions · Usage limits · Admin panel · Analytics · Import from text/file/PDF · Multiple card templates · Advanced spaced repetition · Mobile-friendly PWA · Email notifications · OAuth Google

**Backend:** Organizations/Classrooms · Roles (student, teacher, admin) · Payments · Subscription plans · AI usage billing · Reusable lexical database · Card templates · Card/Deck versioning · Audit logs · Advanced permissions

**AI Level 4:** AI cache/lexical database · Prompt versioning · Evaluation of generated cards · Multiple providers · Cost optimization · User feedback loop · Regeneration by field

Схема `LexicalEntry`: `Meaning` → `Definition` → `Example`, `Synonym`, `Translation`, `GenerationProfile` → `LanguagePair`, `Level`

**AI Workflow Level 4:** Custom internal AI dev assistant · Automatic docs draft update · Automatic test suggestions · Automatic changelog draft · Automatic API collection sync from OpenAPI

## Общий технический долг (из старого `NEXT_TODO.md`, 2026-07-30)

> Часть пунктов ниже может быть уже устаревшей или частично сделанной — не проверялось построчно против кода при слиянии.

- [ ] Проверить все 500 ошибки и заменить на соответствующие HTTP коды — **дублирует Sprint 0.4 Группа 4**, см. `current-sprint.md`
- [ ] ~~Создать систему миграции для проекта (Liquibase)~~ — **вероятно устарело**: Liquibase уже внедрён и используется (schema defined through V11; см. `changelog.md` Sprint 0.3)
- [ ] Проверить структуру базы данных: constraints, FK, cascade, индексы, типы данных, связи — частично покрыто Sprint 0.3, но периодический ревью остаётся полезным
- [ ] Переписать сложные Hibernate запросы на ручные SQL (кроме простых CRUD)
- [ ] Установить правило: SQL-запросы вместо Hibernate/JPQL для сложных операций (`@Query(nativeQuery = true)`/`JdbcTemplate`; запрещено для сложных join/агрегаций/фильтров; базовые CRUD — можно Hibernate)
- [ ] Установить правило: Lombok + Constructor Injection вместо `@Autowired` на полях — **вероятно уже стандарт в коде** (см. `@RequiredArgsConstructor` в существующих сервисах), проверить остались ли исключения
- [ ] Вынести `getCurrentUserId` в общий метод/сервис — **вероятно уже сделано** через `SecurityUtils.getCurrentUserId()`/`getCurrentUserEmail()` (см. `backend/AGENTS.md`, `CONVENTIONS.md`), проверить не осталось ли дублей в контроллерах/сервисах
- [ ] Продумать UX и логику прохождения карточек (флэшкарты/quiz/input режимы) — **терминология устарела** (`card_desc` → сейчас `deck`); функционально во многом уже покрыто `docs/features/learning-flow.md` (enroll → study-cards → review → progress), уточнить что именно осталось не реализованным сверх этого
- [ ] Разработать Learning Mode для дек — **терминология устарела** (`card_desc` → `deck`), см. предыдущий пункт; базовый learning mode уже описан в `docs/features/learning-flow.md` и реализован на Level 0
