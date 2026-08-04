# Controller Tests (@WebMvcTest) — Deep Reference

Read only when the hard gates in `backend/.windsurf/rules/testing-conventions.md` don't already cover the scenario.

## Basic shape

```java
@WebMvcTest(CardController.class)
class CardControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean CardService cardService; // Spring Boot 4.x — replaces @MockBean

    @Test
    void create_shouldReturn201_whenValid() throws Exception {
        when(cardService.create(any(), any())).thenReturn(new CardResponse(1L, "word", ...));

        mockMvc.perform(post("/api/v1/decks/{deckId}/cards", 1L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1L));
    }
}
```

## Asserting error shape (GlobalExceptionHandler contract)

Don't just assert the status code — assert the JSON error body shape is what `GlobalExceptionHandler` actually produces, since that's the real API contract:

```java
mockMvc.perform(post("/api/v1/cards").content(invalidJson))
    .andExpect(status().isBadRequest())
    .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
    .andExpect(jsonPath("$.message").exists());
```

## Testing 403 (ownership) vs 401 (unauthenticated)

These are different failure modes and must not be conflated:
- **401** — no/invalid JWT — usually covered by Spring Security filter chain, not the controller test directly, unless the test omits auth setup entirely
- **403** — authenticated but not the owner — mock the service to throw `AccessDeniedException`, assert `status().isForbidden()`

## JSON contract details worth asserting explicitly

- Enum values serialize as their string name, not ordinal (`"status": "MASTERED"`, not `"status": 3`)
- `Instant` fields serialize as ISO-8601 (`"2024-01-01T10:00:00Z"`), not as an epoch number — this is a real regression risk if Jackson config changes
- Field names match the DTO record component names exactly (no accidental `@JsonProperty` drift)

## Validation error tests

For every `@NotBlank`/`@NotNull`/`@Size` on a request DTO, one test per constraint is enough — don't test the same annotation twice on different fields unless the message differs.
