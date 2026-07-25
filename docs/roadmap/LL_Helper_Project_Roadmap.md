# Project Roadmap

<aside>
🗺️

Рoadmap разбит на 5 уровней — от стабильного бэкенда до продуктового приложения. Каждый уровень — независимый этап с чёткими критериями завершения.

</aside>

## Current Level: Level 0 — Stable Backend Foundation

### Sprint 0.1 — Architecture Freeze

~~1. Остановить добавление новых фич~~
~~2. ~~Описать current architecture~~~~
~~3. Описать DB relationships~~
~~4. Описать current learning flow~~ (`docs/features/learning-flow.md`)
~~5. Описать AI generation flow~~ (`docs/features/ai-generation-flow.md`)

### Sprint 0.2 — Backend Cleanup

~~1. 🔴 Добавить ownership check: только owner может создавать/генерировать cards в deck~~
~~2. Добавить GlobalExceptionHandler (AI exceptions, 403, 404, 409, 429)~~
~~3. Проверить UserDeck/UserCard модель~~
~~4. Принять решение: copy vs reference (документально)~~
~~5. Добавить/почистить DTO~~
~~6. Добавить mappers~~
~~7. 🔴 Добавить ownership check для User операций (update/delete) — **SECURITY CRITICAL**~~
~~**7.2. 🔴 Добавить ownership check для Deck операций (update/delete) — CRITICAL**~~

**8. Добавить Rate limiting на user update операции (защита от abuse)**

Детальный план: `docs/features/rate-limiting-design.md`

~~**8.1. Исправить RateLimiter reset bug (hardcoded 10)**~~
- ~~Файл: `ai/util/RateLimiter.java`~~
- ~~Сохранить `maxRequestsPerSecond` в поле, использовать вместо hardcoded `10`~~
- ~~Unit test на разные значения `maxRequestsPerSecond`~~

