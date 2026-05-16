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
