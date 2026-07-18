---
trigger: glob
description: Testing conventions — loaded when working with test files or test config
globs:
  - "**/*Test.java"
  - "**/*Tests.java"
  - "**/TestData.java"
  - "**/testing-conventions.md"
---

# Testing Conventions — LLHelper Backend

## Test Stack

### Level 0–1 — всё включено в `spring-boot-starter-test`, ничего добавлять не нужно

| Инструмент | Роль |
|------------|------|
| **JUnit 5 (Jupiter)** | Test runner — `@Test`, `@BeforeEach`, `@ExtendWith` |
| **Mockito** | Mocking зависимостей — `@Mock`, `when()`, `verify()` |
| **@MockitoBean** | Spring Boot 4.x: заменяет `@MockBean` в `@WebMvcTest` контексте |
| **AssertJ** | Fluent assertions — `assertThat(...).isEqualTo(...)` |
| **MockMvc** | HTTP-контракт без запуска сервера — `@WebMvcTest` |

### Level 2+ — добавить в pom.xml

```xml
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
</dependency>
```

**Никогда не использовать H2** для этого проекта. Причины:
- H2 не поддерживает `TIMESTAMPTZ`
- H2 не поддерживает PostgreSQL-синтаксис триггеров
- H2 не исполняет наши `CHECK` constraints из Liquibase
- Результаты тестов на H2 не гарантируют корректность на PostgreSQL

## Типы тестов по уровням

| Уровень | Тип | Аннотация | Что проверяет |
|---------|-----|-----------|---------------|
| 0 | Unit | `@ExtendWith(MockitoExtension.class)` | Бизнес-логика изолированно, без Spring и DB |
| 0 | Controller slice | `@WebMvcTest` | HTTP контракт: статусы, validation, JSON, GlobalExceptionHandler |
| 0 | DB smoke | `@SpringBootTest` + Testcontainers | Liquibase runs, context loads, schema valid (один `contextLoads` тест) |
| 2 | Repository slice | `@DataJpaTest` + Testcontainers | Custom queries, DB constraints, FK, triggers, timestamps |
| 2 | Integration | `@SpringBootTest` + Testcontainers | Полный flow: service + DB + security + Liquibase |
| 3 | E2E | RestAssured | Полный HTTP flow против реально запущенного приложения |

**Level 0:** Unit + @WebMvcTest + один `contextLoads` DB smoke с Testcontainers. Полноценные repository и integration тесты — Level 2.

> **Почему DB smoke в Level 0:** проект содержит TIMESTAMPTZ, триггеры, CHECK constraints, Liquibase V1–V10. Без автоматической проверки что миграции запускаются на чистой PostgreSQL — ручной контроль ненадёжен.

## Именование тестов

**Формат:** `method_shouldExpectedResult_whenCondition`

```java
// Хорошо
enroll_shouldThrowConflict_whenDeckAlreadyEnrolled()
review_shouldIncrementCorrectCount_whenResultIsCorrect()
update_shouldThrowForbidden_whenUserIsNotOwner()
parseResponse_shouldThrowException_whenJsonIsInvalid()
login_shouldReturn429_whenRateLimitExceeded()

// Плохо
testEnroll()
enroll_success()
shouldWork()
```

## Arrange — Act — Assert (AAA)

Нетривиальные тесты явно делятся на три блока:

```java
@Test
void review_shouldIncrementCorrectCount_whenResultIsCorrect() {
    // Arrange
    UserCardProgress progress = LearningTestData.defaultProgress();

    // Act
    service.review(progress, ReviewResult.CORRECT);

    // Assert
    assertThat(progress.getTimesCorrect()).isEqualTo(1);
    assertThat(progress.getCorrectStreak()).isEqualTo(1);
}
```

