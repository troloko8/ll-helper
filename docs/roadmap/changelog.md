# Changelog

История завершённых спринтов. Текущие задачи: `docs/roadmap/current-sprint.md`. Общий план: `docs/roadmap/roadmap.md`.

## Sprint 0.1 — Architecture Freeze ✅ COMPLETE

1. Остановить добавление новых фич
2. Описать current architecture
3. Описать DB relationships
4. Описать current learning flow (`docs/features/learning-flow.md`)
5. Описать AI generation flow (`docs/features/ai-generation-flow.md`)

## Sprint 0.2 — Backend Cleanup ✅ COMPLETE

1. 🔴 Добавить ownership check: только owner может создавать/генерировать cards в deck
2. Добавить GlobalExceptionHandler (AI exceptions, 403, 404, 409, 429)
3. Проверить UserDeck/UserCard модель
4. Принять решение: copy vs reference (документально)
5. Добавить/почистить DTO
6. Добавить mappers
7. 🔴 Добавить ownership check для User операций (update/delete) — **SECURITY CRITICAL**
7.2. 🔴 Добавить ownership check для Deck операций (update/delete) — CRITICAL

**8. Rate limiting (защита от abuse)** — детальный план был в `docs/features/rate-limiting-design.md`

- Реализован `UserRateLimiter` (Caffeine Cache, per-user/email) для auth (`login`/`register`), user update, card и deck operations
- Исправлен reset bug глобального AI rate limiter (`ai/util/RateLimiter.java`)
- `RateLimitExceededException` → HTTP 429 через `GlobalExceptionHandler`
- 429 сценарии покрыты `AuthControllerTest` (Sprint 0.4)
- IP-based и distributed (Redis) limiting для auth перенесены в backlog (Level 2)

9. Убран entity leakage из API (`sourceLanguage`/`targetLanguage` в `DeckResponse`, `@Transactional(readOnly = true)`, ручное создание Card/CardReviewResponse перенесено в мапперы)
10. Добавлена validation
11. `validateBulkSize()` вызывается в `CardServiceImpl.createBulk()`
12. Добавлено logging для bulk failures
13. Переименован `CardDesc → Deck` в Java (entity, package, controller, DTO), таблица `card_descs → decks` переименована вручную
14. Настроены hotkeys для IDE

## Sprint 0.3 — Database Control ✅ COMPLETE

1. Добавлен Liquibase, создана V1 migration (baseline)

**Критические проблемы целостности данных Level 0 решены.** Оставшиеся lifecycle и performance improvements перенесены в backlog.

- **Race condition при enrollment:** ✅ РЕШЕНО — `UNIQUE(user_id, deck_id)` на `user_deck_progress` (V2), обрабатывается через `DataIntegrityViolationException`
- **Неполная FK политика:** ✅ РЕШЕНО — FK `user_deck_progress.user_id`/`user_card_progress.user_id` → `users.id` (V4, `ON DELETE CASCADE`)
- **Недостаточно индексов:** перенесено в backlog (Level 2, не критично для MVP)

### Выполнено

- `UNIQUE(user_id, deck_id)` — V2; `UNIQUE(user_deck_progress_id, card_id)` — V3 (конфликт с `idx_ucp_user_card` устранён)
- FK constraints для learning layer (V1, V4, `ON DELETE CASCADE`)
- CASCADE delete для Deck/Card — V5; `CascadeType.ALL` выровнен с DB CASCADE
- User → UserDeckProgress → UserCardProgress CASCADE — V4
- `ddl-auto` переключён с `update` на `validate`; реальная DB схема проверена через `information_schema`
- `Language` enum вместо VARCHAR + DB CHECK constraints, `defaultValue: ''` убран — V6
- CHECK constraints на неотрицательные счётчики в `user_card_progress` — V7
- Дублирующий индекс `idx_user_auth` удалён (оставлен `uk_users_auth_user_id`) — V8
- `@ForeignKey` аннотации добавлены в `Card` (`fk_cards_deck`) и `User` (`fk_users_auth_user`)
- Дублирующие DB constraints убраны из entity классов (`@Table(uniqueConstraints, indexes, check)`, `@ColumnDefault`); созданы `docs/database/schema-ownership.md` и `backend/.windsurf/rules/liquibase-conventions.md`
- `created_at`/`updated_at` и business timestamps перенесены на PostgreSQL DEFAULT/trigger — V9, V10
- Таблица `card_descs → decks` переименована вручную, до Liquibase

