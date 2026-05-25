# Backend Improvements

Список улучшений и рефакторингов, которые стоит сделать в будущем.

## Performance

- [ ] **Хранить authUserId в JWT токене как claim**  
  Сейчас: токен → email → запрос в БД за AuthUser → получаем authUserId  
  Лучше: токен → authUserId без запроса в БД  
  Файлы: `JwtService.java`, `JwtAuthenticationFilter.java`

## Security

- [ ] Добавить rate limiting на auth endpoints (/login, /register)
- [ ] Добавить refresh token mechanism
- [ ] Включить HTTPS в production

## Architecture

- [ ] Добавить пагинацию для списковых endpoint'ов
- [ ] Добавить глобальный exception handler (@ControllerAdvice)
- [ ] Добавить логирование запросов (request/response logging)
- [ ] **Внедрить Lombok во всех классах с getter/setter/constructor**  
  Заменить ручные getter/setter и конструкторы на Lombok аннотации:  
  - `@Getter` / `@Setter` на уровне класса  
  - `@NoArgsConstructor` / `@AllArgsConstructor` / `@Builder`  
  - `@Slf4j` вместо `LoggerFactory.getLogger()`  
  Файлы: все entity, сервисы без `@Slf4j`, DTO-классы (не record)

- [ ] **Валидация AI-generated заголовков карточек перед генерацией**  
  Проверять заголовки: не пустая строка, не одна буква, не число, не абракадабра (regex для валидных слов)  
  Файлы: `AiCardGenerationService.java`, `CardServiceImpl.java`

## Database

- [ ] Включить Flyway для миграций
- [ ] Добавить индексы на часто используемые поля (email, username)
- [ ] **Реализовать created_at через PostgreSQL DEFAULT**  
  Сейчас: используется `@PrePersist` в Java коде для установки `createdAt`  
  Лучше: `ALTER TABLE users ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP`  
  Это разгрузит приложение и перенесёт ответственность на БД  
  Файлы: `AuthUser.java`, `User.java` — убрать `@PrePersist` для `createdAt`

- [ ] **Вынести synonyms, examples и keywords в отдельные независимые таблицы**
  Сейчас: `card_synonyms` и `card_examples` — дочерние таблицы карточки через `@ElementCollection`
  Цель: создать самостоятельные таблицы `synonyms`, `examples`, `keywords` со своими сущностями,
  чтобы можно было искать альтернативные синонимы/примеры по БД без обращения к ИИ
  Файлы: `Card.java`, новые модули `synonym/`, `example/`, `keyword/`

- [ ] **Сделать enum для языков на уровне БД**
  Сейчас: языки хранятся как `VARCHAR` (nativeLanguage, targetLanguage, uiLanguage)
  Лучше: создать PostgreSQL `ENUM` тип (`CREATE TYPE language AS ENUM ('ru', 'en', 'de', ...)`)
  и использовать `@Enumerated(EnumType.STRING)` в Java с соответствующим `enum Language`
  Файлы: `User.java`, новый `Language.java` enum, миграция Flyway

- [ ] **Добавить уровень сложности слова и деки (CEFR: A1–C2)**
  Добавить поле `level` (enum: A1, A2, B1, B2, C1, C2) для `Card` и `CardDesc`
  Для `Card` — уровень конкретного слова (AI может возвращать его вместе с данными)
  Для `CardDesc` — общий уровень деки, вычисляется из карточек или задаётся вручную
  Файлы: `Card.java`, `CardDesc.java`, `AiCardGenerationService.java`, `AiCardData.java`

## AI Features

- [ ] **Система ИИ-анализа прогресса и рекомендаций**
  ИИ анализирует выученные слова пользователя и выдаёт:
  - Оценку текущего уровня (A1–C2) на основе выученных слов
  - Рекомендацию следующего уровня (например: "ты освоил A1–B1, пора переходить на B2–C1")
  - Список пропущенных важных слов на текущем уровне
  - Рекомендации конкретных дек для изучения
  Требует: система прохождения card_desc, хранение прогресса, поле `level` в `Card`/`CardDesc`
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
