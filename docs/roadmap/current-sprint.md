# Текущий спринт

> Общий план: `docs/roadmap/roadmap.md`.
> Завершённые спринты: `docs/roadmap/changelog.md`.
> Будущие уровни, отложенные задачи и необязательный публичный релиз:
> `docs/roadmap/backlog.md`.

## Sprint 1.1 — Полный фронтенд

**Цель:** завершить основные продуктовые страницы и пользовательские состояния
по принятому Stitch-дизайну, чтобы LLHelper был цельным локальным приложением.
Публичный deployment не входит в этот спринт и рассматривается отдельно только
после завершения frontend.

**Источник дизайна:** `docs/frontend/DESIGN.md` описывает общий визуальный
контракт, `docs/frontend/design-reference/MANIFEST.md` — актуальные ресурсы
Stitch, а `docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md` — принятые
маршруты и границы backend-контрактов. Prototype-only элементы не становятся
фичами автоматически.

### 1. Проверка уже реализованного frontend

- [ ] Сверить реализованные `/login`, `/register`, `/onboarding/profile`,
  `/created`, `/discover`, `/decks/new`, owner/public Deck Details, `/learning`,
  Learning Deck Details и `/study` с соответствующими desktop/mobile экранами
  и состояниями из Stitch; исправить существенные расхождения.
- [x] Проверить единый app shell, навигацию, адаптивность, клавиатурную
  доступность и видимость всех реализованных маршрутов из интерфейса.
- [ ] Для существующих страниц подтвердить loading, empty/no-results, API error,
  retry, validation, submitting и conflict states там, где они предусмотрены
  manifest и реальным API-контрактом.

### 2. Основные недостающие страницы и функции

- [ ] Реализовать Card Details по маршруту
  `/decks/:deckId/cards/:cardId` и полный Card Editor по маршруту
  `/decks/:deckId/cards/:cardId/edit`, включая редактирование, удаление,
  подтверждение destructive action и честные loading/validation/error states.
- [ ] Реализовать Edit Deck по маршруту `/decks/:deckId/edit`: загрузка текущих
  данных, validation, visibility mapping, сохранение и удаление.
- [ ] Завершить Discover: поиск, фильтры, сортировка и pagination/load-more.
  Показывать только те controls, которые поддержаны согласованным API.
- [ ] Реализовать Creator Profile и список публичных колод автора по маршруту
  `/creators/:username`.
- [ ] Реализовать общий Progress dashboard по маршруту `/progress`.
- [ ] Завершить bulk AI generation в Card Editor и показать частичный результат
  без silent skip: созданные карточки отдельно от неуспешных с причиной ошибки.

### 3. Покрытие состояний Stitch

- [ ] Для Learning, Created, Discover, Owner Deck Details и Progress реализовать
  или подтвердить canonical loading, API error и empty/no-results states.
- [ ] Для Create/Edit Deck и Add/Edit Card реализовать canonical validation,
  conflict, submitting и submission-error states.
- [ ] Для Study подтвердить loading, API error, all-caught-up и
  session-complete states без изменения принятой learning-семантики.
- [ ] Где отдельного mobile-экрана в Stitch нет, сделать адаптивную версию из
  desktop reference по общему design system; отсутствие mobile Edit Deck или
  Card Details не означает, что mobile experience можно пропустить.
- [ ] Не реализовывать prototype-only social controls, ratings, likes, follows
  и bookmarks без отдельного продуктового решения и API-контракта.

### 4. Контракты и качество

- [ ] Определить и реализовать политику актуальности/инвалидации `currentUser`.
- [ ] Добавить только те backend endpoints, DTO, validation и тесты, которые
  необходимы выбранным frontend-страницам: Card Details/Edit, Creator Profile,
  aggregate Progress, Discover query contract и честный bulk AI result.
- [ ] После mutations корректно инвалидировать связанные списки, details и
  progress; не маскировать отсутствие backend-возможности локальным mock state.
- [ ] Добавить соразмерные frontend/backend regression tests для новых
  пользовательских сценариев и выполнить ручную desktop/mobile проверку.
- [ ] При изменении API или feature flow синхронно обновить нормативные docs,
  Postman и integration map.

## ✅ Критерии завершения Sprint 1.1

- [ ] Каждая принятая canonical страница и состояние Stitch либо реализованы и
  проверены, либо явно исключены отдельным продуктовым решением.
- [ ] Все основные frontend-маршруты доступны через видимую навигацию и имеют
  адаптивное поведение, loading/empty/error states и честный API-контракт.
- [ ] Создание и редактирование колод/карточек, Discover, Creator Profile,
  aggregate Progress и Study работают как цельный пользовательский продукт.
- [ ] Автоматические проверки и ручная desktop/mobile регрессия проходят.
- [ ] После закрытия спринта отдельно решено, нужен ли публичный release gate;
  незавершённый deployment не мешает закрытию Sprint 1.1.
