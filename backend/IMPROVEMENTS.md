# Backend Improvements

Список улучшений и рефакторингов, которые стоит сделать в будущем.

## Performance

- [ ] **Хранить userId (User.id) в JWT токене как claim**  
  Сейчас: токен → email → запрос в БД за AuthUser → запрос в БД за User → получаем userId  
  Лучше: токен → userId без запросов в БД  
  Критичность: 🔴 HIGH — `SecurityUtils.getCurrentUserId()` делает 2 DB запроса на каждый защищённый endpoint  
  Файлы: `JwtService.java`, `JwtAuthenticationFilter.java`, `SecurityUtils.java`  
  После миграции токена: раскомментировать `UserRateLimiter.checkLimitByUserId()`, заменить все `checkLimitByEmail()` вызовы на `checkLimitByUserId()` в сервисах, удалить `emailBuckets` логику для authenticated endpoints.

## Security

- [x] Добавить rate limiting на auth endpoints (/login, /register)
- [ ] **🔴 КРИТИЧНО: IP-based rate limiting для `/auth/register`**  
  Сейчас: `AUTH_REGISTER` лимитируется по email — легко обойти, используя разные email'ы  
  Лучше: лимитировать по IP-адресу (например, 10 запросов / 10 минут с одного IP)  
  Реализация Level 2: `HttpServletRequest.getRemoteAddr()` в фильтре или перехватчике, отдельный `IpRateLimiter` bean  
  Пример ключа: `"ip:192.168.1.1"` + `RateLimitAction.AUTH_REGISTER`  
  Файлы: новый `IpRateLimiter.java`, `AuthServiceImpl.java` или Spring filter
- [ ] Добавить refresh token mechanism
- [ ] Включить HTTPS в production

## Architecture

- [ ] Добавить пагинацию для списковых endpoint'ов
- [x] Добавить глобальный exception handler (@ControllerAdvice)
- [ ] Добавить логирование запросов (request/response logging)
- [ ] **Внедрить Lombok во всех классах с getter/setter/constructor**  
  Заменить ручные getter/setter и конструкторы на Lombok аннотации:  
  - `@Getter` / `@Setter` на уровне класса  
  - `@NoArgsConstructor` / `@AllArgsConstructor` / `@Builder`  
  - `@Slf4j` вместо `LoggerFactory.getLogger()`  
  Файлы: все entity, сервисы без `@Slf4j`, DTO-классы (не record)

- [ ] **Добавить общий timeout на bulk-генерацию карточек**
  Сейчас: `requestTimeoutSeconds=120` действует на **каждый отдельный** OpenAI-запрос.
  При 100 карточках в bulk — потенциально до 100×120с = ~3.3 часа на один запрос клиента.
  Лучше: добавить `maxBulkTimeoutSeconds` (например, 120с на весь batch), прерывать оставшиеся вызовы по истечении.
  Реализация: `CompletableFuture` + `orTimeout()` или ограничение на стороне WebFlux.
  Файлы: `CardServiceImpl.createBulk()`, `AiProperties.java`
  Уровень: Level 1

- [ ] **Валидация AI-generated заголовков карточек перед генерацией**  
  Проверять заголовки: не пустая строка, не одна буква, не число, не абракадабра (regex для валидных слов)  
  Файлы: `AiCardGenerationService.java`, `CardServiceImpl.java`

## Database

- [x] Настроить Liquibase для миграций (schema defined through V11: unique constraints, FK cascades, CHECK constraints, timestamptz, G-06 enrollment ordering support)
- [x] Индексы на `email`/`username` — уже есть через UNIQUE constraints (V1 baseline)
- [ ] **Добавить индекс на `user_card_progress.next_review_at`**  
  Единственный оставшийся пробел по индексам, см. `docs/database/relationships.md` §8
- [x] **Реализовать created_at через PostgreSQL DEFAULT** — done in V9 migration (`DEFAULT CURRENT_TIMESTAMP` + trigger для `updated_at`), `@PrePersist` больше не используется для технических timestamp'ов

- [ ] **Вынести synonyms, examples и keywords в отдельные независимые таблицы**
  Сейчас: `card_synonyms` и `card_examples` — дочерние таблицы карточки через `@ElementCollection`
  Цель: создать самостоятельные таблицы `synonyms`, `examples`, `keywords` со своими сущностями,
  чтобы можно было искать альтернативные синонимы/примеры по БД без обращения к ИИ
  Файлы: `Card.java`, новые модули `synonym/`, `example/`, `keyword/`

