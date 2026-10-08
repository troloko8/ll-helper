# Backlog

Задачи вне текущего спринта: будущие уровни, отложенные улучшения, технический долг. Текущий спринт: `docs/roadmap/current-sprint.md`. Общий план: `docs/roadmap/roadmap.md`.

> Объединяет детальные задачи Level 1–4 из `LL_Helper_Project_Roadmap.md` и старый `NEXT_TODO.md` (2026-07-30). Пункты не переоценивались на актуальность построчно — часть из них может уже быть частично сделана или устареть, см. пометки.

## Planned Sprints (после Sprint 0.4)

### Sprint 1.0 — Vertical Flow

> **Цель:** Впервые связать frontend, backend, auth и database в одну живую систему.
> Пользовательский flow Level 1 закрыт; результаты находятся в `docs/roadmap/changelog.md`, product decisions — integration map §0.10. В Level 1 включены базовые Created, Discover и видимый Logout, чтобы сценарий выполнялся через UI. Этот блок не является второй очередью задач активного deployment-спринта.
> UI может быть простым. Цель — не красивый Dashboard, а работающий full-stack flow.

1. Создать React/TS app
2. Настроить routes и API client
3. Login / Register
4. Created → Create deck + Manual Add Card
5. Discover → Public Deck Details → Enroll → Study → See progress → Logout/Login

### Future release gate — First Public Deployment (optional, after Full Frontend)

> **Цель:** после завершения полного frontend и явного решения о публичном
> релизе собрать и запустить систему в интернете. Это не следующий спринт по
> умолчанию и не критерий закрытия Sprint 1.0. При старте выбранного release
> sprint активный чеклист и фактические результаты проверок переносятся в
> `current-sprint.md`; реализованная runtime-схема после проверки
> синхронизируется с `docs/architecture/current-architecture.md`. Стабильные
> правила кеширования не дублируются здесь и остаются в
> `frontend/CONVENTIONS.md`.

#### Gate перед началом deployment

- [x] Sprint 1.0 закрыт 2026-10-08: обязательный UI/Postman flow пройден, блокирующие дефекты в smoke не обнаружены, frontend/backend checks и повторный Newman зафиксированы в `docs/roadmap/changelog.md`.
- [ ] Full Frontend завершён, а необходимость публичного URL подтверждена отдельным продуктовым решением.
- [ ] Выбраны hosting/platform, домен и схема runtime: где завершается TLS, где работает reverse proxy, где запускаются frontend, backend и PostgreSQL.

> Базовая origin-схема уже принята: один публичный HTTPS origin, frontend использует `VITE_API_URL=/api/v1`, а reverse proxy направляет `/api/**` в backend. При входе в этот future release gate требуется реализовать и проверить это решение на выбранной платформе, а не принимать его повторно.

- [ ] Подтверждено, что выбранная платформа поддерживает принятую same-origin схему. Если платформа вынуждает перейти на cross-origin API, решение обновлено, явный CORS-контракт настроен и проверен из браузера с production frontend origin; успешный dev-proxy запрос не считается доказательством CORS.

#### Release blockers — build, runtime и network

- [ ] Подготовлены production Dockerfile для backend и frontend; образы собираются воспроизводимо без секретов внутри image layers.
- [ ] Docker Compose запускает frontend/reverse proxy, backend и PostgreSQL с health checks, persistent DB volume и явными сетями.
- [ ] Публично доступны только HTTPS-порты reverse proxy/platform; Spring Boot `8080` и PostgreSQL не публикуются в интернет.
- [ ] HTTPS включён, HTTP перенаправляется на HTTPS, сертификат обновляется автоматически.
- [ ] Environment variables и secrets передаются средой deployment; production credentials не хранятся в Git, image, frontend bundle или CI logs.
- [ ] Добавлен backend health/readiness endpoint, не раскрывающий чувствительные сведения; container/platform probe проверяет его, а не только открытый TCP port.
- [ ] Настроен production profile: debug/SQL output отключён, startup не зависит от dev-only настроек, Liquibase применяет ожидаемую схему.
- [ ] PostgreSQL находится в private network, использует отдельные production credentials и persistent storage.

#### Release blockers — reverse proxy и HTTP contract