~~**8.2. Переместить RateLimitExceededException в common/exception/**~~
- ~~Создать: `common/exception/RateLimitExceededException.java`~~
- ~~Удалить: nested class из `ai/util/RateLimiter.java`~~
- ~~Обновить импорты в `AiCardGenerationService`, `GlobalExceptionHandler`~~

~~**8.3. Добавить Caffeine dependency**~~
- ~~Файл: `backend/pom.xml`~~
- ~~Добавить: `com.github.ben-manes.caffeine:caffeine:3.1.8`~~

~~**8.4. Создать UserRateLimiter (per-user, in-memory, Caffeine Cache)**~~
- ~~Создать: `common/security/UserRateLimiter.java`~~
- ~~Два cache: `userBuckets` (Long), `emailBuckets` (String)~~
- ~~TTL: 1 час~~
- ~~Методы: `checkLimitByUserId()`, `checkLimitByEmail()`~~
- ~~TODO: migrate to userId when JWT subject changes~~

~~**8.5. Rate limiting для User.updateUser() — 5 req/min**~~
- ~~Файл: `user/service/UserServiceImpl.java`~~
- ~~Inject `UserRateLimiter`, вызвать перед ownership check~~
- ~~Добавить `SecurityUtils.getCurrentUserEmail()` (0 DB queries)~~
- ~~Использовать `checkLimitByEmail()` (Level 0, пока JWT subject = email)~~

~~**8.6. Rate limiting для Auth.login() — 5 req/min**~~
- ~~Файл: `auth/service/AuthServiceImpl.java`~~
- ~~`checkLimitByEmail(request.email(), AUTH_LOGIN)` первым в методе~~

~~**8.7. Rate limiting для Auth.register() — 3 req/5min**~~
- ~~Файл: `auth/service/AuthServiceImpl.java`~~
- ~~`checkLimitByEmail(request.email(), AUTH_REGISTER)` первым в методе~~
- ⚠️ временная защита — обходится через разные email. **Level 2: заменить на IP-based (10 req/10min), см. IMPROVEMENTS.md**

~~**8.8. Rate limiting для Card.create() — 20 req/min**~~
- ~~Файл: `card/service/CardServiceImpl.java`~~
- ~~`checkLimitByEmail(getCurrentUserEmail(), CARD_CREATE)` перед ownership check~~

~~**8.9. Rate limiting для Card.update() — 10 req/min**~~
- ~~Файл: `card/service/CardServiceImpl.java`~~
- ~~`checkLimitByEmail(getCurrentUserEmail(), CARD_UPDATE)` перед findById~~

~~**8.10. Rate limiting для Card.delete() — 10 req/min**~~
- ~~Файл: `card/service/CardServiceImpl.java`~~
- ~~`checkLimitByEmail(getCurrentUserEmail(), CARD_DELETE)` перед findById~~

~~**8.11. Rate limiting для Deck.create() — 5 req/hour**~~
- ~~Файл: `deck/service/DeckServiceImpl.java`~~
- ~~`checkLimitByEmail(getCurrentUserEmail(), DECK_CREATE)` первым~~

~~**8.12. Rate limiting для Deck.update() — 10 req/min**~~
- ~~Файл: `deck/service/DeckServiceImpl.java`~~
- ~~`checkLimitByEmail(getCurrentUserEmail(), DECK_UPDATE)` перед ownership check~~

~~**8.13. Rate limiting для Deck.delete() — 5 req/hour**~~
- ~~Файл: `deck/service/DeckServiceImpl.java`~~
- ~~`checkLimitByEmail(getCurrentUserEmail(), DECK_DELETE)` перед ownership check~~

~~**8.14. Добавить @ExceptionHandler для RateLimitExceededException → HTTP 429**~~
- ~~Файл: `common/exception/GlobalExceptionHandler.java`~~
- ~~Response: `{ "error": "RATE_LIMIT_EXCEEDED", "message": "...", "timestamp": "..." }`~~

~~**8.15. Обновить Postman collection — тесты на HTTP 429**~~ — **заменено @WebMvcTest**
- ~~Файл: `LLHelper.postman_collection.json`~~
- ~~Тесты на каждый protected endpoint (6+ requests → 429)~~
- 429 сценарии покрыты в `AuthControllerTest.login_shouldReturn429_whenRateLimitExceeded()` (Sprint 0.4, Группа 1b.5)

~~**8.16. Обновить документацию**~~
- ~~`docs/architecture/current-architecture.md` — секция "Rate Limiting"~~
- ~~`docs/roadmap/LL_Helper_Project_Roadmap.md` — отметить задачи как выполненные~~
- ~~`backend/CONVENTIONS.md` — правила rate limiting~~

~~9. Убрать entity leakage из API~~
- ~~Раскомментировать `sourceLanguage`, `targetLanguage` в `DeckResponse`~~
- ~~Добавить `@Transactional(readOnly = true)` на `DeckServiceImpl.getById()` и `getAll()`~~
- ~~Перенести ручное создание `Card` в `CardServiceImpl.createBulk()` в `CardMapper.fromAiData()`~~
- ~~Перенести ручное создание `CardReviewResponse` в `LearningMapper.toCardReviewResponse()`~~
~~10. Добавить validation~~
~~11. Исправить RateLimiter reset bug (hardcoded 10)~~ — включено в задачу 8.1
~~12. Вызвать `validateBulkSize()` в `CardServiceImpl.createBulk()`~~
~~13. Добавить logging для bulk failures~~
~~14. Переименовать `CardDesc → Deck` в Java (entity, package, controller, DTO) — с rename таблицы `card_descs → decks` вручную~~
~~15. настрой hotkeys для IDE~~

### Sprint 0.3 — Database Control

~~1. Добавить Liquibase~~
~~2. Создать V1 migration (текущее состояние схемы как baseline)~~

**🔴 Критические проблемы безопасности и производительности:**

~~**Проблема №1: Отсутствие unique constraint на enrollment**~~ — ✅ **РЕШЕНО**
- ~~**Риск:** Двойная запись пользователя на один deck → дублированный progress~~
- ~~**Решение:** Добавить `UNIQUE(user_id, deck_id)` на `user_deck_progress`~~ — V2 migration
- ~~**Race condition:** `existsByUserIdAndDeckId` check не атомарен~~ — исправлено через `DataIntegrityViolationException` handling в `LearningServiceImpl.enrollDeck()`
- **Приоритет:** ~~🔴 CRITICAL~~ → ✅ DONE

~~**Проблема №2: Неполная FK политика**~~ — ✅ **РЕШЕНО**
- ~~**Риск:** user_id в progress таблицах не защищен FK → orphaned records при удалении пользователя~~
- ~~**Решение:** Добавить FK constraints:~~
  - ~~`user_deck_progress.user_id → users.id`~~ — ✅ V4 migration (`fk_udp_user`, ON DELETE CASCADE)
  - ~~`user_card_progress.user_id → users.id`~~ — ✅ V4 migration (`fk_ucp_user`, ON DELETE CASCADE)
- **Приоритет:** ~~🔴 HIGH~~ → ✅ DONE

~~**Проблема №3: Недостаточно индексов для learning flow**~~ — **ОТЛОЖЕНО на Level 2**
- **Приоритет:** ~~🟡 MEDIUM~~ → **Level 2** (не критично для MVP; критичные unique constraints и FK уже добавлены)
- **Текущее состояние:** V1 baseline добавил `idx_ucp_user_deck`, `idx_ucp_user_card` (unique). Остальные индексы перенесены в Level 2 (см. секцию "Индексация БД")

**Плановые задачи:**
~~3. Добавить `UNIQUE(user_id, deck_id)` на `user_deck_progress` (Проблема №1) — V2 migration~~
~~4. Добавить `UNIQUE(user_deck_progress_id, card_id)` на `user_card_progress` — V3 migration~~
~~5. Добавить FK constraints для learning layer:~~
   - ~~user_deck_progress → decks, user_card_progress → cards~~ (сделано в V1)
   - ~~**user_deck_progress.user_id → users.id** (Проблема №2)~~ — V4 migration, ON DELETE CASCADE
   - ~~**user_card_progress.user_id → users.id** (Проблема №2)~~ — V4 migration, ON DELETE CASCADE
~~6. Принять решение по delete behavior (RESTRICT vs CASCADE vs soft delete) для Card/Deck~~ — **CASCADE принят для MVP (V5 migration)**; soft delete отложен на Level 1
~~7. Реализовать CASCADE delete для Deck/Card (защита целостности + удаление прогресса) — V5 migration~~
8. ~~Добавить pending indexes~~ — **отложено на Level 2** (не критично для MVP; критичные unique constraints и FK уже добавлены). Оставшиеся: `idx_decks_owner`, `idx_ucp_due_cards` + pending из V1
~~9. Проверить реальную DB схему через `information_schema` (nullable, FK, indexes, constraints)~~
~~10. Переключить `ddl-auto` с `update` на `validate`~~
~~11. Решить стратегию `CascadeType.ALL` на `Deck → Cards` (убрать или заменить на explicit cascade)~~ — оставлен, выровнен с DB CASCADE в V5
~~12. Определить cascade стратегию при удалении `User` (AuthUser → User → Deck → Progress)~~ — **частично**: User → UserDeckProgress → UserCardProgress CASCADE в V4; Deck→Progress CASCADE в V5 (задача 6 ✅). AuthUser→User отложено на Level 1 (задача 13)
13. ~~Исправить orphan: удаление `AuthUser` не каскадирует на `User`~~ — **отложено на Level 1** (неактуально до реализации `DELETE /api/v1/me`; вместе с `fk_decks_owner` и soft delete)
~~14. Переименовать таблицу `card_descs → decks` (выполнено вручную, до Liquibase)~~
~~15. Рассмотреть language enum вместо VARCHAR для `sourceLanguage`/`targetLanguage`~~ — ✅ реализовано: Java enum `Language` + `@Enumerated(STRING)` + DB CHECK constraints (V6 migration)
~~16. **Исправить FK delete rules** для `fk_decks_owner`, `fk_users_auth_user` (сейчас `NO ACTION`; `fk_cards_deck` уже CASCADE в V5)~~ — **отложено на Level 1**: `fk_users_auth_user` + `fk_decks_owner` решаются вместе при реализации `DELETE /api/v1/me` + soft delete (задача 13)
~~17. **Перейти от inline FK к `addForeignKeyConstraint`** в Liquibase для поддержки `onDelete: RESTRICT` и единообразия~~ — **частично выполнено**: V4–V6 используют explicit FK style; V1 inline FK (`fk_users_auth_user`, `fk_decks_owner`, `fk_cards_deck`) не переписываем (migration immutability); будущие миграции (V7+) должны использовать только explicit FK (см. `.windsurf/rules/database-schema-ownership.md` → Liquibase migration conventions)
~~18. **Добавить CHECK constraints** на неотрицательные счётчики в `user_card_progress` (`times_seen >= 0`, `times_correct >= 0`, `times_wrong >= 0`, `correct_streak >= 0`)~~ — ✅ выполнено в V7: добавлены 4 CHECK constraints для защиты от отрицательных значений
~~19. **Решить конфликт unique constraint для `user_card_progress`**: удалён `idx_ucp_user_card` (UNIQUE(user_id, card_id)), добавлен `uk_user_card_progress_deck_card` (UNIQUE(user_deck_progress_id, card_id)) — V3 migration~~
~~20. **Удалить дублирующий индекс** `idx_user_auth` на `users.auth_user_id` (оставить `uk_users_auth_user_id`)~~ — ✅ выполнено в V8: добавлен `preConditions` для идемпотентности, индекс удалён (unique constraint `uk_users_auth_user_id` автоматически создаёт индекс)
~~21. **Синхронизировать имена индексов/constraint**: entity `User` ожидает `idx_user_username`, а в БД constraint называется `uk_users_username`~~ — **НЕАКТУАЛЬНО:** entity не должны содержать constraint annotations (database-schema-ownership policy). В БД используется `uk_users_username` (unique constraint). Добавлена секция "Database Naming Conventions" в `.windsurf/rules/database-schema-ownership.md` для стандартизации имён constraints/indexes в будущих миграциях (V9+)
~~22. **Добавить `@ForeignKey` аннотацию в `Card` entity** для `fk_cards_deck` (сейчас FK неявный, в отличие от `Deck`)~~ — ✅ выполнено: добавлены `@ForeignKey(name = "fk_cards_deck")` в `Card` и `@ForeignKey(name = "fk_users_auth_user")` в `User` для единообразия с `Deck` и явного указания имён FK constraints
~~23. **Добавить `@Index` аннотации в `UserDeckProgress` / `UserCardProgress` entities** для соответствия физической схеме БД~~ — **НЕАКТУАЛЬНО:** Liquibase ownership policy установлена — entity не должны содержать `@Index`, `@UniqueConstraint`, `@CheckConstraint`. См. `docs/database/schema-ownership.md`
~~24. **Убрать дублирующие DB constraints из entity классов (Liquibase — единственный источник истины)**~~ — ✅ **ВЫПОЛНЕНО** (2026-07-06): удалены `@Table(uniqueConstraints, indexes, check)` из `UserCardProgress`, `UserDeckProgress`, `User`; удалён `@ColumnDefault` из `AuthUser`. Создан `docs/database/schema-ownership.md` (полная версия) и `.windsurf/rules/database-schema-ownership.md` (краткая версия).
~~25. **Убрать `defaultValue: ''`** для `decks.source_language` / `target_language` или добавить CHECK constraint~~ — ✅ выполнено в V6: DROP DEFAULT + enum CHECK constraint
~~26. **Перенести `created_at` / `updated_at` на PostgreSQL DEFAULT / trigger** — сейчас timestamps зависят только от `@PrePersist` / `@PreUpdate` в Java~~ — ✅ **ВЫПОЛНЕНО** (V9 + V10): 
   - **V9:** technical timestamps (`created_at`, `updated_at`) для `users`, `auth_users`, `decks`, `cards` → `timestamptz` + DEFAULT CURRENT_TIMESTAMP + triggers; entities обновлены на `java.time.Instant` с `insertable=false, updatable=false`; удалены `@PrePersist/@PreUpdate`
   - **V10:** business timestamps (`last_studied_at`, `last_reviewed_at`, `next_review_at`) для `user_deck_progress`, `user_card_progress` → `timestamptz` с явным `AT TIME ZONE 'Asia/Jerusalem'`; entities обновлены на `Instant` БЕЗ `insertable=false, updatable=false` (application-managed)
   - Добавлены секции "Business timestamps vs Technical timestamps" и "Migrating existing TIMESTAMP to TIMESTAMPTZ" в `docs/database/schema-ownership.md` и `.windsurf/rules/database-schema-ownership.md`

> **Note:** Тестирование миграций (smoke tests, rollback) отложено на Sprint 0.4.

### Sprint 0.4 — Testing (Level 0 Minimum)

**Цель:** Unit tests + Controller tests + Postman smoke. Без Testcontainers и интеграционных тестов — это Level 2.

> **Принцип Level 0:** Unit test сервиса и @WebMvcTest контроллера для одной фичи пишутся **вместе**.

**Группа 0: Инфраструктура тестов (выполняется первой)**

> Без этой группы нельзя писать тесты.

~~**0.1. Добавить Testcontainers в `pom.xml`**~~ — ✅ DONE (`org.testcontainers:postgresql` + `junit-jupiter`, 1.20.4)

~~**0.2. Создать `common/support/TestData.java`** — cross-domain fixtures~~ — ✅ DONE
   - ~~`fixedClock()` — `Clock.fixed(Instant.parse("2024-01-01T10:00:00Z"), ZoneOffset.UTC)`~~

~~**0.3. Создать `ApplicationContextLoadsTest.java`** — DB smoke с Testcontainers~~ — ✅ DONE
   - ~~`contextLoads_shouldStartApplication_withPostgres()` — Liquibase миграции V1–V10 запускаются на чистой PostgreSQL, schema валидна~~
   - Без этого теста неизвестно работают ли TIMESTAMPTZ, триггеры, CHECK constraints на чистой БД
   - Docker недоступен в текущей dev-среде — тест не запускался локально, только скомпилирован. Требует проверки на машине с Docker.

~~**0.4. Внедрить Clock в `LearningServiceImpl`**~~ — ✅ DONE
   - ~~Добавить `private final Clock clock;` в конструктор~~
   - ~~Заменить `Instant.now()` на `Instant.now(clock)`~~
   - ~~Добавить `@Bean Clock clock() { return Clock.systemUTC(); }` в Spring config~~ (`AppConfig`)

**Группа 1: Unit Tests (критичная бизнес-логика)**

~~**1.1. LearningServiceImpl tests**~~ — ✅ DONE — `LearningServiceImplTest.java`
   - ~~`enroll_shouldCreateProgress_whenNotEnrolled()` — успешный enroll~~
   - ~~`enroll_shouldThrowConflict_whenAlreadyEnrolled()` — повторный enroll → 409~~
   - ~~`enroll_shouldThrowNotFound_whenDeckDoesNotExist()` — deck не существует → 404~~
   - ~~`review_shouldIncrementCorrect_whenResultIsCorrect()` — correct answer → `timesCorrect++`, `correctStreak++`~~
   - ~~`review_shouldResetStreak_whenResultIsWrong()` — wrong answer → `timesWrong++`, `correctStreak = 0`~~
   - `review_shouldCalculateNextReview_basedOnDifficulty()` — **пропущен** (логика `nextReviewAt` не реализована в `LearningServiceImpl`)
   - ~~`review_shouldThrowNotFound_whenProgressDoesNotExist()` — progress не существует~~ (актуально бросает `IllegalStateException` → 409, см. `docs/features/learning-flow.md`)
   - ~~`review_shouldTransitionToLearning_whenNewCardReviewed()` — `NEW` → `LEARNING`~~
   - ~~`review_shouldTransitionToMastered_whenThresholdReached()` — достижение `MASTERED`~~
   - ~~**Требование:** внедрить `Clock` injection в `LearningServiceImpl` для точного тестирования `nextReviewAt`~~ — уже сделано (см. пункт 0.4 выше)

**1.2. UserRateLimiter tests** — `UserRateLimiterTest.java`
   - `tryConsume_shouldAllow_whenUnderLimit()` — запросы в пределах лимита → успех
   - `tryConsume_shouldThrow_whenOverLimit()` — превышение лимита → `RateLimitExceededException`
   - `tryConsume_shouldSeparateBuckets_forDifferentUsers()` — разные пользователи → независимые buckets
   - `tryConsume_shouldSeparateBuckets_forDifferentActions()` — разные `RateLimitAction` → независимые buckets
   - `reset_shouldClearBucket_whenCalled()` — автоматически отключить через `@Disabled("Known bug: reset() does not clear bucket, see issue #N")` если баг не исправлен

**1.3. Ownership checks tests** — security-critical
   - `DeckServiceImplTest.update_shouldThrowForbidden_whenUserIsNotOwner()` — только owner может update deck
   - `DeckServiceImplTest.delete_shouldThrowForbidden_whenUserIsNotOwner()` — только owner может delete deck
   - `CardServiceImplTest.create_shouldThrowForbidden_whenUserIsNotDeckOwner()` — только deck owner может create card
   - `CardServiceImplTest.generateBulk_shouldThrowForbidden_whenUserIsNotDeckOwner()` — только deck owner может generate cards
   - `UserServiceImplTest.update_shouldThrowForbidden_whenUserIsNotSelf()` — только сам пользователь может update себя
   - `UserServiceImplTest.delete_shouldThrowForbidden_whenUserIsNotSelf()` — только сам пользователь может delete себя

**1.4. Bulk validation test** — `CardServiceImplTest.java`
   - `generateBulk_shouldThrowBadRequest_whenSizeExceedsLimit()` — проверка `validateBulkSize()` (> 50 → 400)

**1.5. AI parser tests** — `AiResponseParserTest.java`
   - `parseResponse_validJson_shouldReturnAiCardData()` — корректный JSON → `AiCardData`
   - `parseResponse_invalidJson_shouldThrowException()` — некорректный JSON → exception

**Группа 1b: Controller Tests (@WebMvcTest) — параллельно с Группой 1**

> Сервис замокан через `@MockitoBean` (Spring Boot 4.x). Нет реальной БД, нет full Spring context. Цель: автоматизировать проверку HTTP статусов, validation и GlobalExceptionHandler.

**1b.1. LearningControllerTest** — `LearningControllerTest.java`
   - `enroll_shouldReturn200_whenSuccess()` — успешный enroll
   - `enroll_shouldReturn404_whenDeckNotFound()` — deck не существует → 404
   - `enroll_shouldReturn409_whenAlreadyEnrolled()` — повторный enroll → 409
   - `review_shouldReturn200_whenSuccess()` — успешный review
   - `review_shouldReturn404_whenProgressNotFound()` — progress не существует → 404

**1b.2. DeckControllerTest** — `DeckControllerTest.java`
   - `create_shouldReturn201_whenValid()` — успешное создание
   - `create_shouldReturn400_whenTitleIsBlank()` — пустой title → 400
   - `update_shouldReturn403_whenUserIsNotOwner()` — не owner → 403
   - `getById_shouldReturn404_whenDeckNotFound()` — deck не существует → 404

**1b.3. CardControllerTest** — `CardControllerTest.java`
   - `create_shouldReturn201_whenValid()` — успешное создание
   - `create_shouldReturn403_whenUserIsNotDeckOwner()` — не owner → 403
   - `generateBulk_shouldReturn400_whenSizeExceedsLimit()` — bulk > 50 → 400

**1b.4. UserControllerTest** — `UserControllerTest.java`
   - `update_shouldReturn400_whenRequestInvalid()` — невалидный request → 400
   - `update_shouldReturn403_whenUserIsNotSelf()` — не сам пользователь → 403

**1b.5. AuthControllerTest** — `AuthControllerTest.java`
   - `register_shouldReturn201_whenValid()` — успешная регистрация
   - `register_shouldReturn400_whenEmailInvalid()` — невалидный email → 400
   - `login_shouldReturn200_whenCredentialsValid()` — успешный login
   - `login_shouldReturn429_whenRateLimitExceeded()` — rate limit → 429

**Группа 2: Postman (smoke testing)**

> HTTP контракт автоматизирован через @WebMvcTest. Postman остаётся только для ручного smoke-тестирования на живом сервере.

6. **Актуализировать Postman collection** — проверить все endpoints из `current-architecture.md`
   - Добавить недостающие endpoints (если есть)
   - Убедиться, что все requests работают на живом сервере
   - Без автоматических тест-скриптов — только корректные requests

**Группа 3: Domain-specific fixtures**

10. **Создать `learning/support/LearningTestData.java`**
    - `defaultProgress()` — базовый `UserCardProgress` (важные для сценария поля — явно в тесте, не в fixture)
    - Добавить аналогичные файлы для других модулей по мере роста покрытия

**Группа 4: Критичные долги**

12. ~~**Smoke test для Liquibase migrations** — ручная проверка~~ **заменено `ApplicationContextLoadsTest` (Группа 0)**

13. **Проверить все 500 ошибки → специфические HTTP коды**
    - Найти: `throw new RuntimeException` в коде
    - Заменить: на правильные типы exception (`NotFoundException`, `ConflictException`, etc.)
    - Проверить: маппинг покрыт `@WebMvcTest` тестами в Группе 1b — code review не доказывает что handler зарегистрирован

**Группа 5: Documentation**

14. **Обновить roadmap: отметить Sprint 0.4 как завершённый**
    - Отметить все задачи Sprint 0.4
    - Синхронизировать Done Criteria Level 0 (проставить [x] на реально выполненные задачи)

15. **Разделить roadmap на отдельные файлы (post-Sprint-0.4 cleanup)**
    - Создать `docs/roadmap/changelog.md` — перенести историю Sprint 0.1–0.3 (все зачёркнутые задачи)
    - Создать `docs/roadmap/current-sprint.md` — только активные задачи текущего sprint'а
    - Создать `docs/roadmap/backlog.md` — Level 1+ product backlog и техдолг
    - Обрезать `LL_Helper_Project_Roadmap.md` до уровней + Done Criteria (~1-2 стр.)
    - Обновить `.windsurf/rules/project-roadmap.md` memory (статус спринтов устарел)

**Итого: ~19 задач, ~12-15 часов работы**

**Приоритет выполнения:**
1. Группа 3 (Clock injection, TestData) — инфраструктура, без неё нельзя писать тесты
2. Группа 1.1 + 1b.1 (LearningService + LearningController) — критичная бизнес-логика **параллельно**
3. Группа 1.2 (UserRateLimiter) — security
4. Группа 1.3 + 1b.2-1b.4 (Ownership unit + DeckController, CardController, UserController) — security-critical **параллельно**
5. Группа 1b.5 (AuthControllerTest) — HTTP auth контракт
6. Группа 1.4, 1.5 (Bulk validation, AI parser) — дополнительные unit-тесты
7. Группа 2 (Postman) — ручной smoke
8. Группа 4 (Долги) — cleanup
9. Группа 5 (Docs) — финализация

### Sprint 1.0 — Vertical Flow

> **Цель:** Впервые связать frontend, backend, auth и database в одну живую систему.
> Один вертикальный сценарий — Register → Login → Create deck → Add cards → Enroll → Study → See progress.
> UI может быть простым. Цель — не красивый Dashboard, а работающий full-stack flow.

1. Создать React/TS app
2. Настроить routes и API client
3. Login / Register
4. Create deck + Add cards
5. Enroll + Study + See progress

### Sprint 1.1 — First Deployment (Level 1.5)

> **Цель:** Сразу после работающего вертикального flow — собрать и запустить систему в интернете.
> Это первый инженерный цикл: собрал → задеплоил → видишь работающую систему в браузере.

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

1. Создать ER-диаграмму текущей схемы БД
   - Формат: Mermaid (интеграция в Markdown)
   - Разместить в `docs/database/relationships.md`
   - Показать двухслойную архитектуру: Content Layer + Learning Layer
   - Отметить FK constraints с RESTRICT правилами
   - Визуализировать cascade риски (Deck → Cards)
2. Обновить `docs/architecture/current-architecture.md` с ссылкой на ER-диаграмму
3. Подготовить архитектурную схему для портфолио/собеседований

### Sprint 1.3 — AI Workflow & Agent Infrastructure

> **Цель:** Настроить AI-инфраструктуру так, чтобы она помогала, а не тормозила работу лишним контекстом.
> Изучить архитектуру Windsurf и научиться строить AI-инфраструктуру проекта.

**Группа 1: Понять архитектуру**

1. Изучить как работают вместе: AGENTS.md, rules, memory, skills, workflows
   - Что грузится в каждый запрос и почему
   - Разница между `always_on` и `glob` триггерами
   - Когда использовать `skill` vs `workflow` vs простой промпт
2. Оптимизировать rules-файлы
   - Аудит размеров: текущий тотал ~40кб всегда-загружаемых правил
   - Перевести документационные разделы из rules в `docs/`, оставить в rules только оперативные правила
   - Цель: rules файлы не должны превышать 5кб ценных разделов с always\_on

**Группа 2: Создать skills**

3. **`create-test-file` skill** — генерация unit + @WebMvcTest шаблона для модуля
   - Также генерировать `TestData` fixtures для нового entity
4. **`add-liquibase-migration` skill** — шаблон changeset с правильным именованием и FK-стилем
5. **Обновить `create-design-note` skill** — адаптировать шаблон под текущие нужды проекта

**Группа 3: Обновить workflows**

6. **Обновить `pre-commit-review.md` workflow**
   - Добавить проверку test coverage в Test impact секцию (Sprint 0.4 done?)
   - Добавить ссылку на `.windsurf/rules/testing-conventions.md`
7. **Создать `start-sprint.md` workflow** — что проверяет перед началом нового sprintа

**Итого:** понять AI-инфраструктуру не как магию, а как инструмент с чёткой механикой и ограничениями.

---

# 🧠 Skill Map

*Какой уровень продукта = какой уровень знаний нужен*

| **Level** | **Главный фокус знаний** | **Твой статус** |
| --- | --- | --- |
| Level 0 | Spring / JPA / DB / API cleanup / tests / docs | Уже можешь делать, но нужно систематизировать |
| Level 1 | Один вертикальный full-stack flow (React + backend + auth + DB) | Начинать после backend stabilization |
| Level 1.5 | Docker, CI, первый деплой, HTTPS, env config, health checks | Сразу после работающего вертикального flow |
| Level 2 | Testcontainers, Swagger, security depth, полный frontend, architecture review | После первого deployment |
| Level 3 | Monitoring, staging, refresh tokens, e2e, real users, AI architecture | Логичный следующий уровень |
| Level 4 | SaaS, payments, roles, marketplace, AI cost optimization | Далёкий advanced/product level |

## Level 0 — Что ты должен знать

### Backend

- Java basics
- Spring Boot basics
- Controller / Service / Repository
- DTO, Mapper
- JPA / Hibernate basics
- Entity relationships
- Cascade / orphanRemoval
- Transactions basics

### Database

- PostgreSQL basics: tables, foreign keys, unique constraints, not null, basic indexes
- Basic SQL: SELECT / JOIN / WHERE
- Liquibase basics

### API

- REST basics, HTTP methods
- Status codes: 200 / 201 / 400 / 401 / 403 / 404 / 409 / 500
- Request DTO, Response DTO, validation errors
- Postman

### Security

- Basic Spring Security
- JWT basics
- Authentication vs authorization (на простом уровне)
- Ownership checks

### Testing

- JUnit, Mockito basics
- Unit tests for service logic

### AI workflow

- Manual prompts
- AI code review
- AI-generated Postman draft
- AI-generated design notes
- AI-suggested tests

### Уровень владения

Не надо быть экспертом. Достаточно понимать, чтобы:

- Я сам могу объяснить, как работает backend
- Я понимаю свои entity и связи в базе
- Я не возвращаю entity наружу
- Я могу написать базовые unit tests

## Level 1 — Что ты должен знать

### Backend

- REST API design, learning flow
- Progress calculation, basic spaced repetition
- Basic AI generation validation
- Pagination basics (optional)

### Frontend

- React, TypeScript, React Router
- TanStack Query / React Query
- Axios or fetch wrapper
- Forms, protected routes
- Basic component architecture
- Loading / error states

### API integration

- How frontend talks to backend
- JWT storage/use
- API client layer
- Handling 401/403 and validation errors

### AI

- OpenAI/API request basics
- Prompt basics, JSON response validation
- Batch generation basics
- Error handling for AI failure

### AI workflow

- `/ai-workflows/*.prompt.md`, reusable prompts
- Git diff manually passed to AI
- AI suggests tests / design notes / Postman updates

### Уровень владения

Уметь собрать **full-stack loop**: backend endpoint → frontend screen → request → response → state update → error handling

## Level 2 — Что ты должен знать

### Backend architecture

- Clean service responsibilities, transaction boundaries
- Domain-based package structure
- No fat controllers, no entity leakage
- Consistent DTO naming, basic ADR

### Database

- Liquibase properly, `ddl-auto=validate`
- Indexes, unique constraints, FK, cascade strategy
- Query performance basics

### Security

- Spring Security filter chain basics, SecurityContext
- JWT structure, password hashing, CORS
- Endpoint authorization, ownership checks, forbidden access cases

### Testing

- JUnit 5 + Mockito + AssertJ: unit tests + @WebMvcTest (Level 0 done)
- @DataJpaTest + Testcontainers PostgreSQL: repository tests with real DB
- @SpringBootTest + Testcontainers: integration tests for critical flows
- Security tests: 403 ownership scenarios
- CI: tests run on every PR via GitHub Actions

### API docs

- OpenAPI / Swagger
- Postman vs Swagger relationship

### DevOps

- Dockerfile, docker-compose, .env
- Local PostgreSQL in Docker
- GitHub Actions: build pipeline, test pipeline

### Frontend

- Stable UI architecture
- Form validation, protected routes, reusable components
- React Testing Library basics, responsive layout

### AI workflow & Agent Infrastructure

- Понимать архитектуру Windsurf: AGENTS.md, rules (always\_on vs glob), skills, workflows, memory
- Оптимизировать контекст: какие правила грузить всегда, какие — только при работе с нужными файлами
- Создавать skills для повторяющихся задач (generate test, create entity, add migration)
- Pre-commit workflow
- Scripts for changed files / AI context generation

### Уровень владения

**Middle / Strong Middle portfolio.** Не просто "сделать", а уметь объяснить: почему такая архитектура, такие таблицы, как работает auth, как запустить через Docker, как CI проверяет проект.

## Level 3 — Что ты должен знать

### Product engineering

- Onboarding, landing page
- Public/private resources, sharing model, copy/fork model
- User settings, better UX around errors

### Backend

- StudySession / StudySessionAnswer modeling
- History tables, soft delete, pagination everywhere
- Refresh token flow, rate limiting
- Logging, health checks, monitoring basics, backup strategy

### AI architecture

- AIProvider abstraction, provider interface
- OpenAI provider, fallback provider (optional)
- Prompt templates, prompt versioning
- Schema validation, retry strategy, cost estimation, generation history

### Testing

- More integration tests, frontend integration tests
- Playwright basics, mocking AI services
- Security tests, critical user flow tests

### DevOps / deployment

- Real deployment, staging vs production config
- Environment variables, database backup
- Logs, health checks, basic monitoring, release process

### AI workflow

- `project-review` script, PR template
- CI-assisted workflow
- AI review as advisory tool

### Уровень владения

Level 3 — это уже не "я умею кодить". Это: *я понимаю, как приложение живёт у реальных пользователей.*

## Level 4 — Что ты должен знать

### Product / SaaS

- Subscriptions, usage limits, paid plans
- Admin panel, analytics
- Teacher/student workflows, marketplace/library model
- Commercial onboarding

### Backend architecture

- Organizations / classrooms, roles and permissions
- Advanced authorization, payments, subscription plans
- Audit logs, card/deck versioning, multi-tenant thinking

### AI product architecture

- AI usage billing, AI cache, lexical database
- Prompt evaluation, multi-provider AI, cost optimization
- Regeneration by field, user feedback loop, quality scoring

### Frontend

- PWA basics, mobile-first design
- Complex dashboards: teacher, student progress, admin, analytics UI

### DevOps / production

- Production monitoring, alerts, backup/restore
- Scaling basics, secure secrets management
- Release/versioning process, payment webhooks, incident thinking

### Legal / business basics

- Privacy policy, terms of use, payment provider rules
- Data ownership, AI cost control, basic GDPR/privacy awareness

### Уровень владения

Level 4 — это уже не учебный pet project. Это почти SaaS.

---

# Level 0 — Stable Backend Foundation

**Цель:** Понять, что ты строишь. Стабильный, чистый backend без дыр в архитектуре.

## Тесты: бизнес-ядро

Только три теста на Level 0:

- `LearningProgressServiceTest`
- `ReviewCardServiceTest`
- `AiResponseParserTest`

Проверить переходы:

- `NEW` → `LEARNING`
- `LEARNING` → `REVIEW`
- `REVIEW` → `MASTERED`
- Неверный ответ сбрасывает / увеличивает `wrongCount`
- `consecutiveCorrectCount` работает корректно

## AI Workflow (manual)

На Level 0 AI помогает вручную:

- Generate Postman collection
- Generate design notes
- Review changed files
- Suggest tests

Без CI/CD автоматизации. Ты явно говоришь AI, какие файлы изменились — AI обновляет docs/postman/tests.

## ✅ Done Criteria

- [x]  Есть `docs/architecture/current-architecture.md`
- [x]  Есть `docs/database/relationships.md`
- [ ]  Понятно, где content, а где progress
- [ ]  DTO не возвращают entity наружу
- [ ]  Есть mapper layer
- [x]  Есть Liquibase V1 baseline
- [ ]  Есть GlobalExceptionHandler
- [ ]  Есть validation
- [ ]  Есть Postman collection
- [ ]  Есть unit tests на learning/progress/AI parsing/rate limiting/ownership (15-20 тестов)
- [ ]  Можешь объяснить backend без подсказки AI

# Level 1 — Vertical Full-Stack Flow

> **Решение (2026-07):** Level 1 начинается с одного вертикального сценария, а не с полного набора frontend-экранов.
> Цель не красивый product — а впервые пройти полный путь: frontend → backend → auth → DB → живая система.
> Остальные экраны (Dashboard, AI generation, Card Editor, Progress) — расширение после первого деплоя.

**Цель:** Один работающий full-stack flow + первый самостоятельный deployment системы.

## Product flow

1. Register/Login
2. Create deck
3. Add/generate cards
4. Subscribe/enroll to deck
5. Study 10 cards
6. Submit answers
7. See correct/wrong
8. See progress
9. Return later and continue

## Backend improvements

- ~~Переименовать `CardDesc* → Deck*` в Java коде (entity, package, controller, service, DTO) — таблица БД переименована в `decks` вручную~~
- **🔴 Добавить `@Transactional` на `CardServiceImpl.delete()` и `update()`** — оба метода делают несколько DB-запросов без транзакции (findById + findWithOwnerById + deleteById/save). Риск: при partial failure нет rollback
- **Добавить `deckId` валидацию при удалении/обновлении карты** — эндпоинты `DELETE /cards/{id}` и `PUT /cards/{id}` не проверяют, что карта принадлежит конкретному деку из контекста запроса. Вариант B: добавить `card.getDeckId() == deckId` проверку. Может потребовать рефактор URL на `/decks/{deckId}/cards/{cardId}`
- Pagination для `DeckCardResponse.cards` — при большом количестве карточек в деке
- Создать `CardWithDeckResponse` DTO — для endpoint'ов где нужна полная информация о deck вместе с card (например, `GET /cards/{id}` с полной инфой о родительской деке)
- Добавить `cardCount` в `DeckListResponse` — использовать `@Formula` в entity или отдельный query для эффективного подсчёта карточек без загрузки всего списка
- ~~**🔴 BREAKING CHANGE:** Добавить `sourceLanguage`, `targetLanguage` в `CardDescResponse`~~ — выполнено в Sprint 0.2 Task 9

## Backend

**Learning API:**

- `GET /api/v1/user-decks/{userDeckId}/study-cards?limit=10`
- `POST /api/v1/user-cards/{userCardId}/answer`
- `GET /api/v1/user-decks/{userDeckId}/progress`

**Review logic (минимум):** trim / lowercase / remove extra spaces + manual override

**Progress logic:**

- `NEW` → 1 answered → `LEARNING`
- 2 correct → `REVIEW`
- 3 correct in a row → `MASTERED`
- wrong → reset consecutive correct
- `nextReviewAt`: wrong → +10 min / correct #1 → +1d / correct #2 → +3d / correct #3 → +7d / mastered → +30d

**AI generation:** generate card by word, generate deck by word list, basic batching, basic validation
- [ ] Добавить корректные DTO для AI generation req/res — сейчас `BulkCardGenerateRequest` возвращает `List<CardResponse>` (общий DTO), вместо этого должен быть специализированный `BulkGenerateResponse` со статусом для каждого тайтла (success/failed/reason). Аналогично для single generation: `AiCardGenerateRequest` и `AiCardGenerateResponse`
- [ ] Вернуть partial response для bulk failures — `BulkGenerateResponse` содержит `created[]` (CardResponse) и `failed[]` (title + reason). Пользователь видит, какие карточки не создались и почему, вместо silent skip.

**User self-service API:**

- `GET /api/v1/me` — получить профиль текущего пользователя
- `PUT /api/v1/me` — обновить свой профиль (вместо `PUT /api/v1/users/{id}` с ownership check)
- `DELETE /api/v1/me` — удалить свой аккаунт
- При `DELETE /api/v1/me`: решить FK delete rules для `fk_users_auth_user` (AuthUser → User) и `fk_decks_owner` (User → Deck). Варианты:
  - Soft delete: User/AuthUser/Deck помечаются как deleted, FK остаются NO ACTION
  - Hard delete + CASCADE: `fk_users_auth_user` CASCADE (AuthUser удаляется с User), `fk_decks_owner` CASCADE (колоды удаляются с User)
  - Hard delete + RESTRICT: запретить удаление User если есть колоды
  - Рекомендация: soft delete (Sprint 0.3 задачи 13, 16)

**Rate Limiting tests:**

- Unit tests для `UserRateLimiter` — проверка корректной работы rate limiting по userId и email
  - Тест: N запросов в пределах лимита → успех
  - Тест: N+1 запрос → `RateLimitExceededException`
  - Тест: разные `RateLimitAction` с разными лимитами работают независимо
  - Тест: TTL корректно очищает buckets через 1 час
  - Тест: разные пользователи имеют независимые buckets
  - Тест: `checkLimitByUserId()` и `checkLimitByEmail()` работают независимо

## Frontend

Стек: React + TypeScript + React Router + TanStack Query + Axios

Экраны: Login/Register · Dashboard · My Decks · Deck Details · Create Deck · Card Editor · AI Generate Cards · Study Mode · Progress Page

Архитектура:

```
src/
  api/
  features/ (auth, decks, cards, learning, ai)
  components/
  routes/
  types/
```

**Пока без:** Redux, Storybook, e2e tests, микрофронтендов

## Performance

- **🔴 HIGH: JWT userId claim** — `SecurityUtils.getCurrentUserId()` делает 2 DB queries на каждый endpoint
  - Изменить: `JwtService.generateToken()` — добавить `userId` claim
  - Изменить: `JwtAuthenticationFilter` — извлекать `userId` из токена
  - Изменить: `SecurityUtils.getCurrentUserId()` — читать из `SecurityContext` (0 DB queries)
  - **Breaking change:** старые токены перестанут работать → users должны re-login
  - Обновить: `UserRateLimiter` — заменить `checkLimitByEmail()` на `checkLimitByUserId()`

## Security

- **🔴 CRITICAL: IP-based rate limiting для `/auth/register`**
  - Создать: `IpRateLimiter.java` (аналогично `UserRateLimiter`)
  - Изменить: `AuthServiceImpl.register()` — добавить `ipRateLimiter.checkLimit(ip, AUTH_REGISTER)`
  - Extract IP: `HttpServletRequest.getRemoteAddr()` или `X-Forwarded-For` header
  - Limit: 10 requests / 10 minutes per IP

## Database

- **Migration rollback tests** — документировать какие миграции rollback-safe
  - V2-V10: проверить `liquibase:rollback` команду
  - Если rollback невозможен — добавить комментарий в migration

## AI Workflow

Создать `.windsurf/prompts/` с промптами:

- `update-postman.md` — автоматизация обновления Postman collection
- `suggest-tests.md` — генерация test suggestions
- `design-note.md` — создание design notes
- `code-review.md` — pre-commit review

## ✅ Done Criteria

- [ ]  Есть frontend
- [ ]  Можно зарегистрироваться / залогиниться
- [ ]  Можно создать deck
- [ ]  Можно создать / generate cards
- [ ]  Можно подписаться / enroll на deck
- [ ]  Можно пройти study flow
- [ ]  Прогресс сохраняется
- [ ]  Основные endpoint flows проходят через Postman
- [ ]  Есть AI workflow prompts
- [ ]  Проектом можешь пользоваться ты сам

# Level 1.5 — First System Delivery

> **Решение (2026-07):** Level 1.5 — новый уровень, перенесённый из Level 2.
> Deployment должен произойти сразу после работающего вертикального flow, а не после полного frontend.
> Первый деплой — не награда в конце обучения. Это часть обучения.

**Цель:** Самостоятельно собрать, запустить и задеплоить full-stack систему. После этого уровня ты можешь сказать: *«Я спроектировал, реализовал, собрал и запустил систему»*.

## ✅ Done Criteria

- [ ]  Приложение доступно через интернет по HTTPS
- [ ]  Запускается через `docker-compose up`
- [ ]  GitHub Actions: build + tests зелёные
- [ ]  Environment variables вынесены из кода
- [ ]  Есть health endpoint
- [ ]  Есть DB backup
- [ ]  Есть README уровня «другой dev может запустить и задеплоить»
- [ ]  Можешь объяснить pipeline без подсказки AI

---

# Level 2 — Portfolio / Interview-ready

**Цель:** Проект, который можно показывать как доказательство уровня Middle/Strong Middle.

## Backend

**Architecture cleanup:** чистая доменная структура, clean service responsibilities, transaction boundaries, no fat controllers, no entity leakage, consistent DTOs/naming

**Database quality:** Liquibase fully adopted, `ddl-auto=validate`, indexes, unique constraints, FK checked, cascade strategy documented

- `unique user_deck(user_id, deck_id)`
- `unique user_card(user_deck_id, card_id)`
- `index cards(deck_id)`, `index user_cards(user_deck_id)`, `index user_cards(next_review_at)`

**Индексация БД (перенесено из Sprint 0.3, Проблема №3):**

- `idx_decks_owner(owner_id)` — для `GET /decks` (все колоды пользователя)
- `idx_cards_deck(deck_id)` — для deck deletion checks и `GET /decks/{id}/cards`
- `idx_udp_user_status(user_id, status)` — для списка активных деков пользователя
- `idx_ucp_due_cards(user_deck_progress_id, status, next_review_at)` — **ключевой для spaced repetition** (`GET /study-cards`)
- `idx_ucp_next_review(user_deck_progress_id, next_review_at)` — для scheduled review queries

**Когда добавлять:** после сбора реальных slow query logs, `EXPLAIN ANALYZE` на production данных, или при > 1000 пользователей / > 10,000 cards.

**Security:** authentication vs authorization, JWT structure, password hashing, Spring Security filter chain, SecurityContext, protected endpoints, ownership checks, CORS

**Security Standards (декларативная безопасность):**

- Мигрировать с императивных ownership checks на `@PreAuthorize`
  - `UserServiceImpl.updateUser()` / `deleteUser()` — заменить `validateUserOwnership()` на `@PreAuthorize("@userSecurity.isOwner(#id)")`
  - `CardServiceImpl.createCard()` / `bulkGenerate()` — заменить `validateDeckOwnership()` на `@PreAuthorize("@deckSecurity.isOwner(#deckId)")`
- Создать security beans: `@Component DeckSecurity`, `@Component UserSecurity`, `@Component CardSecurity`
- Пример: `@PreAuthorize("@deckSecurity.isOwner(#deckId)")`
- Централизовать ownership logic в переиспользуемых методах
- Добавить role-based access: admin может редактировать любые ресурсы
- Рассмотреть custom `@OwnershipRequired` аннотацию для упрощения
- **🔴 Решить N+1 проблему в ownership validation:** текущий подход делает 2 запроса к БД (1 для проверки ownership, 1 для бизнес-логики). Решения: оптимизировать императивный код (загрузить entity один раз), использовать кэш, или AOP для передачи entity в метод.
- **Создать `.windsurf/rules/security-standards.md`** — rule файл с примерами Level 0-1 vs Level 2+ подходов, migration guide, SpEL expressions, решение N+1 проблемы

**Rate Limiting (Advanced):**

- **IP-based rate limiting** — extract IP from `HttpServletRequest`, handle proxy headers (`X-Forwarded-For`, `X-Real-IP`)
- **Distributed rate limiting (Redis)** — replace Caffeine Cache with Redis, use `INCR` + `EXPIRE`, Lua scripts for atomic operations
- **Global rate limits** — 100 requests/minute per user (all endpoints), 20 requests/minute per IP (anonymous)
- **Per-user AI generation limit** — add `userId` parameter to `AiCardGenerationService.generateCardData()`, apply `userRateLimiter.checkLimitByUserId(userId, 10, Duration.ofHours(1))`
- **Rate limit headers** — add `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` to responses

**Integration tests (Testcontainers PostgreSQL):** Auth flow · Create/Enroll deck · Generate card · Study/Submit · Get progress · Forbidden access cases

**Testing:**

**Level 2: Integration Tests (Testcontainers PostgreSQL)**
- Настроить Testcontainers: `@Testcontainers`, `@ServiceConnection`, `PostgreSQLContainer`
- **Полный learning flow test** — `LearningFlowIntegrationTest.java`:
  1. Создать пользователя
  2. Создать deck
  3. Добавить cards
  4. Enroll пользователя
  5. Получить карточки для изучения
  6. Отправить review
  7. Проверить изменение progress
  8. Проверить `nextReviewAt`
  9. Повторный enroll → 409 Conflict
- **Ownership и security tests**:
  - User A создаёт deck
  - User B не может его изменить → 403
  - User B не может удалить → 403
  - Неавторизованный запрос → 401
- **Database constraints tests**:
  - Liquibase применяет все migrations
  - Unique constraints работают (duplicate enrollment → exception)
  - FK constraints работают
  - ON DELETE RESTRICT работает
  - TIMESTAMPTZ корректно сохраняет `Instant`
  - Database triggers обновляют `updated_at`
- **Race-condition сценарии**:
  - Два одновременных enroll → один проходит, второй получает 409
  - `DataIntegrityViolationException` → понятный HTTP 409
- **@WebMvcTest для контроллеров** — `LearningControllerTest.java`, `CardControllerTest.java`:
  - Валидный request → нужный status
  - Невалидный request → 400
  - Нет авторизации → 401
  - Нет доступа → 403
  - Entity отсутствует → 404
  - Конфликт enrollment → 409
  - Ответ соответствует DTO
- **@DataJpaTest для custom queries** — только нестандартные queries:
  - Find cards due for review
  - Find progress by userId and cardId
  - Count mastered cards
  - Проверка unique constraint
  - Проверка выборки с сортировкой и limit
- **Coverage reports (JaCoCo)**
- **Migration rollback tests**

**Level 2: Разделение Unit/Slice и Integration тестов**
- **Naming:** unit/slice-тесты — суффикс `*Test` (Surefire), integration-тесты — суффикс `*IT` (Failsafe). Пример: `LearningServiceImplTest` (unit) vs `LearningFlowIntegrationIT` (integration)
- **Maven Failsafe plugin** — добавить в `pom.xml`, привязать к `integration-test`/`verify` фазам, `<includes>**/*IT.java</includes>`
- **Разделение команд:**
  - `./mvnw test` — только `*Test` (Surefire), без Testcontainers, быстрый feedback
  - `./mvnw verify` — `*Test` + `*IT` (Failsafe), полный набор с Testcontainers
- **Переименовать существующие integration-тесты** под `*IT` при их создании (`LearningFlowIntegrationTest.java` → `LearningFlowIntegrationIT.java`)

**Level 2: CI (GitHub Actions) — порядок и оптимизация**
- **Триггеры:** `push` и `pull_request` на `main`
- **Порядок job'ов:**
  1. Build (`./mvnw compile`)
  2. Unit/slice tests (`./mvnw test`) — быстрый fail-fast
  3. Integration tests (`./mvnw verify`, Testcontainers) — только после успешных unit-тестов
  4. Отчёт об успехе/ошибке (обязательный статус для merge)
- **Кэширование:** кэш `~/.m2/repository` между запусками (`actions/cache` по хэшу `pom.xml`)
- **Параллельность:** независимые группы тестов (например, по модулям) — параллельно внутри unit-стадии; integration — после unit
- **E2E** — только на PR в `main` или перед деплоем, не на каждый push
- **Quality gates (после стабилизации CI):**
  - JaCoCo coverage threshold
  - Static analysis (Checkstyle/SpotBugs)
  - Branch protection: запрет merge при красном pipeline

**API Documentation:** OpenAPI/Swagger

**DevOps:** Dockerfile backend/frontend, `docker-compose.yml`, `.env.example`, GitHub Actions (build + tests)

## Frontend

Stable UI: loading/error states, form validation, protected routes, API error handling, responsive layout, reusable components

Тесты (React Testing Library): Login form · Deck form · Study card component

## AI Workflow Level 2

Создать скрипты:

- `/scripts/ai-context.sh`
- `/scripts/changed-files.sh`
- `/scripts/generate-ai-review-context.sh`

Создать `/docs/process/pre-commit-checklist.md` с чеклистом перед коммитом.

Semi-automated Postman: AI получает controller files → обновляет коллекцию → ты импортируешь и проверяешь.

## ✅ Done Criteria

- [ ]  Проект запускается через Docker Compose
- [ ]  Есть README уровня "другой dev может запустить"
- [ ]  Есть Swagger / OpenAPI документация
- [ ]  Есть Liquibase migrations
- [ ]  Есть integration tests
- [ ]  Есть CI build/test
- [ ]  Есть frontend с нормальным UX
- [ ]  Есть documented architecture decisions
- [ ]  Есть AI-assisted workflow docs
- [ ]  Проект можно показывать на собеседовании

# Level 3 — Production Candidate

**Цель:** Приложение можно дать внешним пользователям без стыда и без постоянного ручного спасения.

## Product

Landing page · Onboarding · Public/private decks · Share deck by link · Copy deck · Edit own enrolled deck / overrides · Better AI generation preview · Generation retry/error recovery · Basic user settings · Better progress dashboard

## Backend

`StudySession` entity · `StudySessionAnswer` entity · AI generation history · AI prompt versioning · Refresh tokens · Monitoring basics · Pagination everywhere · Soft delete where needed · Copy/fork модель для enrolled decks (snapshot при enroll, изоляция от изменений owner'а)

**Logging (API-wide):**

- Полноценное логирование для всех API endpoints: входящие запросы (method, path, query, userId), исходящие ответы (status, duration)
- Structured logging (JSON) с единым форматом для production
- Correlation ID / Request ID через MDC для всех логов в рамках одного запроса
- Логирование ключевых событий: auth, AI generation, bulk failures, ownership violations, rate limit exceed, ошибки
- Отдельный лог-уровень для внешних вызовов OpenAI (latency, tokens, retry count)
- Централизованный сбор логов (ELK / Loki / CloudWatch) — выбрать стек и настроить

**Rate Limiting (Production):**

- **Rate limit headers** — `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` (follow [IETF draft](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers))
- **Adaptive rate limiting** — dynamic limits based on system load, circuit breaker for AI provider, backpressure for bulk operations
- **Monitoring & metrics** — Prometheus metrics (`rate_limit_exceeded_total`, `rate_limit_remaining`), Grafana dashboard, alerting on abuse

**Admin & Audit:**

- Audit log для всех изменений пользовательских данных (User, Deck, Card)
- Separate admin API: `/api/v1/admin/users/{id}`, `/api/v1/admin/decks/{id}` с отдельными правами
- Admin role может редактировать/удалять любые ресурсы
- Audit log включает: who, what, when, old_value, new_value

## AI Level 3

`AIProvider` interface · OpenAI provider · Fallback provider (optional) · Generation history · Prompt templates · AI response schema validation · AI retry strategy · AI cost estimation

## Testing

More integration tests · Frontend integration tests · Basic e2e (Playwright) · Security tests for forbidden access · AI service mocked tests

## DevOps

Real deployment · Staging/prod configs · Database backup · Logs · Health checks · Basic monitoring

## AI Workflow Level 3

Pipeline-like script `project-review` собирает: git diff + changed files + controllers + DTOs + migrations + tests + docs.

Pull request template:

```
## What changed
## DB changes
## API changes
## Tests
## Postman updated?
## Docs updated?
## AI review done?
```

## ✅ Done Criteria

- [ ]  Можно дать приложение 10–30 пользователям
- [ ]  Есть стабильный deploy
- [ ]  Есть полноценное логирование всех API (structured logs, correlation ID, centralized log collection)
- [ ]  Есть basic monitoring / metrics
- [ ]  Есть backups
- [ ]  Есть public/private/share/copy flow
- [ ]  AI generation не ломает user experience
- [ ]  Есть e2e tests на critical flow
- [ ]  Есть documented release process
- [ ]  Есть semi-automated AI review/update workflow

# Level 4 — Product / Startup-grade

**Цель:** Потенциальный коммерческий продукт.

## Product

Teacher dashboard · Student groups/classes · Student progress · Deck marketplace/library · Paid decks · Subscriptions · Usage limits · Admin panel · Analytics · Import from text/file/PDF · Multiple card templates · Advanced spaced repetition · Mobile-friendly PWA · Email notifications · OAuth Google

## Backend

Organizations / Classrooms · Roles (student, teacher, admin) · Payments · Subscription plans · AI usage billing · Reusable lexical database · Card templates · Card/Deck versioning · Audit logs · Advanced permissions

## AI Level 4

AI cache / lexical database · Prompt versioning · Evaluation of generated cards · Multiple providers · Cost optimization · User feedback loop · Regeneration by field

Схема `LexicalEntry`:

- `Meaning` → `Definition` → `Example`
- `Synonym`, `Translation`
- `GenerationProfile` → `LanguagePair`, `Level`

## AI Workflow Level 4

Custom internal AI dev assistant · Automatic docs draft update · Automatic test suggestions · Automatic changelog draft · Automatic API collection sync from OpenAPI

## ✅ Done Criteria

- [ ]  Есть teacher dashboard
- [ ]  Есть student groups / classes
- [ ]  Есть marketplace или библиотека деков
- [ ]  Есть система подписок / оплаты
- [ ]  Есть OAuth Google
- [ ]  Есть advanced spaced repetition
- [ ]  Есть mobile-friendly PWA
- [ ]  AI lexical database работает
- [ ]  Есть audit logs
- [ ]  Проект готов к коммерческому запуску

---

## AI Workflow — общая ось развития

| **Уровень** | **Что делает AI** |  |  |
| --- | --- | --- | --- |
| Level 0 | Manual prompts, Postman, design notes, code review |  |  |
| Level 1 | /ai-workflows/*.[prompt.md](http://prompt.md), git diff вручную, AI suggests tests |  |  |
| Level 2 | Scripts для changed files, pre-commit checklist, semi-auto Postman |  |  |
| Level 3 | CI runs tests, PR template, AI review в release workflow |  |  |
| Level 4 | Custom dev assistant, auto docs/tests/changelog/API sync |  |  |