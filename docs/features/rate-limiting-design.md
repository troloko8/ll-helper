# Rate Limiting Design Note

> **Project:** LLHelper — AI Language Cards
> **Current level:** Level 0 — Stable Backend Foundation
> **Sprint:** Sprint 0.2 — Backend Cleanup
> **Status:** Design — implementation plan for rate limiting
> **Created:** 2026-06-25

---

## 1. Purpose

Implement rate limiting to protect sensitive endpoints from abuse:
- User profile update operations
- Authentication endpoints (login/register)
- Card/Deck CRUD operations

This document defines the implementation plan for **Level 0** (per-user, in-memory) and future evolution to **Level 2+** (distributed, IP-based, global limits).

---

## 2. Problem Statement

### Current Issues

1. **No rate limiting on user update operations** — any authenticated user can spam `PUT /api/v1/users/{id}` requests
2. **No rate limiting on auth endpoints** — brute force attacks possible on login/register
3. **AI generation has per-JVM limit only** — one user can exhaust permits for all users
4. **CardDesc operations missing ownership check** — any user can delete/update any deck (CRITICAL)

### Security Risks

- **Brute force attacks** on login endpoint
- **Spam registration** via register endpoint
- **Resource exhaustion** via card/deck creation spam
- **AI API abuse** via bulk generation spam

---

## 3. Scope

### Sprint 0.2 (Level 0) — In Scope

✅ **Per-user rate limiting** (in-memory, Caffeine Cache)
✅ **Protected endpoints:**
- `PUT /api/v1/users/{id}` — 5 req/min per user
- `POST /api/v1/auth/login` — 5 req/min per email
- `POST /api/v1/auth/register` — 3 req/5min per email
- `POST /api/v1/cards` — 20 req/min per user
- `PUT /api/v1/cards/{id}` — 10 req/min per user
- `DELETE /api/v1/cards/{id}` — 10 req/min per user
- `POST /api/v1/card-descs` — 5 req/hour per user
- `PUT /api/v1/card-descs/{id}` — 10 req/min per user
- `DELETE /api/v1/card-descs/{id}` — 5 req/hour per user

✅ **HTTP 429 Too Many Requests** response
✅ **Fix existing `RateLimiter` reset bug** (hardcoded 10)
✅ **Fix CardDesc ownership check** (SECURITY CRITICAL)

### Level 0 — Out of Scope (Deferred)

⏸️ **Per-user AI generation limit** — requires userId in `AiCardGenerationService` (deferred to Level 2)
⏸️ **IP-based rate limiting** — requires IP extraction, proxy handling
⏸️ **Distributed rate limiting** — requires Redis
⏸️ **Global rate limits** — 100 req/min per user across all endpoints
⏸️ **Rate limit headers** — `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## 4. Architecture

### Level 0 Implementation

**Component:** `UserRateLimiter` (`common/security/`)

**Strategy:** Token bucket per user/email, in-memory (Caffeine Cache)

**Structure:**
```
UserRateLimiter
├── userBuckets: Cache<Long, Bucket>      // userId → bucket
├── emailBuckets: Cache<String, Bucket>   // email → bucket (pre-auth)
├── checkLimitByUserId(userId, max, window)
└── checkLimitByEmail(email, max, window)

Bucket (inner class)
├── maxRequests: int
├── window: Duration
├── count: AtomicInteger
├── windowStart: Instant
└── tryConsume(): boolean
```

**Cache TTL:** 1 hour (auto-cleanup via Caffeine)

**Algorithm:** Sliding window with atomic counter

---

### Level 2+ Evolution

**Distributed Rate Limiting (Redis):**
```
Redis key pattern:
  rate_limit:user:{userId}:{endpoint}
  rate_limit:email:{email}:{endpoint}

Commands:
  INCR key
  EXPIRE key {window_seconds}
  
Lua script for atomic check-and-increment
```

**IP-based Rate Limiting:**
```
Extract IP from:
  - X-Forwarded-For header (proxy)
  - X-Real-IP header
  - HttpServletRequest.getRemoteAddr()

Rate limit by IP for anonymous endpoints
```

**Global Rate Limits:**
```
Middleware/Filter:
  - 100 requests/minute per user (all endpoints)
  - 20 requests/minute per IP (anonymous)