- [ ] Reverse proxy передаёт `Host`, `X-Forwarded-Proto` и цепочку client IP (`X-Forwarded-For` либо platform equivalent); backend доверяет forwarded headers только от известного proxy/platform.
- [ ] Установлены явные ограничения request body на proxy и backend; допустимый размер подтверждён для текущих JSON/API операций.
- [ ] Установлены явные connect/read/write timeouts. Для AI endpoint выбран отдельный обоснованный read timeout, согласованный с backend outbound timeout.
- [ ] Реализован frontend HTTP cache contract из `frontend/CONVENTIONS.md`: hashed assets получают долгий immutable cache, HTML/direct-route fallback — revalidation, authenticated `/api/**` не кешируется без отдельного решения.
- [ ] Базовый Nginx config из `deploy/nginx/nginx.conf` адаптирован к выбранному hosting: для отдельного Nginx-контейнера loopback upstream заменён адресом backend-сервиса; API через proxy отвечает, а missing chunk возвращает настоящий `404`, а не SPA HTML.
- [ ] Финальный Nginx config проверен через `nginx -t` в release image перед reload/restart; версия image синхронизирована с репозиторным CI check (`deploy/check-nginx-config.sh`). Базовый draft уже прошёл локальный check, но финальная конфигурация и CI run ещё не проверены.
- [ ] Rollout атомарный либо предыдущие hashed assets сохраняются достаточно долго для уже открытых клиентов.

#### Release blockers — delivery, observability и data safety

- [ ] GitHub Actions выполняет frontend build/lint/format/tests и относящиеся к релизу backend checks; обязательные checks зелёные перед ручным или автоматизированным deployment. Если добавлен deployment job, он зависит от успешных required checks.
- [ ] Включены базовые структурированные application/proxy logs; JWT, пароли, API keys, секреты и полные чувствительные payload не логируются.
- [ ] Настроен автоматический DB backup с определёнными retention и местом хранения вне runtime volume.
- [ ] Выполнен пробный restore backup в отдельную БД; наличие файла backup без успешного восстановления не закрывает критерий.
- [ ] Довести черновой runbook `deploy/README.md` до проверенной инструкции для выбранной платформы: локальный production-like запуск, необходимые переменные без значений секретов, deployment, migrations, health check, backup/restore и rollback; добавить ссылку из корневого README.

#### Проверка первого релиза

- [ ] С чистого окружения образы собираются и система запускается документированной командой; health checks переходят в healthy.
- [ ] Приложение и API доступны через публичный HTTPS URL; HTTP redirect, certificate chain и production origin соответствуют выбранной схеме.
- [ ] Прямое внешнее подключение к backend `8080` и PostgreSQL невозможно; API остаётся доступным через разрешённый proxy route.
- [ ] Через production origin повторён обязательный Sprint 1.0 flow, включая logout/login, refresh на защищённых страницах и сохранение learning progress.
- [ ] Если применяется cross-origin, проверены успешный разрешённый preflight/request и отклонение постороннего origin; при same-origin подтверждено отсутствие ненужного wildcard CORS.
- [ ] На реальном hosting origin проверены `Cache-Control` для HTML, hashed assets и authenticated API, direct-route fallback, missing-chunk `404` и доступность старого asset во время rollout.
- [ ] Проверены body limit и timeout behavior: клиент получает контролируемую ошибку/retry path, а зависший upstream не удерживает соединение бесконечно.
- [ ] В application, proxy и CI logs выполнен поиск утечек JWT/паролей/API keys; чувствительные значения отсутствуют.
- [ ] Выполнены backup и restore verification; результат, дата и использованная процедура записаны в активном `current-sprint.md` без credentials.
- [ ] Выполнен rollback/redeploy предыдущей рабочей версии либо документирован и проверен эквивалентный механизм hosting platform.

#### После первого публичного релиза — не блокирует release gate

- [ ] Добавить request correlation между reverse proxy и backend logs.
- [ ] Добавить метрики, внешнюю availability-проверку и алерты по health/error rate.
- [ ] Подключить централизованное хранение и поиск логов с retention/redaction policy.
- [ ] Автоматизировать регулярную restore drill и документировать recovery objectives после появления реальных требований.

### Future — Architecture Documentation

1. Создать ER-диаграмму текущей схемы БД (Mermaid, в `docs/database/relationships.md`), показать Content Layer + Learning Layer, включая реальные `CASCADE` и `NO ACTION` правила (см. `relationships.md` §6.3)
2. Обновить `docs/architecture/current-architecture.md` с ссылкой на ER-диаграмму
3. Подготовить архитектурную схему для портфолио/собеседований