### Решено архитектурным решением

- CASCADE delete принят для MVP; soft delete сознательно отложен (см. backlog)
- V4–V6 используют explicit `addForeignKeyConstraint`; V1 legacy inline FK не переписывается (migration immutability); V7+ обязаны использовать только explicit FK
- Entity не должны содержать constraint annotations (`@Index`, `@UniqueConstraint`, `@CheckConstraint`) — Liquibase единственный владелец schema constraints

### Перенесено в backlog

- Pending indexes (`idx_decks_owner`, `idx_ucp_due_cards` и др.) — Level 2
- AuthUser → User cascade / orphan fix (нужен `DELETE /api/v1/me`) — Level 1
- FK delete rules для `fk_decks_owner`, `fk_users_auth_user` — Level 1
- Soft delete для Card/Deck — Level 1

> Запуск Liquibase V1–V10 на чистой PostgreSQL автоматически проверяется через `ApplicationContextLoadsTest` с Testcontainers (Sprint 0.4).

## AI Infrastructure Reorganization — 2026-07-30 ✅ COMPLETE

Проведено вне исходного порядка (изначально планировалось как Sprint 1.3, после Level 1 vertical flow), по решению пользователя.

- Создан минимальный root `AGENTS.md` (repo-wide hard gates + documentation-sync gate + roadmap pointers)
- `backend/AGENTS.md` сокращён до backend-specific hard gates + таблица навигации
- `entity-conventions.md`, `testing-conventions.md`, `mapstruct-conventions.md` переехали в `backend/.windsurf/rules/` как glob-правила (были always_on)
- Создан новый `backend/.windsurf/rules/liquibase-conventions.md` (glob на changelog-файлы), вобравший Liquibase-специфичный контент из бывшего `database-schema-ownership.md`
- `documentation-sync.md` переведён на `trigger: model_decision` с содержательным `description`, остался единственным файлом в корневой `.windsurf/rules/`
- `.windsurf/rules/project-roadmap.md` удалён, его роль перенесена в root `AGENTS.md` (2 bullet: где искать статус, когда не читать roadmap)
- Исправлены устаревшие поля `cardDesc`/`cardDescId` → `deck`/`deckId` в `mapstruct-conventions.md`
- Создан `docs/backend/mapstruct-edge-cases.md` — сложные случаи вынесены из основного правила
- Исправлены абсолютные локальные пути в `.windsurf/skills/create-design-note/SKILL.md`
- `LL_Helper_Project_Roadmap.md` разбит на `roadmap.md` / `current-sprint.md` / `backlog.md` / `changelog.md`; `NEXT_TODO.md` влит в `backlog.md`
- Созданы skills `.windsurf/skills/database/` и `.windsurf/skills/testing/` с progressive disclosure references
- `pre-commit-review.md` обновлён на динамическое чтение `current-sprint.md`
- Создан `scripts/check-agent-context.sh`

## Documentation Audit — 2026-08-01 ✅ COMPLETE

- `docs/architecture/current-architecture.md`: removed the historical "Naming Issue: CardDesc → Deck rename" section, the per-day internal changelog table, and the remaining strikethrough `CardDesc` mentions (history lives here in this changelog)
- Fixed "Copy vs reference strategy is not finalized" contradiction — reference model was already accepted in Sprint 0.2 Accepted Decisions
- Fixed Sprint 0.2 decision claiming orphan/delete protection would be handled "in Sprint 0.3" — already resolved via `ON DELETE CASCADE` (V4/V5)
- Removed "auth rate limiting" and "AI Provider abstraction interface" from Level 3 future scope — both already implemented (`UserRateLimiter` on login/register; `AiProvider` interface + `OpenAiProvider`)
- Reworded Sprint 0.3 "all critical issues resolved" claim; split into Выполнено / Решено архитектурным решением / Перенесено в backlog
- Removed unverified "rollback testing" claim — only Liquibase smoke test via `ApplicationContextLoadsTest` is confirmed
- Condensed the Sprint 0.2 rate-limiting sub-task list (8.1–8.16) to a summary
- Validation: `check-agent-context.sh` — 0 FAIL, 0 WARN

