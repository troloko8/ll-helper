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

- [x] Реализовать Card Details по маршруту
  `/decks/:deckId/cards/:cardId` и полный Card Editor по маршруту
  `/decks/:deckId/cards/:cardId/edit`, включая редактирование, удаление,
  подтверждение destructive action и честные loading/validation/error states.
- [x] Реализовать Edit Deck по маршруту `/decks/:deckId/edit`: загрузка текущих
  данных, validation, visibility mapping, сохранение и удаление.
- [x] Завершить Discover: поиск, фильтры, сортировка и pagination/load-more.
  Показывать только те controls, которые поддержаны согласованным API.
- [x] Реализовать Creator Profile и список публичных колод автора по маршруту
  `/creators/:username`.
- [x] Реализовать общий Progress dashboard по маршруту `/progress`.
- [x] Завершить отдельный bulk AI generation flow и показать частичный результат
  без silent skip: отдельный маршрут и feature, canonical Input/Generating/Results,
  созданные карточки отдельно от неуспешных со стабильным кодом и безопасным
  сообщением ошибки.
- [ ] Сохранять контекст bulk Results при переходе к созданной карточке через
  View или Edit: возврат должен вести к результатам генерации текущей колоды,
  включая переходы после Save/Cancel, а прямое открытие Card Details/Edit должно
  безопасно возвращать к deck. Добавить regression tests для обоих сценариев.
- [ ] Добавить Retry для одного failed title и Retry all failed в bulk results;
  CARD-02 уже возвращает `inputIndex`, `code`, `message` и `retryable`, но UI
  retry намеренно не входит в текущую реализацию.
- [ ] Добавить Cancel для bulk generation только вместе с backend-контрактом,
  который реально останавливает серверную работу. Не подменять cancellation
  frontend-abort, потому что он прекращает ожидание ответа, но не AI generation.

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

- [ ] Привести нейминг в `features/bulk-generate-cards` к
  `frontend/NAMING.md`: заменить неоднозначный `draft` на доменное имя для
  исходного multiline input, уточнить `parsed`, `text`, `line`, `seen` и
  связанные props/actions/selectors, а framework-owned `data` при необходимости
  сразу алиасить (`data: deck`, `data: currentUser`). Не менять поведение,
  backend DTO и пользовательский flow; синхронно обновить тесты и public API.
- [ ] Определить и внедрить единый URL-safe slug-контракт для `username`:
  допустимые символы, нормализацию и регистр, уникальность, backend validation,
  совместимость существующих данных, frontend routing, прохождение допустимых
  encoded-значений через реальные Spring endpoints, Postman и нормативные
  API-документы.
- [ ] Определить и реализовать политику актуальности/инвалидации `currentUser`.
- [ ] Устранить дублирование карточки публичной колоды между Discover и Creator
  Profile: вынести общую `PublicDeckCard` в `entities/deck/ui` с булевым
  `showOwner`, едиными Public/Enrolled badges, языками, card count, detail-link,
  стилями и тестами; page-specific grid и request states оставить в страницах.
  Это нужно, потому что две реализации уже расходятся по отображению
  `isEnrolled` и будут требовать синхронных исправлений.
- [ ] Добавить только те backend endpoints, DTO, validation и тесты, которые
  необходимы выбранным frontend-страницам: Card Details/Edit, Creator Profile,
  aggregate Progress, Discover query contract и честный bulk AI result.
- [ ] После mutations корректно инвалидировать связанные списки, details и
  progress; не маскировать отсутствие backend-возможности локальным mock state.
- [ ] При добавлении карточки создать `NEW` `UserCardProgress` для каждого
  существующего `ACTIVE` enrollment этой колоды, чтобы новые карточки сразу
  попадали в Study и Progress. Покрыть manual, single-AI и bulk-AI creation,
  не создавая дубликаты при update карточки.
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