### Future — AI Workflow & Agent Infrastructure

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
- `cardCount` для Created/Discover и public-list `isEnrolled` реализованы одним агрегирующим запросом на коллекцию; контракт зафиксирован в inventory, итог Sprint 1.0 — в changelog.
- Заменить полный `UserResponse owner` в `PublicDeckListResponse` на compact owner (`id`, `username`, при необходимости `avatarUrl`); Created уже использует минимальный `OwnedDeckListResponse` без owner.

### Backend — Learning API, AI generation, User self-service

**Learning API:**
- [x] **Owner enrollment for private decks (implemented 2026-10-08):** a deck owner can create an ACTIVE enrollment for their own private deck and study it; every non-owner still receives `403`, and private decks remain absent from Discover and other users' Created lists. Backend authorization, owner CTA/navigation, service/controller/frontend coverage, `LEARN-01` inventory and Postman success/error cases were updated together. First enrollment remains `201`; duplicate enrollment remains `409`.
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

- [ ] Определить политику актуальности кеша `currentUser`: максимальный возраст данных и условия повторного запроса (например, возврат в приложение), обновление/инвалидация после изменения профиля. `AppShell` удерживает подписку на время авторизованной части приложения; это не TTL свежести данных и не срок действия JWT. Реализовать отдельно, без периодических запросов в текущей задаче.

> Corrected Phase 0.4C — stack/architecture below previously described a stale pre-implementation plan (TanStack Query/Axios, no Redux) that no longer matches `frontend/CONVENTIONS.md`. This is a point fix of this block only, not a full backlog review.

Стек: React + TypeScript + React Router 7 + RTK Query + Redux Toolkit (session state) — Axios удалён, см. `frontend/CONVENTIONS.md`.

Accepted Level 1 screens/actions — `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md` §0.1/§0.3/§0.10. Базовые Created/Discover, cardCount для коллекций, isEnrolled для Discover и видимый local Logout включены в текущий спринт; здесь повторно не планируются.

Deferred surfaces/contracts (см. `FRONTEND_INTEGRATION_MAP.md` §0.2) перенесены в активный Sprint 1.1 — Full Frontend. Single-card AI остаётся optional и его успешная проверка не заменяет manual smoke.

Архитектура: FSD (`app/pages/widgets/features/entities/shared`), см. `frontend/CONVENTIONS.md`.

Пока без: Storybook, e2e tests, микрофронтендов

### Performance (Level 1)

- **🔴 HIGH: JWT userId claim** — `SecurityUtils.getCurrentUserId()` делает 2 DB queries на каждый endpoint. Изменить `JwtService.generateToken()` (добавить `userId` claim), `JwtAuthenticationFilter` (извлекать `userId` из токена), `SecurityUtils.getCurrentUserId()` (читать из `SecurityContext`, 0 DB queries). **Breaking change:** старые токены перестанут работать. Обновить `UserRateLimiter` — заменить `checkLimitByEmail()` на `checkLimitByUserId()`

### Security (Level 1)

- **🔴 CRITICAL: IP-based rate limiting для `/auth/register`** — создать `IpRateLimiter.java` (аналогично `UserRateLimiter`), `AuthServiceImpl.register()` добавить `ipRateLimiter.checkLimit(ip, AUTH_REGISTER)`, extract IP через `HttpServletRequest.getRemoteAddr()`/`X-Forwarded-For`. Limit: 10 req/10 min per IP
- [ ] **Frontend dependency audit:** разобрать baseline `npm audit` от 2026-09-29 — 14 findings (1 low, 5 moderate, 8 high; прежний результат 13 уже устарел). В первую очередь проверить применимость direct `react-router-dom`, `vite` и `vitest`, затем transitive findings, разделяя production SPA risk и local/dev-tool risk. Обновлять зависимости точечно, изучать breaking changes, не применять слепой `npm audit fix`; после обновления запустить frontend build/lint/tests/bundle checks и повторный audit. Критерий закрытия: устранённые findings подтверждены audit, а каждый оставшийся имеет документированное обоснование применимости, mitigation, владельца и срок пересмотра.

### Database (Level 1)

- **Migration rollback tests** — документировать какие миграции rollback-safe (V2–V10: проверить `liquibase:rollback`, если невозможен — комментарий в migration)

### AI Workflow (Level 1)

Level 1 закрывается проверкой существующих project skills и routing на завершённом изменении; отдельные prompt-обёртки не создаются, потому что дублируют `pre-commit-review`, `testing`, `design-decision` и documentation-sync. Специализированная дальнейшая автоматизация остаётся в Sprint 1.3.

