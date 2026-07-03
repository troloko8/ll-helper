# AI Generation Flow — Current Flow Design Note

> **Project:** LLHelper — AI Language Cards
> **Current level:** Level 0 — Stable Backend Foundation
> **Sprint:** Sprint 0.1 — Architecture Freeze
> **Status:** Documentation only — current AI generation flow snapshot

---

## 1. Purpose

Describe the current AI card generation flow: how card content (definition, synonyms, examples, translation) is generated via OpenAI when a user creates a card with `autoGenerate: true` or submits a bulk generation request.

This document does not define prompt versioning, AI provider abstraction, generation history, cost estimation, or AI-powered answer checking.

---

## 2. Scope

### Current MVP Scope

- Single card AI generation (`autoGenerate: true` in `POST /api/v1/cards`)
- Bulk card generation (`POST /api/v1/cards/bulk-generate`, up to 100 titles)
- Rate limiting: max 10 requests/second per JVM instance
- Token estimation guard: reject if estimated tokens > 4000
- JSON response parsing from OpenAI Chat Completions API
- Provider availability check (API key present)

### Out of Scope (Post-MVP)

- Prompt versioning and A/B testing
- Multiple AI providers / fallback strategy
- AI response schema validation beyond JSON parse
- Generation history / audit log
- Cost estimation and billing
- Retry with exponential backoff
- Streaming responses for bulk generation
- AI-powered answer checking in learning mode
- Card preview before save (AI output saved directly)
- Per-user rate limiting
- Regeneration by individual field (definition, synonyms, etc.)

---

## 3. Core Concepts

| Concept | Class | Description |
|---|---|---|
| Generation Service | `AiCardGenerationService` | Orchestrates rate limiting + provider call |
| Provider Interface | `AiProvider` | Contract: `generate()` + `isAvailable()` |
| OpenAI Provider | `OpenAiProvider` | HTTP call to OpenAI, JSON response parsing |
| AI Response DTO | `AiCardData` | Record: definition, synonyms, examples, translation |
| Configuration | `AiProperties` | Config via `@ConfigurationProperties(prefix = "ai")` |
| Rate Limiter | `AiRateLimiter` | Semaphore-based, per JVM, resets every 1 second |
| AI Exception | `AiServiceException` | RuntimeException for all AI errors |
| Rate Limit Exception | `RateLimitExceededException` | Thrown by `AiRateLimiter` on permit timeout or token limit |

---

## 4. API Endpoints

AI generation is **not a standalone endpoint** — it is embedded in the Card module's create/bulk-generate endpoints.

| Method | Path | AI Trigger | Description |
|--------|------|------------|-------------|
| `POST` | `/api/v1/cards` | `autoGenerate: true` | Create card, optionally with AI-generated fields |
| `POST` | `/api/v1/cards/bulk-generate` | Always | Generate multiple cards by title list, always uses AI |

---

## 5. AI Generation Flow

### 5.1 Single Card with AI

`POST /api/v1/cards` with `autoGenerate: true`

```text
CardController.create(CardRequest)
  └── CardServiceImpl.create()
        ├── Find Deck (deck) by deckId
        │     └── If not found → RuntimeException
        ├── Check autoGenerate flag
        │     ├── [true] → AiCardGenerationService.generateCardData()
        │     │     ├── Check AiProvider.isAvailable() → API key present?
        │     │     │     └── If not → AiServiceException
        │     │     ├── RateLimiter.acquirePermit() → semaphore, 5s timeout
        │     │     │     └── If timeout → RateLimitExceededException
        │     │     ├── RateLimiter.validateTokenCount(estimateTokens(title))
        │     │     │     └── If > 4000 → RateLimitExceededException
        │     │     └── OpenAiProvider.generate(title, sourceLanguage, targetLanguage)
        │     │           ├── Build prompt from PROMPT_TEMPLATE
        │     │           ├── POST https://api.openai.com/v1/chat/completions
        │     │           │     model: gpt-4o-mini
        │     │           │     response_format: json_object
        │     │           │     max_tokens: 4000
        │     │           └── parseResponse() → AiCardData record
        │     └── [false/null] → Use fields from request body
        ├── Create Card entity, set AI-generated or manual fields
        ├── Save Card to DB
        └── Return CardResponse
```

### 5.2 Bulk Generation

`POST /api/v1/cards/bulk-generate`

```text
CardController.createBulk(BulkCardGenerateRequest)
  └── CardServiceImpl.createBulk()
        ├── UserRateLimiter.checkLimitByEmail(CARD_BULK_GENERATE)
        │     └── If exceeded → RateLimitExceededException → 429
        ├── Find Deck (deck) by deckId
        │     └── If not found → EntityNotFoundException → 404
        ├── validateDeckOwnership() — only deck owner allowed
        │     └── If not owner → AccessDeniedException → 403
        └── For each title in titles[]:
              ├── AiCardGenerationService.generateCardData(title, srcLang, tgtLang)
              ├── Create Card entity with AI-generated fields
              ├── Save Card to DB
              ├── Add to results list
              └── [on exception] → silently skip, continue with next title
```

