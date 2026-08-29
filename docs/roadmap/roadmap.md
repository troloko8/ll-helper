# Project Roadmap

<aside>
🗺️

Рoadmap разбит на 5 уровней — от стабильного бэкенда до продуктового приложения. Каждый уровень — независимый этап с чёткими критериями завершения.

</aside>

> **Текущие задачи:** `docs/roadmap/current-sprint.md`
> **Задачи вне текущего спринта / будущие уровни:** `docs/roadmap/backlog.md`
> **История выполненного:** `docs/roadmap/changelog.md`

---

# 🧠 Skill Map

*Какой уровень продукта = какой уровень знаний нужен*

| **Level** | **Главный фокус знаний** | **Твой статус** |
| --- | --- | --- |
| Level 0 | Spring / JPA / DB / API cleanup / tests / docs | Уже можешь делать, но нужно систематизировать |
| Level 1 | Один вертикальный full-stack flow (React + backend + auth + DB) | Начинать после backend stabilization |
| Level 1.5 | Docker, CI, первый деплой, HTTPS, env config, health checks | Сразу после работающего вертикального flow |
| Level 2 | Testcontainers, Swagger, security depth, полный frontend, architecture review | После первого deployment |
| Level 3 | Monitoring, staging, refresh tokens, e2e, real users, AI архитектура | Логичный следующий уровень |
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
- Понимать архитектуру Windsurf: AGENTS.md, rules (always_on vs glob vs model_decision), skills, workflows, memory
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
- User settings, better UX around ошибок

### Backend
- StudySession / StudySessionAnswer modeling
- History tables, soft delete, pagination everywhere
- Refresh token flow, rate limiting
- Logging, health checks, monitoring basics, backup strategy

### AI архитектура
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

Core test coverage на Level 0 (актуальный список — `docs/roadmap/current-sprint.md`):
- `LearningServiceImplTest` (enroll, review, status transitions)
- `AiResponseParserTest`
- `UserRateLimiterTest`, ownership forbidden-сценарии, bulk validation

Проверить переходы:
- `NEW` → `LEARNING`
- `LEARNING` → `REVIEWING`
- `REVIEWING` → `MASTERED`
- Неверный ответ сбрасывает / увеличивает `timesWrong`
- `correctStreak` работает корректно

## AI Workflow (manual)

На Level 0 AI помогает вручную: Generate Postman collection · Generate design notes · Review changed files · Suggest tests

Без CI/CD автоматизации. Ты явно говоришь AI, какие файлы изменились — AI обновляет docs/postman/tests.

## ✅ Done Criteria

- [x]  Есть `docs/architecture/current-architecture.md`
- [x]  Есть `docs/database/relationships.md`
- [x]  Понятно, где content, а где progress (Content Layer / Learning Layer — см. `current-architecture.md` §1)
- [x]  DTO не возвращают entity наружу
- [x]  Есть mapper layer
- [x]  Есть Liquibase (V1–V10 миграций)
- [x]  Есть GlobalExceptionHandler
- [x]  Есть validation
- [x]  Есть Postman collection (`LLHelper.postman_collection.json`) — актуализация в процессе, см. `current-sprint.md`
- [x]  Есть unit tests на learning/AI parsing/rate limiting/ownership/bulk validation (см. `current-sprint.md` Группа 1)
- [x]  Можешь объяснить backend без подсказки AI

# Level 1 — Vertical Full-Stack Flow

> **Решение (2026-07):** Level 1 начинается с одного вертикального сценария, а не с полного набора frontend-экранов.
> Цель не красивый product — а впервые пройти полный путь: frontend → backend → auth → DB → живая система.
> Остальные экраны (Dashboard, AI generation, Card Editor, Progress) — расширение после первого деплоя.
>
> **Уточнение (Phase 0.4C):** внутри "Add/generate cards" в Level 1 входит только Manual Add Card; полноценный Card Editor/Edit Deck/Edit Card — после первого deployment. Single-card AI generation — optional отдельная задача после успешного manual smoke, не блокирует Level 1. Bulk AI generation — deferred. "See progress" в Level 1 реализуется как backend-provided per-card progress (per-deck отображение на экране Learning Deck Details), не полноценный aggregate Progress dashboard — тот остаётся расширением после первого деплоя. См. `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md` §0 для точного MVP scope; Level 1 не расширяется до полного набора canonical screens.

**Цель:** Один работающий full-stack flow + первый самостоятельный deployment системы.

Детальные задачи Level 1 (Backend improvements, Frontend, Performance, Security, Database, AI Workflow) — см. `docs/roadmap/backlog.md`.

## Product flow

Основной flow (accepted, Phase 0.4C):

1. Register
2. Complete Profile
3. Authenticated app
4. Create deck
5. Add cards (manual — Level 1 требование; single-card AI — optional after manual smoke; bulk AI — deferred)
6. Owner Deck Details → Public Deck Details
7. Subscribe/enroll to deck
8. Learning list/details
9. Study 10 cards
10. Submit answers
11. See correct/wrong
12. See progress (backend-provided per-card progress via Learning Deck Details — Level 1; aggregate Progress dashboard — after first deployment)
13. Return later and continue (повторное открытие Learning list)

Login проверяется отдельно, как повторный вход существующего пользователя (не обязателен сразу после регистрации): clear/logout session → Login → Learning list → continue.

## ✅ Done Criteria

- [ ]  Есть frontend
- [ ]  Можно зарегистрироваться и завершить Complete Profile
- [ ]  Можно создать deck
- [ ]  Можно создать card вручную (manual add card — обязательно для Level 1; AI generation не является обязательным Level 1 criterion)
- [ ]  Можно подписаться / enroll на deck
- [ ]  Можно пройти study flow
- [ ]  Per-card progress сохраняется и отображается (отдельный aggregate Progress dashboard не требуется)
- [ ]  Можно выйти и войти повторно, продолжив через Learning list
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

Детальные задачи Level 2 (Architecture cleanup, Database quality, Security Standards, Rate Limiting Advanced, Testing, CI, API Docs, DevOps, Frontend, AI Workflow) — см. `docs/roadmap/backlog.md`.

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

Детальные задачи Level 3 (Product, Backend, Logging, Rate Limiting Production, Admin & Audit, AI Level 3, Testing, DevOps, AI Workflow) — см. `docs/roadmap/backlog.md`.

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

Детальные задачи Level 4 (Product, Backend, AI Level 4, AI Workflow) — см. `docs/roadmap/backlog.md`.

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

| **Уровень** | **Что делает AI** |
| --- | --- |
| Level 0 | Manual prompts, Postman, design notes, code review |
| Level 1 | `/ai-workflows/*.prompt.md`, git diff вручную, AI suggests tests |
| Level 2 | Scripts для changed files, pre-commit checklist, semi-auto Postman |
| Level 3 | CI runs tests, PR template, AI review в release workflow |
| Level 4 | Custom internal AI dev assistant, automatic docs/changelog draft, automatic API collection sync |
