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

**Integration freeze:** новые продуктовые экраны и функции не добавляются, пока
не закрыт раздел 4 «Sprint 1.1 integration/stability gate». Допустимы только
исправления целостности данных, runtime foundation, контрактов, quality gates,
документации и обнаруженных регрессий текущего scope.

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

### 4. Sprint 1.1 integration/stability gate

Следующие пункты являются release blockers для закрытия спринта. Новый
продуктовый scope не добавлять до их завершения.

#### 4.1 Целостность learning data

- [ ] Разделить семантику создания и обновления карточки: создание должно
  добавлять progress, а обычное обновление существующей карточки не должно
  запускать повторное lifecycle-действие.
- [ ] После manual, single-AI и каждого успешного bulk-AI создания карточки
  создавать `NEW UserCardProgress` для каждого существующего `ACTIVE`
  enrollment этой колоды. Операция должна быть пакетной и идемпотентной,
  опираться на существующий unique constraint и не создавать дубликаты.
- [ ] Восстановить уже пропущенные progress rows для карточек, добавленных после
  enrollment до исправления. Backfill должен быть повторяемым и проверять только
  отсутствующие пары enrollment/card.
- [ ] Покрыть regression tests: manual create, single-AI create, частично
  успешный bulk create, несколько ACTIVE enrollments, отсутствие progress для
  неактивных enrollments, повторный запуск/backfill и update без дубликатов.
- [ ] Подтвердить, что новые и восстановленные карточки сразу видны в Study,
  Learning Deck Details и aggregate Progress.

#### 4.2 Runtime foundation и identity contracts

- [ ] Исправить startup bootstrap: success, profile `404`, auth `401`,
  network error и `5xx` должны переводить session из `initializing` в
  определённое terminal/retryable состояние. Бесконечный initial loader
  недопустим.
- [ ] Добавить bootstrap regression tests для network error, `5xx`, retry и
  успешного восстановления без потери корректного token/session state.
- [ ] Определить и внедрить единый URL-safe slug-контракт для `username`:
  допустимые символы, нормализацию и регистр, уникальность, backend validation,
  совместимость существующих данных, frontend routing, прохождение допустимых
  encoded-значений через реальные Spring endpoints, Postman и нормативные
  API-документы.
- [ ] До добавления username constraint проверить существующие данные на
  несовместимые значения и case-insensitive collisions; определить безопасную
  migration/compatibility policy.
- [ ] Определить и реализовать политику актуальности/инвалидации `currentUser`,
  включая повторный вход, завершение профиля и будущие profile mutations.
- [ ] После mutations корректно инвалидировать связанные списки, details,
  `currentUser` и progress; не маскировать отсутствие backend-возможности
  локальным mock state.

#### 4.3 Deck/Card lifecycle

- [ ] Принять и записать одно явное Level 1 решение для удаления Deck/Card:
  accepted hard delete, запрет удаления при learner data или soft delete.
  Зафиксировать влияние на cards, ACTIVE enrollments и `UserCardProgress`,
  ожидаемые HTTP errors и recovery expectations.
- [ ] Привести backend behavior, database constraints, confirmation copy,
  regression tests и нормативные architecture/database/API документы к
  выбранному lifecycle. Не оставлять UI hard delete при неоднозначном контракте.
- [ ] Если для Sprint 1.1 принимается hard delete, явно ограничить решение
  текущим Level 1 scope и не объявлять soft delete реализованным или бесследно
  отложенным.

#### 4.4 Quality gate и CI

- [ ] Вернуть зелёный `npm run format:check`; устранить все восемь известных
  frontend formatting failures.
- [ ] Вернуть чистый `git diff --check`; устранить trailing whitespace во всех
  известных frontend/backend-файлах.
- [ ] Добавить полноценный GitHub CI:
  - frontend install, test, lint, format check и production build с bundle
    budgets;
  - backend `./mvnw verify`;
  - agent-context validator;
  - существующий nginx check.
- [ ] CI не должен считать backend проверенным, если Maven dependencies или
  Maven Central недоступны: такой job должен завершаться явной ошибкой.
- [ ] Подтвердить frontend и backend checks на чистом checkout, а не только в
  локальном рабочем дереве.

#### 4.5 Документальная консистентность

- [ ] Обновить implemented scope и дату в
  `docs/architecture/current-architecture.md`: отразить aggregate Progress,
  Creator Profile, Discover contract и bulk AI partial-result flow.
