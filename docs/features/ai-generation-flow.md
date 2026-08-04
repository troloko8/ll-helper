# AI Generation Flow — Current Flow Design Note

> **Project:** LLHelper — AI Language Cards
> **Current level:** Level 0 — Stable Backend Foundation
> **Current sprint:** see `docs/roadmap/current-sprint.md`
> **Last updated:** 2026-07-30
> **Status:** Reflects current `CardServiceImpl` / `AiCardGenerationService` implementation

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
- Per-user AI provider rate limiting at the `AiRateLimiter` layer (per-user bulk endpoint limit already exists via `UserRateLimiter`)
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
| Bulk Endpoint Rate Limiter | `UserRateLimiter` | Per-user/email bucket for `POST /api/v1/cards/bulk-generate` |
| AI Exception | `AiServiceException` | RuntimeException for all AI errors |
| Rate Limit Exception | `RateLimitExceededException` | Thrown by `AiRateLimiter` (permit/token) and `UserRateLimiter` (per-user bulk) |

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
        ├── Get current user email from `SecurityUtils`
        ├── userRateLimiter.checkLimitByEmail(currentUserEmail, RateLimitAction.CARD_BULK_GENERATE)
        │     └── If exceeded → RateLimitExceededException → 429
        ├── validateBulkSize() — titles.size() > AiProperties.maxBulkSize (default 100)
        │     └── If exceeded → IllegalArgumentException → 400
        ├── Find Deck (deck) by deckId
        │     └── If not found → EntityNotFoundException → 404
        ├── validateDeckOwnership() — only deck owner allowed
        │     └── If not owner → AccessDeniedException → 403
        └── For each title in titles[]:
              ├── AiCardGenerationService.generateCardData(title, srcLang, tgtLang)
              ├── Create Card entity with AI-generated fields
              ├── Save Card to DB
              ├── Add to results list
              └── [on exception] → log.debug per failure, skip, continue with next title
