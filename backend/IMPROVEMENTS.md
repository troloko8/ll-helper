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

## Testing

- [ ] Добавить unit-тесты для сервисов
- [ ] Добавить integration-тесты для контроллеров
- [ ] Настроить TestContainers для интеграционных тестов

## Documentation

- [ ] Добавить OpenAPI/Swagger документацию
- [ ] Описать API endpoints и примеры запросов
