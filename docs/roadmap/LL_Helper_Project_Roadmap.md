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
7. 🔴 Добавить ownership check для User операций (update/delete) — **SECURITY CRITICAL**
   - **Проблема:** Любой аутентифицированный пользователь может изменять/удалять данные других пользователей через `PUT /api/v1/users/{id}` и `DELETE /api/v1/users/{id}`
   - **Решение:**
     - Добавить `SecurityUtils` в `UserServiceImpl`
     - В `updateUser()` и `deleteUser()` проверять: `if (!Objects.equals(user.getId(), securityUtils.getCurrentUserId())) throw new AccessDeniedException(...)`
     - Добавить тесты на 403 для попытки изменить чужой профиль
     - Обновить Postman: добавить test case для 403 ownership violation
   - **Миграция на Level 2:** Заменить императивные проверки на `@PreAuthorize("@userSecurity.isOwner(#id)")`
8. Добавить Rate limiting на user update операции (защита от abuse)
9. Убрать entity leakage из API
10. Добавить validation
11. Исправить RateLimiter reset bug (hardcoded 10)
12. Вызвать `validateBulkSize()` в `CardServiceImpl.createBulk()`
13. Добавить logging для bulk failures
14. Переименовать `CardDesc → Deck` в Java (entity, package, controller, DTO) — без rename таблицы
15. настрой hotkeys для IDE

### Sprint 0.3 — Database Control

1. Добавить Flyway/liquidBase
2. Создать V1 migration (текущее состояние схемы как baseline)
3. Добавить `UNIQUE(user_id, deck_id)` на `user_deck_progress`
4. Добавить `UNIQUE(user_deck_progress_id, card_id)` на `user_card_progress`
5. Добавить FK constraints для learning layer (user_deck_progress → card_descs, user_card_progress → cards)
6. Принять решение по delete behavior (RESTRICT vs CASCADE vs soft delete) для Card/Deck
7. Реализовать soft delete или RESTRICT для CardDesc/Card (защита прогресса learners)
8. Добавить indexes на progress таблицах (idx_udp_user_status, idx_ucp_deck_status, idx_ucp_next_review, idx_cards_deck)
9. Проверить реальную DB схему через `information_schema` (nullable, FK, indexes, constraints)
10. Переключить `ddl-auto` с `update` на `validate`
11. Решить стратегию `CascadeType.ALL` на `CardDesc → Cards` (убрать или заменить на explicit cascade)
12. Определить cascade стратегию при удалении `User` (AuthUser → User → CardDesc → Progress)
13. Исправить orphan: удаление `AuthUser` не каскадирует на `User`
14. Переименовать таблицу `card_descs → decks` (Flyway migration, после Sprint 0.2 п.12)
15. Рассмотреть language enum вместо VARCHAR для `sourceLanguage`/`targetLanguage`

### Sprint 0.4 — Testing & Postman

1. Обновить Postman collection
2. Добавить unit tests на learning logic
3. Добавить tests на AI parser
4. Добавить tests на review/progress calculation
5. Создать AI prompt для обновления Postman
6. Создать AI prompt для test suggestions
7. 🔴 Проверить корректность `cardDescId` в `CardResponse` после AI-генерации карты — `Card.cardDescId` является read-only полем (`insertable=false, updatable=false`), Hibernate не заполняет его при `save()` без последующего `findById()`. Нужно убедиться что `toResponse(cardRepository.save(card))` возвращает корректный `cardDescId`, а не `null`

### Sprint 1.0 — Frontend Skeleton

1. Создать React/TS app
2. Настроить routes
3. Настроить API client
4. Login/Register
5. Dashboard
6. Deck list
7. Deck details

### Sprint 1.1 — Learning UI

1. Create deck UI
2. Add card UI
3. AI generate cards UI
4. Enroll deck UI
5. Study mode UI
6. Progress UI

---

# 🧠 Skill Map

*Какой уровень продукта = какой уровень знаний нужен*

| **Level** | **Главный фокус знаний** | **Твой статус** |
| --- | --- | --- |
| Level 0 | Spring / JPA / DB / API cleanup / tests / docs | Уже можешь делать, но нужно систематизировать |
| Level 1 | React/TS + backend integration + usable MVP | Начинать после backend stabilization |
| Level 2 | Docker, CI, Swagger, Testcontainers, security depth | Учить параллельно после MVP |
| Level 3 | Deploy, monitoring, backups, refresh tokens, e2e, AI architecture | Пока рано, но логичный следующий уровень |
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
- Flyway basics

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