- Комментарии `// Arrange / Act / Assert` обязательны когда структура неочевидна
- Для тривиальных тестов — не засоряй шаблоном:
  ```java
  @Test
  void constructor_shouldRejectNullClock() {
      assertThatThrownBy(() -> new LearningServiceImpl(repo, null))
          .isInstanceOf(NullPointerException.class);
  }
  ```
- Не смешивать Arrange и Assert
- Один тест — один сценарий

## Независимость тестов

- Каждый тест создаёт свои данные сам — через `TestData` или локальные переменные
- **Нельзя строить цепочку:** тест 1 создаёт, тест 2 использует, тест 3 удаляет
- `@BeforeEach` — только для инфраструктуры (Clock, setup mock'ов), не для данных

## Детерминированность тестов

**Никогда не использовать в тестируемом коде напрямую:**
- `Instant.now()` — зависит от реального времени
- `LocalDateTime.now()` — зависит от timezone сервера
- `Thread.sleep()` — делает тест медленным и ненадёжным
- Случайные данные без фиксированного seed

**Всегда внедрять `Clock` в сервисы, работающие со временем:**

```java
// В сервисе
private final Clock clock;

public LearningServiceImpl(UserCardProgressRepository repository, Clock clock) {
    this.repository = repository;
    this.clock = clock;
}

// Вместо Instant.now()
Instant now = Instant.now(clock);
```

**В тесте использовать фиксированный `Clock`:**

```java
// В TestData.java
public static Clock fixedClock() {
    return Clock.fixed(Instant.parse("2024-01-01T10:00:00Z"), ZoneOffset.UTC);
}

// В тесте
Clock clock = TestData.fixedClock();
LearningServiceImpl service = new LearningServiceImpl(repository, clock);
```

## Что мокать

**В Unit тестах — мокать всё внешнее:**

```java
@ExtendWith(MockitoExtension.class)
class LearningServiceImplTest {

    @Mock
    private UserCardProgressRepository progressRepository;

    @Mock
    private UserDeckProgressRepository deckProgressRepository;
    
    // Clock — через конструктор с фиксированным значением, не @Mock
    private Clock clock = TestData.fixedClock();

    @InjectMocks  // или ручной конструктор с clock
    private LearningServiceImpl service;
}
```

**В @WebMvcTest — мокать service layer:**

```java
@WebMvcTest(LearningController.class)
class LearningControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean  // Spring Boot 4.x — заменяет @MockBean
    private LearningService learningService;
}
```

## Что НЕ мокать

- Lombok-generated getters/setters — они не тестируются вообще
- Spring Data стандартные методы сами по себе (`save()`, `findById()`) — не тестируй факт что библиотека работает; используй их внутри `@DataJpaTest` для проверки **своего** поведения: constraint violation, cascade, trigger, generated value
- `record`-конструкторы
- **Никогда не мокать тестируемый класс** — если мокаешь `LearningServiceImpl`, ты тестируешь mock, не логику

## Что НЕ тестировать

- Lombok-generated код
- Стандартные Spring Data методы сами по себе — тестируй своё DB-поведение через них, не сам `save()`
- Отдельные unit-тесты Jackson-сериализации DTO — но **обязательно проверяй JSON API контракт через `@WebMvcTest`**: enum values, Instant formatting, field names, nullable, ignored fields
- Внутреннюю реализацию Spring Security — но **тестируй свою security конфигурацию**: публичный endpoint → без JWT, protected → 401, не-owner → 403, expired JWT → 401
- Простые DTO getters

**Фокус на:**
- Бизнес-правила и расчёты (`LearningServiceImpl` — расчёт `nextReviewAt`, переходы статусов)
- Security и ownership checks
- HTTP контракт (статусы, JSON-структура, validation errors)
- Сценарии с ошибками
- DB constraints (Level 2)

## AssertJ — предпочтительный стиль

```java
// Плохо — JUnit assertions
assertEquals(1, progress.getTimesCorrect());
assertTrue(progress.getNextReviewAt().isAfter(now));
assertNotNull(result);

// Хорошо — AssertJ
assertThat(progress.getTimesCorrect()).isEqualTo(1);
assertThat(progress.getNextReviewAt()).isAfter(now);
assertThat(result).isNotNull();

// Для исключений — AssertJ
assertThatThrownBy(() -> service.enroll(userId, deckId))
    .isInstanceOf(ConflictException.class)
    .hasMessageContaining("already enrolled");
```

## Структура Unit теста

```java
@ExtendWith(MockitoExtension.class)
class LearningServiceImplTest {

    @Mock
    private UserCardProgressRepository progressRepository;

    @Mock
    private UserDeckProgressRepository deckProgressRepository;

    private LearningServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new LearningServiceImpl(progressRepository, deckProgressRepository, TestData.fixedClock());
    }

    @Test
    void review_shouldIncrementCorrectCount_whenResultIsCorrect() {
        // Arrange
        UserCardProgress progress = TestData.defaultProgress();

        // Act
        service.review(progress, ReviewResult.CORRECT);

        // Assert
        assertThat(progress.getTimesCorrect()).isEqualTo(1);
    }
}
```

## Структура Controller теста (@WebMvcTest)

```java
@WebMvcTest(LearningController.class)
class LearningControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean  // Spring Boot 4.x — заменяет @MockBean
    private LearningService learningService;

    @Test
    @WithMockUser
    void enroll_shouldReturn200_whenSuccess() throws Exception {
        when(learningService.enrollDeck(any(), any())).thenReturn(someResponse);

        mockMvc.perform(post("/api/v1/learning/enroll/1")
                .with(csrf()))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.deckId").value(1))    // JSON контракт — проверяем здесь
               .andExpect(jsonPath("$.status").value("LEARNING"));  // enum как строка
    }

    @Test
    @WithMockUser
    void enroll_shouldReturn409_whenAlreadyEnrolled() throws Exception {
        when(learningService.enrollDeck(any(), any()))
            .thenThrow(new ConflictException("already enrolled"));

        mockMvc.perform(post("/api/v1/learning/enroll/1")
                .with(csrf()))
               .andExpect(status().isConflict());
    }
}
```

## Структура пакетов (test/)

```
src/test/java/com/llhelper/
├── learning/
│   ├── service/
│   │   └── LearningServiceImplTest.java       ← unit
│   └── controller/
│       └── LearningControllerTest.java        ← @WebMvcTest
├── deck/
│   ├── service/
│   │   └── DeckServiceImplTest.java
│   └── controller/
│       └── DeckControllerTest.java
├── card/
│   ├── service/
│   │   └── CardServiceImplTest.java
│   └── controller/
│       └── CardControllerTest.java
├── user/
│   ├── service/
│   │   └── UserServiceImplTest.java
│   └── controller/
│       └── UserControllerTest.java
├── auth/
│   └── controller/
│       └── AuthControllerTest.java
├── ai/
│   └── AiResponseParserTest.java
└── common/
    ├── security/
    │   └── UserRateLimiterTest.java
    └── support/
        └── TestData.java                      ← cross-domain fixtures (Clock, utils)
```

## TestData — shared fixtures

```java
// common/support/TestData.java — только cross-domain утилиты
public final class TestData {
    private TestData() {}

    public static Clock fixedClock() {
        return Clock.fixed(Instant.parse("2024-01-01T10:00:00Z"), ZoneOffset.UTC);
    }
}

// learning/support/LearningTestData.java — domain-specific fixtures
public final class LearningTestData {
    private LearningTestData() {}

    public static UserCardProgress defaultProgress() {
        UserCardProgress p = new UserCardProgress();
        p.setCardId(1L);
        p.setStatus(CardStatus.NEW);
        p.setTimesCorrect(0);
        p.setTimesWrong(0);
        p.setCorrectStreak(0);
        return p;
    }
}
```

**Правило: важные входные условия — явно в тесте**

Если для теста критичен начальный стейт (переход статуса, threshold), не прячь его в fixture:

```java
// Плохо — читатель должен открыть LearningTestData чтобы понять что происходит
UserCardProgress progress = LearningTestData.defaultProgress();
service.review(progress, CORRECT);
assertThat(progress.getStatus()).isEqualTo(MASTERED);

// Хорошо — критичные поля для сценария видны прямо в тесте
UserCardProgress progress = LearningTestData.defaultProgress();
progress.setStatus(CardStatus.REVIEW);
progress.setCorrectStreak(2);
progress.setTimesCorrect(5);
```

**Правило: разделяй TestData по доменам при росте**

Начинать с одного `TestData.java` допустимо. При росте свыше 5 доменных методов — делить:

```
common/support/TestData.java             ← Clock, shared utils
learning/support/LearningTestData.java
deck/support/DeckTestData.java
card/support/CardTestData.java
```

Избегай god-fixture: скрытые зависимости между тестами через общий state хуже чем небольшое дублирование.

## Coverage — метрика, не цель

Coverage показывает какой код выполнился, но не доказывает корректность.

**Level 0 — покрывать в первую очередь:**
1. Бизнес-правила (`LearningServiceImpl` — расчёты, переходы статусов)
2. Security и ownership checks
3. HTTP контракт (400, 401, 403, 404, 409, 429)
4. Сценарии с ошибками

**Не гнаться за coverage на:**
- Entity getters/setters
- Простые DTO
- Config классы
- Стандартный CRUD без логики

## @Disabled — known bugs

**Никогда не коммить постоянно падающий тест.** Красный тест в CI → реальные регрессии теряются, команда привыкает игнорировать failures.

Для известного бага:

```java
@Disabled("Known bug: reset() does not clear bucket. Fix tracked in issue #42")
@Test
void reset_shouldClearBucket_whenCalled() {
    // тест написан правильно, баг в реализации
}
```

**Disabled тест** должен иметь ссылку на issue и не жить так бесконечно. Лучший вариант — сначала исправить баг, потом написать зелёный тест.

## Уровни тестирования — зоны ответственности

| Уровень | Отвечает за | Характерный вопрос |
|---------|-------------|--------------------|
| Unit | Бизнес-правило принято правильно | «Корректно ли работает логика?» |
| @WebMvcTest | HTTP-представление правила | «Правильный ли статус? Правильный ли JSON?» |
| @DataJpaTest | Custom DB behavior | «Работает ли constraint/trigger/cascade?» |
| Integration | Компоненты работают вместе | «Проходит ли полный flow?» |

**Правило:** для критичного use case покрывай и бизнес-поведение (unit), и HTTP-маппинг (@WebMvcTest). Не обязательно зеркально дублировать каждый сценарий на обоих уровнях.

```text
// Пример: если controller просто вызывает service.review(...)
// — достаточно 1–2 @WebMvcTest теста на контракт
// — unit-тесты фокусируются на бизнес-логике review()

// Пример: validation в DTO/controller
// — больше @WebMvcTest (400 scenarios), unit-тестов меньше
```

**Польза @WebMvcTest рядом с unit:** проверяет что `GlobalExceptionHandler` правильно маппит исключения → HTTP-статусы (это нельзя проверить unit-тестом).

**Не дублируй каждый branch на всех уровнях** — некоторое повторение нормально, но один и тот же conflict scenario в unit + @WebMvcTest + integration + E2E — избыточно.

## Ссылки

- **Задачи по тестам:** `docs/roadmap/LL_Helper_Project_Roadmap.md` → Sprint 0.4
- **Бизнес-логика:** `docs/features/learning-flow.md`
- **TestData класс:** `src/test/java/com/llhelper/common/util/TestData.java`
- **CONVENTIONS.md:** секция Testing
