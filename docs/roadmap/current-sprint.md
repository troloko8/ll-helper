# Current Sprint

> Level 0 — Stable Backend Foundation. Полный план: `docs/roadmap/roadmap.md`. Задачи вне текущего спринта: `docs/roadmap/backlog.md`. Завершённые спринты: `docs/roadmap/changelog.md`.

## Sprint 0.4 — Testing (Level 0 Minimum)

**Цель:** Unit tests + Controller tests + Postman smoke.

- **Level 0:** один DB smoke с Testcontainers (`ApplicationContextLoadsTest` — Liquibase на чистой PostgreSQL).
- **Level 2:** repository tests и full integration tests с Testcontainers.

> **Принцип Level 0:** Unit test сервиса и @WebMvcTest контроллера для одной фичи пишутся **вместе**.

**Группа 0: Инфраструктура тестов (выполняется первой)** — ✅ DONE

- [x] Добавить Testcontainers в `pom.xml` (`org.testcontainers:postgresql` + `junit-jupiter`, 1.20.4)
- [x] Создать `common/support/TestData.java` — cross-domain fixtures (`fixedClock()`)
- [x] Создать `ApplicationContextLoadsTest.java` — DB smoke с Testcontainers (Liquibase V1–V10 запускаются на чистой PostgreSQL). **Last verified run:** 2026-07-27 — 1 test, 0 failures/errors; Liquibase V1–V10 applied successfully on PostgreSQL 16.14. A rerun was not performed during the latest documentation audit because Docker was unavailable in that audit environment.
- [x] Внедрить Clock в `LearningServiceImpl`

**Группа 1: Unit Tests (критичная бизнес-логика)**

- [x] **1.1. LearningServiceImpl tests** — `LearningServiceImplTest.java` — Level 0 behavior covered.
  - **Deferred to Level 1:** реализация `nextReviewAt` scheduling logic и соответствующий service unit test (`review_shouldCalculateNextReview_basedOnDifficulty()`).
  - **Level 2:** дополнительное repository/full integration coverage для scheduling flow (выбор due cards, сохранение `nextReviewAt` через PostgreSQL/Testcontainers).
- [x] **1.2. UserRateLimiter tests** — `UserRateLimiterTest.java` — Level 0 behavior covered.
  - **Deferred:** `UserRateLimiter.reset(email, RateLimitAction)` method and `reset_shouldClearBucket_whenCalled()` test — см. `backlog.md` (Level 2+ Rate Limiting / Testing).
- [x] **1.3. Ownership checks tests** — DONE (security-critical): Deck/Card/User ownership forbidden-сценарии
- [x] **1.4. Bulk validation test** — `CardServiceImplTest.java` — DONE (`validateBulkSize()` реализован, лимит = `AiProperties.getMaxBulkSize()`, default 100)
- [x] **1.5. AI parser tests** — `AiResponseParserTest.java` — DONE (парсинг вынесен в отдельный `com.llhelper.ai.parser.AiResponseParser`)

**Группа 1b: Controller Tests (@WebMvcTest) — параллельно с Группой 1**

> Сервис замокан через `@MockitoBean` (Spring Boot 4.x). Нет реальной БД, нет full Spring context.

- [x] **1b.1. LearningControllerTest** — DONE (`enroll` → 201, 404, 409; `review` → 200, 404)
- [x] **1b.2. DeckControllerTest** — DONE (`create` → 201/400, `update` → 403 (not owner), `getById` → 404)
- [x] **1b.3. CardControllerTest** — DONE (`create` → 201, `create` → 403 (not deck owner), `generateBulk` → 400 (size > 100))
- [x] **1b.4. UserControllerTest** — DONE (`update` → 400 (invalid), `update` → 403 (not self))
- [x] **1b.5. AuthControllerTest** — DONE (`register` → 200/400 — контроллер возвращает `ResponseEntity.ok()`, не 201, тест написан под фактическое поведение; `login` → 200, `login` → 429 (rate limit))

**Группа 2: Postman (smoke testing)**

- [x] Актуализировать Postman collection — DONE. `current-architecture.md` дополнен 3 user-эндпоинтами. Коллекция переработана: все запросы используют `{{url}}`; email/username теперь генерируются динамически (`testEmail`, `testUsername`); ID ресурсов (`userId`, `deckId`, `cardId`) захватываются из ответов и подставляются в последующие запросы; DELETE-запросы вынесены в `Cleanup`-папку, чтобы не рушить основной flow; негативные тесты переведены на `{{nonExistentUserId}}`/`{{nonExistentDeckId}}` с проверкой 404. `newman`-прогон на живом сервере: 32 запроса, 10 assertions, 0 failures.

**Группа 3: Domain-specific fixtures**

- [x] Создать domain-specific fixtures — DONE. `LearningTestData.java` расширен (`defaultCardReviewRequest`, `defaultCardReviewResponse`, `defaultEnrollResponse`, `defaultCardProgress`, `defaultDeckProgress`); созданы `DeckTestData.java`, `CardTestData.java`, `UserTestData.java`. Четыре контроллерных теста (`LearningControllerTest`, `DeckControllerTest`, `CardControllerTest`, `UserControllerTest`) отрефакторены на использование фикстур, убран дублирующийся boilerplate при создании DTO.

**Группа 4: Критичные долги**

- [x] Smoke test для Liquibase migrations — заменено `ApplicationContextLoadsTest` (Группа 0)
- [x] Проверить все 500 ошибки → специфические HTTP коды (найти `throw new RuntimeException`, заменить на `NotFoundException`/`ConflictException`/etc., проверить покрытие `@WebMvcTest`)

**Группа 5: Documentation**

- [ ] **Завершение Sprint 0.4** — при выполнении Done Criteria Level 0: перенести итог Sprint 0.4 в `docs/roadmap/changelog.md` и обновить `current-sprint.md` на следующий активный спринт. `roadmap.md` обновлять только если меняется статус Level 0/Done Criteria.
- [x] **Разделить roadmap на отдельные файлы** — ВЫПОЛНЕНО 2026-07-30 (вне исходного порядка, до завершения остальных задач Sprint 0.4): создан `changelog.md` (история Sprint 0.1–0.3), создан `current-sprint.md` (этот файл), создан `backlog.md` (Level 1+ backlog и техдолг, включая слитый `NEXT_TODO.md`), `LL_Helper_Project_Roadmap.md` заменён на `roadmap.md` (уровни + Done Criteria). .windsurf/rules/project-roadmap.md не обновлён, а удалён — его роль перенесена в root `AGENTS.md`.

**Приоритет выполнения (оставшееся):**
1. Группа 1b.2–1b.4 (DeckController, CardController, UserController) — security-critical, параллельно
2. Группа 1b.5 (AuthControllerTest) — HTTP auth контракт
3. Группа 2 (Postman) — ручной smoke
4. Группа 3 (fixtures) — по необходимости
5. Группа 4 (500 → HTTP коды)
6. Группа 5 (перенести итог Sprint 0.4 в `changelog.md`, обновить `current-sprint.md` на новый спринт; `roadmap.md` — только статус уровня/Done Criteria)