```

---

## 5. Implementation Plan

### Sprint 0.2 Tasks

#### **Task 7.2: Fix CardDesc Ownership Check (CRITICAL)**

**Priority:** 🔴 SECURITY CRITICAL

**Problem:** Any user can update/delete any deck

**Files:** `card_desc/service/CardDescServiceImpl.java`

**Changes:**
1. Add `validateDeckOwnership(CardDesc deck)` method
2. Call in `update(Long id, ...)` after `findById()`
3. Call in `delete(Long id)` after `findById()`

**Tests (Postman):**
- User A creates deck
- User B tries `PUT /api/v1/card-descs/{id}` → 403 Forbidden
- User B tries `DELETE /api/v1/card-descs/{id}` → 403 Forbidden

---

#### **Task 8.1: Fix RateLimiter Reset Bug**

**Priority:** 🟡 Medium

**Problem:** Hardcoded `10` in `resetIfNeeded()` instead of `maxRequestsPerSecond`

**File:** `ai/util/RateLimiter.java`

**Changes:**
- Add field: `private final int maxRequestsPerSecond;`
- Update constructor to save `maxRequestsPerSecond`
- Fix `resetIfNeeded()`: use `maxRequestsPerSecond` instead of `10`

**Tests:** Unit test with `RateLimiter(5)` — verify reset to 5, not 10

---

#### **Task 8.2: Move RateLimitExceededException to common**

**Priority:** 🟡 Medium

**Create:** `common/exception/RateLimitExceededException.java`

**Delete:** Nested class from `ai/util/RateLimiter.java`

**Update imports in:**
- `ai/util/RateLimiter.java`
- `ai/service/AiCardGenerationService.java`
- `common/exception/GlobalExceptionHandler.java`

---

#### **Task 8.3: Add Caffeine Dependency**

**Priority:** 🟡 Medium

**File:** `backend/pom.xml`

**Add:**
```xml
<dependency>
    <groupId>com.github.ben-manes.caffeine</groupId>
    <artifactId>caffeine</artifactId>
    <version>3.1.8</version>
</dependency>
```

---

#### **Task 8.4: Create UserRateLimiter**

**Priority:** 🔴 High

**Dependencies:** 8.2 (exception), 8.3 (Caffeine)

**Create:** `common/security/UserRateLimiter.java`

**Features:**
- Two Caffeine caches: `userBuckets` (Long), `emailBuckets` (String)
- TTL: 1 hour
- Methods: `checkLimitByUserId()`, `checkLimitByEmail()`
- Inner class `Bucket` with sliding window logic
- TODO comment: migrate to userId when JWT changes from email to userId

**Tests:**
- Unit test: 5 requests → OK, 6th → exception
- Unit test: after window expiry → limit resets

---

#### **Task 8.5-8.13: Apply Rate Limiting to Endpoints**

| Task | Endpoint | Limit | Window | Key | Priority |
|------|----------|-------|--------|-----|----------|
| 8.5 | `PUT /api/v1/users/{id}` | 5 | 1 min | userId | 🔴 High |
| 8.6 | `POST /api/v1/auth/login` | 5 | 1 min | email | 🔴 High |
| 8.7 | `POST /api/v1/auth/register` | 3 | 5 min | email | 🔴 High |
| 8.8 | `POST /api/v1/cards` | 20 | 1 min | userId | 🟡 Medium |
| 8.9 | `PUT /api/v1/cards/{id}` | 10 | 1 min | userId | 🟢 Low |
| 8.10 | `DELETE /api/v1/cards/{id}` | 10 | 1 min | userId | 🟢 Low |
| 8.11 | `POST /api/v1/card-descs` | 5 | 1 hour | userId | 🟡 Medium |
| 8.12 | `PUT /api/v1/card-descs/{id}` | 10 | 1 min | userId | 🟢 Low |
| 8.13 | `DELETE /api/v1/card-descs/{id}` | 5 | 1 hour | userId | 🟢 Low |

**Pattern:**
```java
@Transactional
public Response mutatingOperation(...) {
    Long currentUserId = securityUtils.getCurrentUserId();
    
    // Rate limit BEFORE business logic
    userRateLimiter.checkLimitByUserId(currentUserId, maxRequests, window);
    
    // Ownership check
    // Business logic
}
```

---

#### **Task 8.14: Add @ExceptionHandler for HTTP 429**

**Priority:** 🔴 High

**File:** `common/exception/GlobalExceptionHandler.java`

**Add:**
```java
@ExceptionHandler(RateLimitExceededException.class)
public ResponseEntity<ErrorResponse> handleRateLimitExceeded(RateLimitExceededException ex) {
    ErrorResponse error = new ErrorResponse(
        "RATE_LIMIT_EXCEEDED",
        ex.getMessage(),
        LocalDateTime.now()
    );
    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(error);
}
```

**Response:**
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Try again later.",
  "timestamp": "2026-06-25T15:30:00"
}
```

---

#### **Task 8.15: Update Postman Collection**