- [x] **Java enum + DB CHECK constraint для языков** — done: `common/model/Language.java` (ISO 639-1) на `Deck.sourceLanguage`/`targetLanguage`, `CHECK` constraints в V6 миграции. Колонки остаются `VARCHAR`, а не нативный PostgreSQL `ENUM` тип — CHECK даёт ту же гарантию валидности без миграции типа колонки.

- [ ] **Добавить уровень сложности слова и деки (CEFR: A1–C2)**
  Добавить поле `level` (enum: A1, A2, B1, B2, C1, C2) для `Card` и `Deck`
  Для `Card` — уровень конкретного слова (AI может возвращать его вместе с данными)
  Для `Deck` — общий уровень деки, вычисляется из карточек или задаётся вручную
  Файлы: `Card.java`, `Deck.java`, `AiCardGenerationService.java`, `AiCardData.java`

- [ ] **Убрать хрупкий парсинг текста ошибки в `LearningServiceImpl.enrollDeck()`**
  Сейчас: дубликат enrollment определяется через `e.getMessage().contains("uk_user_deck_progress_user_deck")` в catch-блоке `DataIntegrityViolationException`
  Проблема: текст ошибки зависит от версии PostgreSQL, JDBC-драйвера и локали — хрупкая проверка
  Лучше: предварительная проверка `existsByUserIdAndDeckId()` перед `save()`, либо отдельный слой exception-translation
  Найдено в code review `LearningServiceImplTest` (см. FIXME в коде)
  Файлы: `LearningServiceImpl.java`

- [ ] **Реализовать soft delete для дек (Deck) и карточек (Card)**
  Добавить поле `deleted_at` (TIMESTAMP, nullable) в таблицы `decks` и `cards`
  При удалении — устанавливать `deleted_at = CURRENT_TIMESTAMP` вместо физического удаления
  Все запросы на получение списков фильтровать по `deleted_at IS NULL`
  Добавить endpoint для восстановления (undo delete) или полного удаления (hard delete)
  Файлы: `Deck.java`, `Card.java`, `DeckRepository.java`, `CardRepository.java`, `DeckServiceImpl.java`, `CardServiceImpl.java`
  Уровень: Level 1 (сейчас удаление — CASCADE, см. `docs/database/relationships.md` §9)

## AI Features

- [ ] **Общий прогресс пользователя по изученным словам**
  Добавить систему отслеживания прогресса:
  - Счётчик выученных/в процессе/не начатых слов
  - Процент завершения по каждой деке
  - Статистика по дням/неделям (streak, количество новых слов)
  - Общий словарный запас пользователя
  Требует: таблица `user_progress` или поля в связи user-card, endpoint для статистики
  Файлы: новый модуль `progress/`, `UserProgress.java`, `ProgressService.java`, `ProgressController.java`

- [ ] **Система ИИ-анализа прогресса и рекомендаций**
  ИИ анализирует выученные слова пользователя и выдаёт:
  - Оценку текущего уровня (A1–C2) на основе выученных слов
  - Рекомендацию следующего уровня (например: "ты освоил A1–B1, пора переходить на B2–C1")
  - Список пропущенных важных слов на текущем уровне
  - Рекомендации конкретных дек для изучения
  Требует: система прохождения deck'ов, хранение прогресса, поле `level` в `Card`/`Deck`
  Файлы: новый модуль `ai_analysis/`, `AiCardGenerationService.java`

## Testing

- [ ] Добавить unit-тесты для сервисов
- [ ] Добавить integration-тесты для контроллеров
- [ ] Настроить TestContainers для интеграционных тестов

## Documentation

- [ ] **Добавить OpenAPI/Swagger и интеграцию с Postman**  
  План:  
  1. Добавить `springdoc-openapi` зависимость в `pom.xml`  
  2. Настроить `application.yaml` с путями `/v3/api-docs` и `/swagger-ui.html`  
  3. Импортировать `/v3/api-docs` в Postman (авто-генерация коллекции)  
  4. Старый `LLHelper.postman_collection.json` оставить только для кастомных тестовых body  
  Это даст единый источник правды для API и автоматическую актуальную документацию  
  Файлы: `pom.xml`, `application.yaml`
- [ ] Описать API endpoints и примеры запросов
- [ ] **Добавлять Postman-запрос для каждого нового endpoint'а**  
  Правило: при создании нового endpoint в контроллере, сразу добавлять соответствующий запрос в `LLHelper.postman_collection.json`  
  Использовать skill: `add-postman-request`  
  Это обеспечит актуальность API-документации и упростит тестирование

