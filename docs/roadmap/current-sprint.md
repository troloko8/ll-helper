# Current Sprint

> Level 1 — Vertical Full-Stack Flow. Полный план: `docs/roadmap/roadmap.md`. Задачи вне текущего спринта: `docs/roadmap/backlog.md`. Завершённые спринты: `docs/roadmap/changelog.md`.

## Sprint 1.0 — Vertical Flow

**Цель:** Впервые связать frontend, backend, auth и database в одну живую систему. Один вертикальный сценарий — Register → Login → Create deck → Add cards → Enroll → Study → See progress. UI может быть простым; цель — не красивый Dashboard, а работающий full-stack flow.

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
- [ ] Обработка 401/403/validation errors на frontend.
- [ ] Сохранение токена и редирект после auth.

**Группа 2: Deck & cards flow**

- [ ] Create deck screen.
- [ ] Add cards (manual) screen.
- [ ] AI generate cards screen.
- [ ] Deck list / deck details view.

**Группа 3: Study flow**

- [ ] Enroll in deck.
- [ ] Study screen: карточки, submit answer, see result.
- [ ] Progress view (deck/cards status, mastered count).

**Группа 4: End-to-end smoke**

- [ ] Ручной прогон: register → login → create deck → add cards → enroll → study → see progress.
- [ ] Обновить `LLHelper.postman_collection.json` и `LLHelper.postman_environment.json` по необходимости.
- [ ] Проверить CORS и base API URL.

**Группа 5: Documentation**

- [x] Обновить `docs/architecture/current-architecture.md` — frontend architecture section added.
- [ ] Обновить `docs/features/learning-flow.md` при изменениях flow/UX.
- [ ] Обновлять `docs/roadmap/current-sprint.md` по ходу.

## ✅ Done Criteria (Level 1)

- [ ] Есть frontend
- [ ] Можно зарегистрироваться / залогиниться
- [ ] Можно создать deck
- [ ] Можно создать / generate cards
- [ ] Можно подписаться / enroll на deck
- [ ] Можно пройти study flow
- [ ] Прогресс сохраняется
- [ ] Основные endpoint flows проходят через Postman
- [ ] Есть AI workflow prompts
- [ ] Проектом можешь пользоваться ты сам

**Приоритет выполнения:**

1. Группа 0 (scaffold & foundation) — scaffold ✅, Technical Foundation ✅ (см. Группа 0 выше)
2. Группа 1 (auth) — **заблокирована до завершения и ревью Phase 0.4** (см. ниже)
3. Группа 2 (decks/cards)
4. Группа 3 (study)
5. Группа 4 (end-to-end smoke)
6. Группа 5 (docs)

## Phase 0.4 — Global Frontend Integration Audit

**Статус:** в процессе. Runtime frontend feature implementation не начата.

- [x] Phase 0.4A — Backend Contract Inventory (`docs/frontend/integration/BACKEND_CONTRACT_INVENTORY.md`) — repository-grounded аудит контроллеров, DTO, security и error contract.
- [ ] Phase 0.4B — не начата.

**Auth runtime код (Группа 1) заблокирован**, пока Phase 0.4 не будет полностью завершена и проверена — см. подтверждённые расхождения в `BACKEND_CONTRACT_INVENTORY.md` §8 (в т.ч. `AuthServiceImpl.register()` не создаёт `User`).