> **⚠️ Known issue:** Entire batch is in one `@Transactional`. Failed titles are silently swallowed — no logging, no partial result reporting. Client cannot tell which titles failed.

> **TODO in code:** `"probably i want that it was like partial transaction"`

---

## 6. OpenAI Request Details

### System Message

```text
You are a helpful language learning assistant.
```

### User Prompt Template (Current)

```text
take {title} and do in {sourceLanguage} language this

Rules:
- Replace the keyword in examples with "_ _ _ _" while preserving grammar.
- Do not add extra empty lines.
- Synonyms: 3 synonyms.
- Example sentence with the keyword replaced by "_ _ _ _".
- Translation have tio be direct translation word in {targetLanguage}.
- Return ONLY valid JSON in this exact format:
{
    "definition": "...",
    "synonyms": ["...", "...", "..."],
    "examples": ["...", "...", "..."],
    "translation": "..."
}
```

> **⚠️ Known issues with prompt:**
> - Typo: `"have tio be"` → should be `"have to be"`
> - Vague instruction: `"take {title} and do in {sourceLanguage} language this"` — unclear
> - `sourceLanguage` and `targetLanguage` may be swapped in usage context
> - No linguistic rules, no difficulty level, no part of speech
> - Old placeholder prompt commented out above current one

### Request Body (to OpenAI)

```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {"role": "system", "content": "You are a helpful language learning assistant."},
    {"role": "user", "content": "<prompt>"}
  ],
  "response_format": {"type": "json_object"},
  "max_tokens": 4000
}
```

### Response Parsing

```text
response JSON
  → choices[0].message.content (String)
  → ObjectMapper.readValue(content, AiCardData.class)
```

Parsed into `AiCardData` record:
- `definition` — String
- `synonyms` — List<String>
- `examples` — List<String>
- `translation` — String

---

## 7. Configuration

All settings via `@ConfigurationProperties(prefix = "ai")` in `AiProperties`:

| Property | Default | Description |
|----------|---------|-------------|
| `ai.provider` | `"openai"` | Provider name (only OpenAI implemented) |
| `ai.request-timeout-seconds` | `120` | HTTP client timeout |
| `ai.max-requests-per-second` | `10` | Semaphore permits per second |
| `ai.max-tokens-per-request` | `4000` | Token estimation guard |
| `ai.max-bulk-size` | `100` | Max titles in bulk request |
| `ai.openai.api-key` | `null` | OpenAI API key (from env) |
| `ai.openai.model` | `"gpt-4o-mini"` | Model name |
| `ai.openai.base-url` | `"https://api.openai.com/v1"` | API base URL |

> **Note:** `ai.max-bulk-size` is validated by `@Size(max=100)` on `BulkCardGenerateRequest.titles` via Jakarta Validation. Single source of truth — the DTO annotation.

---

## 8. Rate Limiting

### Implementation

`AiRateLimiter` — non-Spring-managed POJO, created as `@Bean` in `AiConfig`.

- **Mechanism:** `Semaphore(maxRequestsPerSecond)` — 10 permits default
- **Acquire timeout:** 5 seconds → `RateLimitExceededException` on timeout
- **Reset:** Every 1 second, releases permits back to max (10)
- **Token guard:** Rejects if `estimatedTokens > aiProperties.maxTokensPerRequest` (default: 4000)
- **Bulk guard:** `@Size(max=100)` on `BulkCardGenerateRequest.titles` via Jakarta Validation
- **Per-user bulk rate limit:** `CARD_BULK_GENERATE` — 3 requests / 1 minute per user

### Token Estimation

```text
estimatedTokens = (int)(text.length() / 4.0) + 500
```

Rough heuristic: ~4 characters per token + 500 overhead for prompt/response.

### Scope

- Per JVM instance — **not per user**
- Shared across all concurrent users
- No distributed rate limiting

---

## 9. Error Handling

| Situation | Exception | HTTP Status (if handled) |
|---|---|---|
| API key missing / blank | `AiServiceException("AI provider is not available")` | 500 (unhandled) |
| API key missing (in provider) | `AiServiceException("OpenAI API key is not configured")` | 500 (unhandled) |
| Rate limit hit (5s wait) | `RateLimitExceededException("Too many AI requests")` | 500 (unhandled) |
| Estimated tokens > 4000 | `RateLimitExceededException("Request too large")` | 500 (unhandled) |
| Bulk size > max | `RateLimitExceededException("Bulk size exceeds maximum")` | Not called in code |
| OpenAI HTTP error (4xx/5xx) | `AiServiceException("OpenAI API error: ...")` | 500 (unhandled) |
| JSON parse failure | `AiServiceException("Failed to parse AI response")` | 500 (unhandled) |
| Bulk: single title failure | Silently caught (`catch (Exception e)`) | Skipped, no error to client |