- [ ] **Синхронизировать примеры request body в Postman с реальными DTO-полями**  
  Проблема: примеры тела запроса в Postman могут использовать устаревшие или неверные имена полей (например `"name"` вместо `"title"`), что приводит к silent null и ошибкам БД  
  Правило: при изменении `*Request` record — обновлять соответствующий пример в Postman-коллекции  
  Долгосрочное решение: перейти на OpenAPI/Swagger (см. выше) для автогенерации актуальных примеров  
  Файлы: `LLHelper.postman_collection.json`, все `dto/request/*.java`

## Learning Mode (Future Enhancements)

Фичи, отложенные при реализации системы обучения карточек (learning mode):

- [ ] **Вычисление и использование `difficultyLevel`**  
  Сейчас: поле всегда `null`  
  Цель: рассчитывать сложность карточки на основе статистики (время ответа, количество ошибок)  
  Файлы: `UserCardProgress.java`, `LearningServiceImpl.java`

- [ ] **Алгоритм интервального повторения для `nextReviewAt`**  
  Сейчас: поле всегда `null`  
  Цель: реализовать SM-2 или собственный алгоритм расчёта следующего повторения  
  Файлы: `UserCardProgress.java`, `LearningServiceImpl.java`

- [ ] **Система проверки синонимов**  
  Сейчас: проверка только по `card.title` (точное совпадение)  
  Цель: учитывать `card.synonyms`, вводить статусы "почти правильно" с подсказкой  
  Файлы: `LearningServiceImpl.java`

- [ ] **Отслеживание времени на карточку (`timeSpentMs`)**  
  Сейчас: не передаётся в запросе  
  Цель: фронтенд отправляет время с начала показа карточки до ответа (в мс) для анализа сложности  
  Файлы: `CardReviewRequest.java`, `UserCardProgress.java`

- [ ] **Поле `order`/`position` для карточек в deck'е**  
  Сейчас: сортировка по `card.id ASC`  
  Цель: явный порядок карточек, задаваемый создателем deck'а  
  Файлы: `Card.java`, `DeckService.java`

- [x] **`REVIEWING` карточки участвуют в подборке для study**
  Реализовано: `LearningServiceImpl.getStudyCards()` использует приоритет `LEARNING` → `REVIEWING` → `NEW`, исключает `MASTERED` и возвращает не более 10 карточек
  Файлы: `LearningServiceImpl.java`

- [ ] **Просмотр прогресса других пользователей**  
  Сейчас: каждый видит только свой `UserCardProgress`  
  Цель: учитель может просматривать прогресс ученика (требует системы ролей/прав)  
  Файлы: новая система permissions, `LearningController.java`

- [ ] **Авто-enroll при открытии публичной deck'и**  
  Сейчас: 403 ошибка если deck не добавлен в коллекцию  
  Цель: для публичных deck'ов (`isPublic=true`) автоматически добавлять в коллекцию при первом открытии  
  Файлы: `LearningController.java`, `LearningServiceImpl.java`

- [ ] **Градации сложности ответа (HARD, EASY, CORRECT, WRONG)**  
  Сейчас: boolean (`correct: true/false`)  
  Цель: пользователь оценивает, насколько было сложно вспомнить (влияет на интервал повторения)  
  Файлы: `CardReviewRequest.java`, `LearningServiceImpl.java`

- [ ] **Приоритет карточек по сложности и просрочке**  
  Сейчас: простая очередь (LEARNING → NEW)  
  Цель: умная очередь с учётом просроченных карточек, сложности, времени последнего повторения  
  Файлы: `LearningServiceImpl.java`, `UserCardProgressRepository.java`

- [ ] **Пересмотреть хранение `UserCardProgress` в БД**  
  Сейчас: при enroll создаётся запись `UserCardProgress` для каждой карточки в деке → много строк в БД при больших декax  
  Вариант: не хранить прогресс по карточкам заранее, а генерировать список карточек для фронта динамически из `cards` деки, сохраняя только прогресс по факту ответа (lazy creation)  
  Плюсы: меньше места в БД, нет "мёртвых" записей для карточек, которые пользователь никогда не дойдёт  
  Минусы: сложнее отслеживать статус NEW vs не начатые  
  Файлы: `UserCardProgress.java`, `LearningServiceImpl.java`, `UserCardProgressRepository.java`