- [ ] Синхронизировать current summary/discrepancy sections
  `BACKEND_CONTRACT_INVENTORY.md` с реализованными DECK-07, LEARN-07 и
  CARD-02; не оставлять их одновременно implemented и missing/open.
- [ ] В `FRONTEND_INTEGRATION_MAP.md` сохранить historical snapshot только с
  однозначной маркировкой. Текущий статус G-07/G-09/G-10 и Creator/Profile,
  Progress, bulk AI должен читаться без обращения к противоречащим summary.
- [ ] После lifecycle, username, progress-provisioning или bootstrap изменений
  синхронно обновить соответствующего нормативного владельца, Postman и
  integration docs по repository routing rules.

### 5. Оставшаяся интеграция и cleanup

- [ ] Сохранять контекст bulk Results при переходе к созданной карточке через
  View или Edit: возврат должен вести к результатам генерации текущей колоды,
  включая переходы после Save/Cancel, а прямое открытие Card Details/Edit должно
  безопасно возвращать к deck. Добавить regression tests для обоих сценариев.
- [ ] Добавить Retry для одного failed title и Retry all failed в bulk results,
  уважая `inputIndex`, `code`, `message` и `retryable`.
- [ ] Cancel для bulk generation добавлять только вместе с backend-контрактом,
  который реально останавливает серверную работу; frontend abort не считать
  cancellation.
- [ ] Привести нейминг в `features/bulk-generate-cards` к
  `frontend/NAMING.md`: заменить неоднозначный `draft` на доменное имя для
  исходного multiline input, уточнить `parsed`, `text`, `line`, `seen` и
  связанные props/actions/selectors, а framework-owned `data` при необходимости
  сразу алиасить (`data: deck`, `data: currentUser`). Не менять поведение,
  backend DTO и пользовательский flow; синхронно обновить тесты и public API.
- [ ] Устранить дублирование карточки публичной колоды между Discover и Creator
  Profile: вынести общую `PublicDeckCard` в `entities/deck/ui` с булевым
  `showOwner`, едиными Public/Enrolled badges, языками, card count, detail-link,
  стилями и тестами; page-specific grid и request states оставить в страницах.
- [ ] Добавлять только те backend endpoints, DTO и validation, которые нужны
  уже принятому Sprint 1.1 scope; новые продуктовые функции не добавлять.
- [ ] Добавить соразмерные frontend/backend regression tests для исправленных
  пользовательских сценариев.

### 6. Ручная desktop/mobile регрессия

- [ ] На чистых данных пройти desktop и mobile цепочку:
  Editors → Discover → Creator Profile → Progress → Bulk AI.
- [ ] Проверить loading, empty/no-results, API error/retry, validation,
  submitting, conflict, ownership и destructive confirmation states.
- [ ] Отдельно проверить enrollment → последующее manual/single-AI/bulk-AI
  добавление карточек → появление карточек в Study и Progress.
- [ ] Проверить refresh/direct-entry/back-navigation для Creator Profile,
  Card Details/Edit и bulk Results.
- [ ] Записать проверенные браузеры/viewports и найденные исключения в sprint
  evidence; непроверенное поведение не отмечать завершённым.

## ✅ Критерии завершения Sprint 1.1

- [ ] Каждая принятая canonical страница и состояние Stitch либо реализованы и
  проверены, либо явно исключены отдельным продуктовым решением.
- [ ] Все основные frontend-маршруты доступны через видимую навигацию и имеют
  адаптивное поведение, loading/empty/error states и честный API-контракт.
- [ ] Создание и редактирование колод/карточек, Discover, Creator Profile,
  aggregate Progress и Study работают как цельный пользовательский продукт.
- [ ] Все пункты Sprint 1.1 integration/stability gate закрыты: learning data
  согласованы, bootstrap имеет terminal/retryable outcomes, lifecycle и username
  contracts приняты, quality gates воспроизводятся в CI, нормативные документы
  синхронизированы.
- [ ] Автоматические проверки и ручная desktop/mobile регрессия проходят на
  чистом checkout; frontend/backend/nginx/agent-context jobs зелёные в CI.
- [ ] После закрытия спринта отдельно решено, нужен ли публичный release gate;
  незавершённый deployment не мешает закрытию Sprint 1.1.