> **⚠️ All AI exceptions are currently unhandled by `GlobalExceptionHandler`.** They propagate as 500 Internal Server Error with stack trace. Proper handling is planned for Sprint 0.2.

---

## 10. Handled Edge Cases

- API key missing → `AiServiceException` (checked before every call)
- Rate limit exceeded → `RateLimitExceededException` (semaphore timeout)
- Token estimation too large → `RateLimitExceededException`
- OpenAI returns HTTP error → caught and wrapped
- OpenAI returns invalid JSON → caught and wrapped
- Bulk: individual title fails → silently skipped, other titles continue

## 11. Known Open Risks

- **Prompt quality:** Placeholder-level prompt with typos and vague instructions.
- **No preview:** AI output is saved directly to DB — bad AI output persists without user review.
- **Bulk total timeout:** `requestTimeoutSeconds=120` applies per OpenAI call. For 100 titles: up to 100×120s = ~3.3 hours per single client request. No global bulk timeout exists. Fix planned for Level 1 — see `IMPROVEMENTS.md`.
- **Bulk silent failures:** Client receives only successful cards; failed titles vanish without trace.
- **Bulk transaction:** All titles in one `@Transactional` — if DB save fails mid-batch, partial rollback behaviour depends on exception type.
- **No retry logic:** Failed OpenAI calls not retried.
- **Rate limiter scope:** Per JVM, not per user — one heavy user can exhaust permits for all.
- **Rate limiter reset bug:** `resetIfNeeded()` releases `10 - availablePermits()` — hardcoded to 10, ignores actual `maxRequestsPerSecond` config if changed.
- **Availability double-check:** `isAvailable()` is checked in both `AiCardGenerationService` and `OpenAiProvider` — redundant.
- **No ownership check:** Accepted Sprint 0.2 priority fix. Only deck owner may create/generate cards in a deck. See `current-architecture.md` §16 Sprint 0.2 Accepted Decisions.
- **`AiCardData` naming:** DTO not clearly marked as response (TODO in code).
- **`validateTokenCount()` fixed:** Token limit now read from `AiProperties.maxTokensPerRequest` (default: 4000). Configurable via `ai.max-tokens-per-request`.
- **`response_format: json_object`:** Relies on OpenAI honouring JSON mode — no fallback if non-JSON returned.

---

## 12. Module Structure

```text
ai/
├── config/
│   ├── AiConfig.java            — @Bean for AiRateLimiter
│   └── AiProperties.java        — @ConfigurationProperties(prefix = "ai")
├── dto/
│   └── AiCardData.java          — Response record (definition, synonyms, examples, translation)
├── exception/
│   └── AiServiceException.java  — RuntimeException for AI errors
├── provider/
│   ├── AiProvider.java           — Interface: generate() + isAvailable()
│   └── OpenAiProvider.java       — OpenAI HTTP client + JSON parser
├── service/
│   └── AiCardGenerationService.java — Orchestration: availability + rate limit + generate
└── util/
    └── AiRateLimiter.java        — Semaphore-based rate limiter + RateLimitExceededException
```

**Callers (outside `ai/` module):**
- `CardServiceImpl.create()` — when `autoGenerate: true`
- `CardServiceImpl.createBulk()` — always

---

## 13. Implementation Status

- [x] AI generates card content via OpenAI API
- [x] Single card generation works with `autoGenerate: true`
- [x] Bulk generation processes titles (up to 100 via DTO @Size)
- [x] Rate limiter exists (semaphore-based, per JVM)
- [x] API key absence is checked before each call
- [x] Postman collection includes AI endpoints
- [ ] AI errors are handled by GlobalExceptionHandler (Sprint 0.2)
- [ ] Bulk failures are reported to client (Sprint 0.2+ logging, full partial response later)
- [x] Ownership check exists for AI card generation
- [ ] RateLimiter reset bug fixed (Sprint 0.2)
- [x] Bulk size validated via `@Size(max=100)` on `BulkCardGenerateRequest.titles`
- [x] Per-user rate limit on bulk generation (`CARD_BULK_GENERATE`: 3 req/min)

---

## 14. References

| Document | Path |
|----------|------|
| Roadmap | `docs/roadmap/LL_Helper_Project_Roadmap.md` |
| Current architecture | `docs/architecture/current-architecture.md` |
| Database relationships | `docs/database/relationships.md` |
| Learning flow | `docs/features/learning-flow.md` |
| Postman collection | `LLHelper.postman_collection.json` |