**Priority:** 🟡 Medium

**File:** `LLHelper.postman_collection.json`

**Add tests:**
1. User update — 6 requests → 6th returns 429
2. Auth login — 6 requests → 6th returns 429
3. Auth register — 4 requests → 4th returns 429
4. Card create — 21 requests → 21st returns 429
5. Deck create — 6 requests (in 1 hour) → 6th returns 429

**Assertions:**
- Status code = 429
- Body contains `"error": "RATE_LIMIT_EXCEEDED"`

---

#### **Task 8.16: Update Documentation**

**Priority:** 🟡 Medium

**Files:**
1. `docs/architecture/current-architecture.md` — add "Rate Limiting" section
2. `docs/roadmap/LL_Helper_Project_Roadmap.md` — mark tasks 7.2, 8, 11 as done
3. `backend/CONVENTIONS.md` — add rate limiting rules

---

## 6. Deferred Tasks (Level 2+)

### Level 2 — Advanced Rate Limiting

#### **IP-based Rate Limiting**
- Extract IP from `HttpServletRequest` and proxy headers
- Rate limit by IP for anonymous endpoints
- Combine email + IP for auth endpoints

#### **Distributed Rate Limiting (Redis)**
- Replace Caffeine Cache with Redis
- Use `INCR` + `EXPIRE` for distributed counters
- Lua scripts for atomic operations
- Support multi-instance deployment

#### **Global Rate Limits**
- 100 requests/minute per user (all endpoints)
- 20 requests/minute per IP (anonymous)
- Middleware/Filter for global check

#### **Per-user AI Generation Limit**
- Pass `userId` to `AiCardGenerationService.generateCardData()`
- Add `userRateLimiter.checkLimitByUserId(userId, 10, Duration.ofHours(1))`
- Place after `rateLimiter.acquirePermit()`, before `provider.generate()`
- **Prerequisite:** Change method signature or get userId from SecurityContext

---

### Level 3 — Production Rate Limiting

#### **Rate Limit Headers**
- Add HTTP headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Follow [IETF draft standard](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers)

#### **Adaptive Rate Limiting**
- Dynamic limits based on system load
- Circuit breaker for AI provider
- Backpressure for bulk operations

#### **Monitoring & Metrics**
- Prometheus metrics: `rate_limit_exceeded_total`, `rate_limit_remaining`
- Grafana dashboard for abuse detection
- Alerting on excessive rate limit hits

---

## 7. Testing Strategy

### Unit Tests

- `UserRateLimiter` — bucket logic, window expiry, concurrent access
- `RateLimiter` — reset bug fix verification

### Integration Tests (Postman)

- Each protected endpoint — verify 429 on limit exceeded
- Verify error response format
- Verify limit resets after window expiry

### Manual Testing

- Concurrent requests from same user
- Requests from different users (verify isolation)
- Window boundary conditions

---

## 8. Known Limitations (Level 0)

1. **Per-JVM instance** — not distributed, won't work across multiple app instances
2. **Email-based for auth** — TODO: migrate to userId when JWT subject changes
3. **No rate limit headers** — client doesn't know remaining quota
4. **Memory leak risk** — Caffeine TTL mitigates, but not perfect
5. **AI generation per-user limit deferred** — requires refactoring `AiCardGenerationService`

---

## 9. Migration Path (Level 0 → Level 2)

### Step 1: Add Redis dependency
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

### Step 2: Create RedisRateLimiter
```java
@Component
public class RedisRateLimiter {
    private final RedisTemplate<String, String> redisTemplate;
    
    public void checkLimit(String key, int max, Duration window) {
        String redisKey = "rate_limit:" + key;
        Long count = redisTemplate.opsForValue().increment(redisKey);
        
        if (count == 1) {
            redisTemplate.expire(redisKey, window);
        }
        
        if (count > max) {
            throw new RateLimitExceededException("...");
        }
    }
}
```

### Step 3: Replace UserRateLimiter with RedisRateLimiter
- Update all service injections
- Update tests to use Redis testcontainer

---

## 10. References

| Document | Path |
|----------|------|
| Roadmap | `docs/roadmap/LL_Helper_Project_Roadmap.md` |
| Current architecture | `docs/architecture/current-architecture.md` |
| Conventions | `backend/CONVENTIONS.md` |
| AI generation flow | `docs/features/ai-generation-flow.md` |
| Postman collection | `LLHelper.postman_collection.json` |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-25 | Initial design note — Sprint 0.2 rate limiting plan |
| 2026-06-28 | Task 8.3 completed — Caffeine 3.1.8 dependency added to pom.xml |