## Level 2 — Portfolio / Interview-ready (детали)

**Architecture cleanup:** чистая доменная структура, clean service responsibilities, transaction boundaries, no fat controllers, no entity leakage, consistent DTOs/naming

- [ ] **Согласовать семантику статусов learning enrollment:** решить, должны ли `PAUSED`/`ARCHIVED` запрещать detail, study и review. После фиксации решения в `docs/features/learning-flow.md` централизовать проверку в одном helper (например, `requireActiveEnrollment()`), чтобы learning endpoints применяли единое правило. Это отдельное Level 2 изменение поведения, не задача Level 1.

**Database quality:** Liquibase fully adopted, `ddl-auto=validate`, indexes, unique constraints, FK checked, cascade strategy documented
- Unique constraints и indexes уже описаны нормативно в `docs/database/relationships.md` §7–8 — не дублировать точные имена таблиц/колонок здесь
- Проверить и реализовать pending index из `docs/database/relationships.md` §8 (`idx_ucp_next_review`); индекс `(user_id, status)` для `user_deck_progress` закрыт в V11 как часть G-06, `idx_cards_deck_id` — в V12 вместе с агрегированным `cardCount`.

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
- [ ] Отделить лимит одиночной AI-генерации от ручного создания карточек: добавить `RateLimitAction.CARD_GENERATE` для `POST /api/v1/card-generations` (ориентир — 10 генераций в час на пользователя) вместо общего bucket `CARD_CREATE`; после переноса authenticated rate limiting на `userId` применять этот лимит через `UserRateLimiter.checkLimitByUserId()`
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

**Frontend performance — отложенные пункты 6–8:**

- [ ] **6. Brotli:** включить на hosting/CDN с gzip fallback; проверить `Content-Encoding`, `Vary: Accept-Encoding`, MIME types и фактические transfer sizes. Не ограничиваться генерацией `.br` файлов без server negotiation.
- [ ] **7. Prefetch:** по измерениям реальных переходов выбрать вероятные следующие маршруты; проверить выигрыш latency и лишний трафик на mobile/ограниченной сети. Не предзагружать все lazy pages автоматически.
- [ ] **8. Регулярный bundle monitoring в CI:** сохранять отчёты и сравнивать размеры/дубли зависимостей с baseline в PR. Использовать существующий `bundle:check`, не создавать вторые лимиты. Локальный build gate и разовый анализ графа уже входят в базовую реализацию; автоматический history/PR monitoring — этот follow-up.

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
- [~] Постепенно переписать существующие сложные Hibernate/JPQL-запросы на PostgreSQL SQL; простые CRUD и derived lookups пока могут оставаться на Spring Data JPA. Статические feature-local запросы размещать в существующем Spring Data repository через `@Query(nativeQuery = true)` с минимальной scalar interface projection; динамические, batch/reporting и требующие ручного маппинга запросы — через `NamedParameterJdbcTemplate`. Deck list queries уже переведены; остальные запросы мигрировать в scope затрагиваемой функции с PostgreSQL Testcontainers regression-покрытием.
- [x] Установить правило: новые сложные `JOIN`, агрегации, отчётные и нетривиальные фильтрующие запросы пишутся на PostgreSQL SQL. Не добавлять JPQL/HQL и `select new ...`; выбирать между статическим `@Query(nativeQuery = true)` и `NamedParameterJdbcTemplate` по сложности и динамичности запроса.
- [ ] Установить правило: Lombok + Constructor Injection вместо `@Autowired` на полях — **вероятно уже стандарт в коде** (см. `@RequiredArgsConstructor` в существующих сервисах), проверить остались ли исключения
- [ ] Вынести `getCurrentUserId` в общий метод/сервис — **вероятно уже сделано** через `SecurityUtils.getCurrentUserId()`/`getCurrentUserEmail()` (см. `backend/AGENTS.md`, `CONVENTIONS.md`), проверить не осталось ли дублей в контроллерах/сервисах
- [ ] Продумать UX и логику прохождения карточек (флэшкарты/quiz/input режимы) — **терминология устарела** (`card_desc` → сейчас `deck`); функционально во многом уже покрыто `docs/features/learning-flow.md` (enroll → study-cards → review → progress), уточнить что именно осталось не реализованным сверх этого
- [ ] Разработать Learning Mode для дек — **терминология устарела** (`card_desc` → `deck`), см. предыдущий пункт; базовый learning mode уже описан в `docs/features/learning-flow.md` и реализован на Level 0