- Flyway properly, `ddl-auto=validate`
- Indexes, unique constraints, FK, cascade strategy
- Query performance basics

### Security

- Spring Security filter chain basics, SecurityContext
- JWT structure, password hashing, CORS
- Endpoint authorization, ownership checks, forbidden access cases

### Testing

- JUnit, Mockito, SpringBootTest, MockMvc
- Testcontainers PostgreSQL
- Integration tests, security tests for 403 cases

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

### AI workflow

- Scripts for changed files / AI context generation
- Pre-commit checklist
- Semi-automated Postman update

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
- [ ]  Есть Flyway V1
- [ ]  Есть GlobalExceptionHandler
- [ ]  Есть validation
- [ ]  Есть Postman collection
- [ ]  Есть 5–10 unit tests на learning/progress/AI parsing
- [ ]  Можешь объяснить backend без подсказки AI

# Level 1 — Usable MVP

**Цель:** Ты сам и 1–3 друга можете реально пользоваться приложением.

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

## Deferred from Level 0 (Sprint 0.2)

- Переименовать `CardDesc* → Deck*` в Java коде (entity, package, controller, service, DTO) — таблица БД остаётся `card_descs` до Sprint 0.3
- Pagination для `DeckCardResponse.cards` — при большом количестве карточек в деке
- Создать `CardWithDeckResponse` DTO — для endpoint'ов где нужна полная информация о deck вместе с card (например, `GET /cards/{id}` с полной инфой о родительской деке)
- Добавить `cardCount` в `CardDescListResponse` — использовать `@Formula` в entity или отдельный query для эффективного подсчёта карточек без загрузки всего списка
- **🔴 BREAKING CHANGE:** Добавить `sourceLanguage`, `targetLanguage` в `CardDescResponse` — сейчас закомментированы, но нужны для AI generation на frontend. `CardDescListResponse` уже содержит эти поля. Без них frontend не сможет вызвать AI generation для карточек внутри деки.

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

**User self-service API:**

- `GET /api/v1/me` — получить профиль текущего пользователя
- `PUT /api/v1/me` — обновить свой профиль (вместо `PUT /api/v1/users/{id}` с ownership check)
- `DELETE /api/v1/me` — удалить свой аккаунт

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

## AI Workflow Level 1

Создать `/ai-workflows/` с промптами:

- `design-note.prompt.md`
- `postman-update.prompt.md`
- `test-suggestion.prompt.md`
- `code-review.prompt.md`

Перед коммитом: git diff → скопировать дифф → AI review → обновить design note → обновить Postman → попросить AI предложить тесты

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

# Level 2 — Portfolio / Interview-ready

**Цель:** Проект, который можно показывать как доказательство уровня Middle/Strong Middle.

## Backend

**Architecture cleanup:** чистая доменная структура, clean service responsibilities, transaction boundaries, no fat controllers, no entity leakage, consistent DTOs/naming

**Database quality:** Flyway fully adopted, `ddl-auto=validate`, indexes, unique constraints, FK checked, cascade strategy documented

- `unique user_deck(user_id, deck_id)`
- `unique user_card(user_deck_id, card_id)`
- `index cards(deck_id)`, `index user_cards(user_deck_id)`, `index user_cards(next_review_at)`

**Security:** authentication vs authorization, JWT structure, password hashing, Spring Security filter chain, SecurityContext, protected endpoints, ownership checks, CORS

**Security Standards (декларативная безопасность):**

- Использовать `@PreAuthorize` вместо императивных ownership checks
- Создать security beans: `@Component DeckSecurity`, `@Component UserSecurity`, `@Component CardSecurity`
- Пример: `@PreAuthorize("@deckSecurity.isOwner(#deckId)")`
- Централизовать ownership logic в переиспользуемых методах
- Добавить role-based access: admin может редактировать любые ресурсы
- Рассмотреть custom `@OwnershipRequired` аннотацию для упрощения
- **Создать `.windsurf/rules/security-standards.md`** — rule файл с примерами Level 0-1 vs Level 2+ подходов, migration guide, SpEL expressions

**Integration tests (Testcontainers PostgreSQL):** Auth flow · Create/Enroll deck · Generate card · Study/Submit · Get progress · Forbidden access cases

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
- [ ]  Есть Flyway migrations
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

`StudySession` entity · `StudySessionAnswer` entity · AI generation history · AI prompt versioning · Refresh tokens · Rate limiting · Better logs · Monitoring basics · Pagination everywhere · Soft delete where needed · Copy/fork модель для enrolled decks (snapshot при enroll, изоляция от изменений owner'а)

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
- [ ]  Есть basic monitoring / logging
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