## Documentation Audit II — 2026-08-01 ✅ COMPLETE

- Fixed §8 "cascade/delete behavior is unresolved" — contradicted V4/V5, §14/§15 Fixed markers, Accepted Decisions, and this changelog; replaced with the actual resolved behavior
- Fixed §2 claiming indexes were complete alongside V1–V10 — split into "Level 0 integrity constraints/cascades done" vs "performance indexes deferred to Level 2"
- Removed rename-migration artifacts (`will be renamed to deck/`, `← → X`) and `← NEW` markers from the package structure tree (§13)
- Split the Testcontainers mention in §17 so it no longer contradicts the Level 0 `ApplicationContextLoadsTest` smoke test already in place
- Reworded §18 "All endpoints protected" — distinguished the per-user `UserRateLimiter` layer (now includes `POST /cards/bulk-generate`) from the global per-JVM `AiRateLimiter` provider layer
- Removed historical "Recent changes (Sprint 0.2/0.3)" API blocks, trimmed Known Architecture Issues/Architecture Risks to open items only (fixed history now lives only here), merged "Sprint 0.2 Accepted Decisions" into "Accepted Decisions", removed the historical "Sprint 0.2 Priority Decisions" section, and dropped stray sprint labels from §2/§14/§19 headers
- Fixed §12 "Prompt output shape" — removed stray `title` field; `AiCardData` only has `definition`/`synonyms`/`examples`/`translation`, confirmed against `OpenAiProvider.PROMPT_TEMPLATE`

## AI Infrastructure Reorganization — Rules Size & Duplication Reduction — 2026-08-02 ✅ COMPLETE

Follow-up to "AI Infrastructure Reorganization" (2026-07-30); closes the previously flagged "rules still larger than desired for progressive disclosure" gap.

- `.windsurf/rules/documentation-sync.md`: rewritten from a long per-doc procedure (~212 lines) into a compact trigger→doc routing table (~40 lines)
- `backend/.windsurf/rules/testing-conventions.md`: removed the Test Levels table (now only in `.windsurf/skills/testing/SKILL.md`), condensed side-effect verification / test data hygiene / boundary testing / AssertJ / fixtures / `@Disabled` sections to remove overlap with `docs/testing/testing-strategy.md`
- `backend/CONVENTIONS.md` Testing section: removed the duplicated Clock/AssertJ/side-effect/distinct-IDs/threshold-testing block — now a one-line pointer to `testing-conventions.md`
- `backend/.windsurf/rules/entity-conventions.md`, `liquibase-conventions.md`, `mapstruct-conventions.md`: trimmed verbose code examples and repeated explanations while keeping all hard gates
- `.windsurf/workflows/pre-commit-review.md`: merged the 8 numbered review sections into 7, condensed each to its checklist essence, cut the long commit-message example block
- No routing/reference structure changed — `.windsurf/skills/database/` and `.windsurf/skills/testing/` reference layout untouched

## Agent Context Check — 2026-08-02 ✅ COMPLETE

Improved `scripts/check-agent-context.sh` from ~60% to fully functional.

- Added explicit 0-byte / near-empty file detection (catches empty `AGENTS.md`)
- Excluded `__MACOSX/` and `.DS_Store` from recursive `.windsurf`/`AGENTS.md` discovery
- Expanded stale-terms sweep to all `backend/*.md` (e.g. `HELP.md`) and added `Flyway|flyway`
- Added hardcoded sprint reference detection: `'> **Sprint:** Sprint X.Y'`, `Fixes Sprint X.Y Task #N`, `Sprint X.Y Task #N`
- Added static level assertion detection for `.windsurf/skills/` and `.windsurf/rules/` (`current project is Level X`, `project is Level X`, `we are at Level X`)
- Added heuristic contradiction detection for DB indexes in `docs/database/relationships.md` and `docs/database/schema-ownership.md`
- Extended broken-reference check to parse ordinary Markdown links `[text](path)` as well as backtick-wrapped paths
- Added obsolete rule/skill path detection (`database-schema-ownership.md`, `project-roadmap.md`, `security-standards.md`, `LL_Helper_Project_Roadmap.md`)
- Validation run: `FAIL: 0   WARN: 0`
