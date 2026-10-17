# AI Generation Flow — Current Flow Design Note

> **Project:** LLHelper — AI Language Cards
> **Current level:** see `docs/roadmap/current-sprint.md`
> **Current sprint:** see `docs/roadmap/current-sprint.md`
> **Last updated:** 2026-09-21
> **Status:** Reflects current backend generation flow and single-card frontend entry

---

## 1. Purpose

Describe the current AI card generation flow: how card content (definition, synonyms, examples, translation) is generated via OpenAI through dedicated single-card or bulk generation endpoints.

This document does not define prompt versioning, AI provider abstraction, generation history, cost estimation, or AI-powered answer checking.

---

## 2. Scope

### Current MVP Scope

- Single card AI generation (`POST /api/v1/card-generations`)
- Bulk card generation (`POST /api/v1/card-generations/bulk`, up to 100 titles)
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
| Bulk Endpoint Rate Limiter | `UserRateLimiter` | Per-user/email bucket for `POST /api/v1/card-generations/bulk` |
| AI Exception | `AiServiceException` | RuntimeException for all AI errors |
| Rate Limit Exception | `RateLimitExceededException` | Thrown by `AiRateLimiter` (permit/token) and `UserRateLimiter` (per-user bulk) |

---

## 4. API Endpoints

`CardGenerationController` owns single and bulk generation. `CardController` owns manual creation and CRUD. Request DTOs contain data only; manual create/PUT require translation and allow optional definition.

| Method | Path | AI Trigger | Description |
|--------|------|------------|-------------|
| `POST` | `/api/v1/card-generations` | Always | Generate and save one card from `GenerateCardRequest {title, deckId}` |
| `POST` | `/api/v1/card-generations/bulk` | Always | Generate multiple cards by title list, always uses AI |

---

## 5. AI Generation Flow

### 5.1 Single Card with AI

`POST /api/v1/card-generations`

```text
CardGenerationController.generate(GenerateCardRequest)
  └── CardServiceImpl.generate()
        ├── Apply per-user CARD_CREATE limit (shared with manual creation)
        ├── Find deck → 404 if missing
        ├── Validate ownership → 403 before calling AI
        ├── AiCardGenerationService.generateCardData()
        │     ├── Check provider availability
        │     ├── Acquire AI permit and validate estimated token count
        │     └── OpenAiProvider.generate() → parse response into AiCardData
        ├── Validate generated translation → 503 if missing or blank
        ├── CardMapper.fromAiData()
        ├── Shared saveCard(): normalize, saveAndFlush, refresh
        └── Return CardResponse (201)
```

#### Frontend single-card entry

The authenticated Add Card screen at `/decks/:deckId/cards/new` exposes AI
generation as an optional action next to the source-language word-or-phrase
field. The frontend names both languages from the loaded deck and states that
AI generates a `targetLanguage` translation. It:

1. validates and trims the required source-language word or phrase;
2. sends `POST /api/v1/card-generations` with only `title` and `deckId`;
3. disables all form controls and shows the AI generation loading state while
   the request is pending;
4. on `201`, invalidates the deck-detail cache and returns to Owner Deck
   Details because the backend has already saved the generated card;
5. on `429` or `503`, preserves the word or phrase, shows the AI-specific inline
   error state, and allows retry.

The frontend does not build prompts, call an AI provider directly, or preview
or compare generated fields. Bulk generation is a separate owner-only surface
at `/decks/:deckId/cards/bulk`, linked from the Add Card mode switch.

### 5.2 Bulk Generation

`POST /api/v1/card-generations/bulk`

While this synchronous request is pending, the frontend shows one indeterminate
batch state with the submitted count and a collapsed list of submitted entries.
It does not simulate per-card progress, percentages, or ETA. The request and its
latest result are tracked in a Redux workflow snapshot keyed by `deckId`, so
internal route navigation does not cancel generation or discard the result.
The user can visit card View/Edit or other application routes and return to the
bulk route. A browser reload or tab close still clears this runtime-only state;
recovery after that boundary requires a future backend job/history contract.

When the response arrives, the result heading distinguishes all-created, mixed,
and all-failed outcomes and receives focus for assistive technology. Created and
failed entries remain separate, filters appear only for mixed outcomes, and the
UI states that created cards are already persisted in the deck.

The frontend retains one latest batch per deck. `Generate more` resets that
deck to a blank input, and a new submission replaces its previous snapshot.
Logout/session invalidation clears every retained batch; a confirmed missing or
non-owned deck clears only that deck. Ordinary route navigation does not clear
anything, and the snapshot is not persisted to `sessionStorage`.

```text
CardGenerationController.generateBulk(BulkCardGenerateRequest)
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
              ├── Add saved card to `created[]`
              ├── [on AI/rate-limit exception] → add `{inputIndex, title, code, message, retryable}` to `failed[]`, log, continue
              └── [on persistence/unexpected exception] → propagate and roll back the request
```