```

> **⚠️ Known issue:** Entire batch is in one `@Transactional`. Failed titles are logged server-side (`log.debug` per title + `log.warn` summary) but not reported to the client — the response only contains successful cards.

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

> **Note:** Two checks exist: `@Size(max=100)` on `BulkCardGenerateRequest.titles` (hardcoded upper bound, Jakarta Validation → `400`) and `CardServiceImpl.validateBulkSize()` (reads the actual configured `ai.max-bulk-size` via `AiProperties`, throws `IllegalArgumentException` → `400`). If `ai.max-bulk-size` is configured below 100, only `validateBulkSize()` enforces it — the DTO annotation would not catch it.

---

## 8. Rate Limiting

Two independent mechanisms protect AI generation.

### `AiRateLimiter` — global per-JVM limit

`AiRateLimiter` is a non-Spring-managed POJO, created as `@Bean` in `AiConfig`.

- **Scope:** per JVM instance — **not per user**
- **Shared across:** all concurrent users on the same instance
- **Mechanism:** `Semaphore(maxRequestsPerSecond)` — 10 permits default
- **Acquire timeout:** 5 seconds → `RateLimitExceededException` on timeout
- **Reset:** every 1 second, releases permits back to `maxRequestsPerSecond`
- **Token guard:** rejects if `estimatedTokens > aiProperties.maxTokensPerRequest` (default: 4000)
- **Where applied:** inside `AiCardGenerationService.generateCardData()` before calling `OpenAiProvider`
- **No distributed rate limiting** across multiple JVMs

### `UserRateLimiter` — per-user limit on bulk endpoint

The bulk endpoint is additionally protected by `UserRateLimiter` from `common/security/`, before the bulk-size, deck-lookup, and ownership checks.

- **Action:** `RateLimitAction.CARD_BULK_GENERATE`
- **Limit:** 3 requests / 1 minute per user (keyed by email from JWT at Level 0)
- **Where applied:** first step of `CardServiceImpl.createBulk()`
- **Scope:** per user; independent of `AiRateLimiter`

### Token Estimation

```text
estimatedTokens = (int)(text.length() / 4.0) + 500
```

Rough heuristic: ~4 characters per token + 500 overhead for prompt/response.

---

## 9. Error Handling

| Situation | Exception | HTTP Status (handled by `GlobalExceptionHandler`) |
|---|---|---|
| API key missing / blank | `AiServiceException("AI provider is not available")` | 503 |
| API key missing (in provider) | `AiServiceException("OpenAI API key is not configured")` | 503 |
| Rate limit hit (5s wait) | `RateLimitExceededException("Too many AI requests")` | 429 |
| Estimated tokens > 4000 | `RateLimitExceededException("Request too large")` | 429 |
| Bulk size > max | `IllegalArgumentException("Bulk size exceeds limit: ...")` | 400 |
| OpenAI HTTP error (4xx/5xx) | `AiServiceException("OpenAI API error: ...")` | 503 |
| JSON parse failure | `AiServiceException("Failed to parse AI response")` | 503 |
| Bulk: single title failure | Caught, logged (`log.debug`/`log.warn`) | Skipped, no error to client |

> **Note:** `GlobalExceptionHandler` maps `AiServiceException` → `503 Service Unavailable` and `RateLimitExceededException` → `429 Too Many Requests`. Already fixed — the remaining gap is reporting bulk per-title failures back to the client (see Section 11).

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
- **Bulk silent failures (client-facing):** Failed titles are logged server-side (`log.debug`/`log.warn`) but the client only receives successful cards — no way to tell which titles failed or why.
- **Bulk transaction:** All titles in one `@Transactional` — if DB save fails mid-batch, partial rollback behaviour depends on exception type.
- **No retry logic:** Failed OpenAI calls not retried.
- **Rate limiter scope (`AiRateLimiter`):** Per JVM, not per user — one heavy user can exhaust permits for all. `UserRateLimiter` already protects the bulk endpoint per user.
- ~~**Rate limiter reset bug:** `resetIfNeeded()` releases `10 - availablePermits()` — hardcoded to 10, ignores actual `maxRequestsPerSecond` config if changed.~~ ✅ Fixed — `resetIfNeeded()` now uses the injected `maxRequestsPerSecond` field.
- **Availability double-check:** `isAvailable()` is checked in both `AiCardGenerationService` and `OpenAiProvider` — redundant.
- ~~**No ownership check**~~ ✅ Fixed — `validateDeckOwnership()` enforced in both `create()` and `createBulk()`. See `current-architecture.md` §16.
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
- [x] Bulk generation processes titles (up to `AiProperties.maxBulkSize`, default 100, enforced by `@Size(max=100)` + `validateBulkSize()`)
- [x] Rate limiter exists (semaphore-based, per JVM)
- [x] API key absence is checked before each call
- [x] Postman collection includes AI endpoints
- [x] AI errors are handled by GlobalExceptionHandler (`AiServiceException` → 503, `RateLimitExceededException` → 429)
- [ ] Bulk failures are reported to client (server-side logging exists; full partial response to client deferred)
- [x] Ownership check exists for AI card generation
- [x] RateLimiter reset bug fixed
- [x] Bulk size validated via `@Size(max=100)` on `BulkCardGenerateRequest.titles` and `CardServiceImpl.validateBulkSize()`
- [x] Per-user rate limit on bulk generation (`UserRateLimiter` / `CARD_BULK_GENERATE`: 3 req/min)

---

## 14. References

| Document | Path |
|----------|------|
| Current sprint | `docs/roadmap/current-sprint.md` |
| Roadmap | `docs/roadmap/roadmap.md` |
| Current architecture | `docs/architecture/current-architecture.md` |
| Database relationships | `docs/database/relationships.md` |
| Learning flow | `docs/features/learning-flow.md` |
| Postman collection | `LLHelper.postman_collection.json` |
