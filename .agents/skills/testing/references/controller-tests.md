# Controller Tests

Use this reference for `@WebMvcTest` coverage of HTTP contracts.

```java
@WebMvcTest(CardController.class)
class CardControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean CardService cardService;

    @Test
    void create_shouldReturn201_whenValid() throws Exception {
        when(cardService.create(any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/decks/{deckId}/cards", 1L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1L));
    }
}
```

Assert the error body's public contract, not only the status:

```java
.andExpect(status().isBadRequest())
.andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
.andExpect(jsonPath("$.message").exists());
```

Distinguish unauthenticated 401 from authenticated-but-forbidden 403:

- 401 covers missing, expired, or invalid authentication and normally belongs to the real security-filter setup;
- 403 covers an authenticated caller without ownership or permission; mock the service to throw `AccessDeniedException` and assert `status().isForbidden()` through the application's real exception mapping.

Explicitly protect JSON details that can regress:

- enum names, never ordinals;
- ISO-8601 `Instant` values, never epoch numbers;
- DTO field names;
- documented status and error shape.

For request validation, one focused test per distinct constraint is normally enough. Do not duplicate equivalent annotation tests unless messages or behavior differ.
