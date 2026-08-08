# Current Sprint

> Level 1 — Vertical Full-Stack Flow. Полный план: `docs/roadmap/roadmap.md`. Задачи вне текущего спринта: `docs/roadmap/backlog.md`. Завершённые спринты: `docs/roadmap/changelog.md`.

## Sprint 1.0 — Vertical Flow

**Цель:** Впервые связать frontend, backend, auth и database в одну живую систему. Один вертикальный сценарий — Register → Login → Create deck → Add cards → Enroll → Study → See progress. UI может быть простым; цель — не красивый Dashboard, а работающий full-stack flow.

**Группа 0: Frontend scaffold**

- [ ] Создать React/TS приложение.
- [ ] Настроить React Router, Axios/fetch wrapper, базовый API client.
- [ ] Настроить JWT storage/use и protected routes.
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

- [ ] Обновить `docs/features/learning-flow.md` при изменениях flow/UX.
- [ ] Обновить `docs/architecture/current-architecture.md` если меняется frontend/backend интеграция.
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

1. Группа 0 (scaffold)
2. Группа 1 (auth)
3. Группа 2 (decks/cards)
4. Группа 3 (study)
5. Группа 4 (end-to-end smoke)
6. Группа 5 (docs)
