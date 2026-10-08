# Current Sprint

> Level 1.5 — First System Delivery. Full roadmap: `docs/roadmap/roadmap.md`.
> Completed Sprint 1.0 evidence: `docs/roadmap/changelog.md`. Deferred work:
> `docs/roadmap/backlog.md`.

## Sprint 1.1 — First Deployment

**Goal:** reproducibly build, run, and deploy LLHelper behind one public HTTPS
origin, without exposing Spring Boot or PostgreSQL directly to the internet.

**Starting point (2026-10-08):** Sprint 1.0 is complete. The frontend already
uses relative `VITE_API_URL=/api/v1`; a domain-independent Nginx draft and a
local/CI `nginx -t` check exist. No production Dockerfiles, Compose runtime,
domain, TLS configuration, hosting platform, or public deployment has been
verified yet.

**Completed product follow-up (2026-10-08):** owner enrollment for a private
deck is implemented without expanding the deployment Done Criteria. Owners can
enroll and study their own private decks; non-owners still receive `403` and
private decks remain excluded from Discover and other users' Created lists.
Backend, owner UI, automated tests, API inventory and Postman cases are synced.
The full local Newman regression passed on 2026-10-08: 45 requests and 42
assertions, including owner-private `201` with required `userDeckId`, non-owner
`403`, persisted progress reread and cleanup, with 0 failures.

**Accepted topology:** Browser → HTTPS reverse proxy → SPA and `/api/v1/**` →
internal Spring Boot `:8080`. This same-origin topology does not need Spring
CORS. A switch to a separate API origin requires an explicit allowlist and
browser preflight verification before release.

### Gate before deployment work

- [x] Sprint 1.0 closed: UI/Postman flow passed and final checks are recorded in `docs/roadmap/changelog.md`.
- [ ] Choose hosting/platform, public domain, TLS termination, and runtime placement for reverse proxy, frontend, backend, and PostgreSQL.
- [ ] Confirm that the chosen platform supports the accepted same-origin topology; if it does not, document and implement a separate-origin CORS contract before release.

### Build, runtime, and network

- [ ] Add reproducible production Dockerfiles for backend and frontend without secrets in image layers.
- [ ] Add Docker Compose for reverse proxy, backend, and PostgreSQL with health checks, persistent DB storage, and explicit internal networks.
- [ ] Publish only the HTTPS reverse-proxy/platform ports; keep Spring Boot `:8080` and PostgreSQL private.
- [ ] Configure production profile, environment variables, secrets handling, Liquibase startup, and a non-sensitive health/readiness endpoint.

### Reverse proxy and HTTP contract

- [ ] Adapt `deploy/nginx/nginx.conf` to the selected hosting and final upstream; run `nginx -t` in the release image before reload/restart.
- [ ] Configure HTTPS, HTTP-to-HTTPS redirect, certificate renewal, trusted forwarded headers, explicit body limits, and bounded proxy timeouts.
- [ ] Verify the frontend cache contract on the real origin: immutable hashed assets, revalidated HTML/SPA fallback, non-cacheable authenticated API, actual `404` for missing chunks, and availability of previous hashed assets during rollout.

### Delivery, safety, and release verification

- [ ] Add GitHub Actions checks for frontend build/lint/format/tests and release-relevant backend checks; require green checks before deployment.
- [ ] Configure structured logs without JWTs, passwords, API keys, or full sensitive payloads; verify no sensitive values in application, proxy, or CI logs.
- [ ] Configure database backup outside runtime storage, perform a restore drill, and verify rollback/redeploy of the previous version.
- [ ] From a clean environment, build and run the system with the documented command; health checks become healthy.
- [ ] Verify public HTTPS, closed backend/PostgreSQL ports, `/api/**` proxy, cache headers, direct-route fallback, and timeout/body-limit behavior.
- [ ] Repeat the completed Sprint 1.0 UI flow through the production origin, including logout/login, refresh, and persisted learning progress.

## ✅ Done Criteria (Level 1.5)

- [ ] Application is accessible on the internet through HTTPS.
- [ ] The system starts through Docker Compose.
- [ ] GitHub Actions build and test checks are green.
- [ ] Environment variables and secrets are external to code, image layers, and frontend bundles.
- [ ] A non-sensitive health endpoint is used by the deployment platform.
- [ ] Backup, restore, and rollback are verified.
- [ ] Deployment runbook lets another developer build, run, and deploy the system.

Detailed future and non-blocking work remains in `docs/roadmap/backlog.md`.