The endpoint returns `201` with `BulkCardGenerationResponse { created, failed }`
when every title either succeeds or fails with a recoverable `AiServiceException`
or `RateLimitExceededException`. Each failure exposes its zero-based index in
the submitted `titles[]`, stable code, safe message, and retryability; raw
provider exception text is not returned. Persistence and unexpected exceptions
are not converted into `failed[]`:
they propagate, abort the request, and roll back all writes in the transaction.
Request-level validation, deck lookup, ownership, and endpoint rate-limit failures
also return their normal `400`/`404`/`403`/`429` responses instead of a partial body.

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
- `translation` — String; required by the card-generation boundary even though the provider DTO itself is nullable

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

> **Note:** `BulkCardGenerateRequest.titles` accepts 1–100 entries and applies `@Size(max=100)` to every title (Jakarta Validation → `400`). `CardServiceImpl.validateBulkSize()` separately reads the configured `ai.max-bulk-size` via `AiProperties` and throws `IllegalArgumentException` → `400`. If that property is below 100, only the service check enforces the lower list-size limit.

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

Single-card generation retains the `CARD_CREATE` per-user bucket shared with manual creation, plus the provider limiter below. Endpoint separation does not reset or bypass that quota.

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
| Bulk: per-title AI/rate-limit failure | Caught and logged (`log.debug`/`log.warn`) | Included in `failed[]`; remaining titles continue |
| Bulk: persistence/unexpected failure | Propagated from `CardServiceImpl.createBulk` | Request fails; the transaction rolls back |

> **Note:** `GlobalExceptionHandler` maps request-level `AiServiceException` → `503 Service Unavailable` and `RateLimitExceededException` → `429 Too Many Requests`. Those two exception types raised while processing an individual bulk title are represented inside the successful bulk response instead. Persistence and unexpected exceptions remain request-level failures.

---

## 10. Handled Edge Cases

- API key missing → `AiServiceException` (checked before every call)
- Rate limit exceeded → `RateLimitExceededException` (semaphore timeout)
- Token estimation too large → `RateLimitExceededException`
- OpenAI returns HTTP error → caught and wrapped
- OpenAI returns invalid JSON → caught and wrapped
- Bulk: individual AI/rate-limit generation fails → returned with stable failure metadata; other titles continue
- Bulk: persistence/unexpected failure → propagated; the transaction rolls back

## 11. Known Open Risks

- **Prompt quality:** Placeholder-level prompt with typos and vague instructions.
- **No preview:** AI output is saved directly to DB — bad AI output persists without user review.
- **Bulk total timeout:** `requestTimeoutSeconds=120` applies per OpenAI call. For 100 titles: up to 100×120s = ~3.3 hours per single client request. No global bulk timeout exists. Fix planned for Level 1 — see `IMPROVEMENTS.md`.
- **Bulk transaction:** All titles share one `@Transactional`. Recoverable AI/rate-limit failures can produce a partial `201` result; any persistence or unexpected failure aborts and rolls back the whole request.
- **No retry logic:** Failed OpenAI calls are not retried yet. CARD-02 already
  marks recoverable entries `retryable=true`; retry-one/retry-all UI is deferred
  and tracked in `docs/roadmap/current-sprint.md`.
- **No cancellation:** CARD-02 is a synchronous batch without a cancellation
  contract. The frontend intentionally omits Cancel because aborting its HTTP
  wait would not stop server-side generation. Backend-supported cancellation is
  deferred and tracked in `docs/roadmap/current-sprint.md`.
- **Rate limiter scope (`AiRateLimiter`):** Per JVM, not per user — one heavy user can exhaust permits for all. `UserRateLimiter` already protects the bulk endpoint per user.
- ~~**Rate limiter reset bug:** `resetIfNeeded()` releases `10 - availablePermits()` — hardcoded to 10, ignores actual `maxRequestsPerSecond` config if changed.~~ ✅ Fixed — `resetIfNeeded()` now uses the injected `maxRequestsPerSecond` field.
- **Availability double-check:** `isAvailable()` is checked in both `AiCardGenerationService` and `OpenAiProvider` — redundant.
- ~~**No ownership check**~~ ✅ Fixed — `validateDeckOwnership()` enforced in `generate()` and `createBulk()`. See `current-architecture.md` §16.
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
- `CardServiceImpl.generate()` — single-card generation
- `CardServiceImpl.createBulk()` — always

---

## 13. Implementation Status

- [x] AI generates card content via OpenAI API
- [x] Single card generation uses a dedicated endpoint and request
- [x] Bulk generation processes titles (up to `AiProperties.maxBulkSize`, default 100, enforced by `@Size(max=100)` + `validateBulkSize()`)
- [x] Rate limiter exists (semaphore-based, per JVM)
- [x] API key absence is checked before each call
- [x] Postman collection includes AI endpoints
- [x] AI errors are handled by GlobalExceptionHandler (`AiServiceException` → 503, `RateLimitExceededException` → 429)
- [x] Bulk failures are reported to client as `failed[]` entries alongside `created[]`
- [x] Ownership check exists for AI card generation
- [x] RateLimiter reset bug fixed
- [x] Bulk size validated via `@Size(max=100)` on the titles list and `CardServiceImpl.validateBulkSize()`; every title is also limited to 100 characters
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
