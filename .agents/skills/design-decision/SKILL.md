---
name: design-decision
description: Use before creating or updating an LLHelper design, planning, audit, or decision document to find the normative owner and avoid parallel documentation.
---

# Design Decision

The goal is a durable decision in the correct owner, not a new file by default.

## 1. Classify the decision

Identify the primary fact being decided: architecture, API contract, database model, learning flow, AI flow, frontend design system, frontend integration, testing strategy, current sprint, roadmap level, future backlog, or agent infrastructure.

## 2. Find the existing owner

Use `AGENTS.md` if it is already in context; otherwise read it once. Read `.agents/guidance/documentation-sync.md` only if it is not already in context, then inspect only the likely owner and directly related routing documents. Search repository paths and headings before concluding that no owner exists.

If an existing normative document owns the fact, update that document. Do not create a second design note, ADR, audit, or plan for the same responsibility.

## 3. Decide whether a new document is justified

Create a new normative document only when all are true:

- no existing document owns the decision;
- merging it into the nearest owner would mix distinct stable concerns or materially harm maintainability;
- the new document has one clear long-lived responsibility;
- the appropriate `AGENTS` or guidance owner can route to it without duplicating its content.

Create a temporary planning or audit document only when its task needs an independent artifact and it states, at creation time, the exact retirement, archival, or conversion trigger.

If these conditions do not pass, record the decision in the existing owner or report that no new file is needed.

## 4. Write the decision

Capture only what the owning document needs: context, accepted decision, scope, alternatives/tradeoffs when useful, consequences, unresolved follow-ups and their owner, and verification criteria. Follow the target document's existing structure rather than imposing a universal template.

Only after the new-document gate passes, and only when the accepted owner is a new feature design note under `docs/features/`, read [feature design note](references/feature-design-note.md). Do not use that reference for an update to an existing owner or for architecture, roadmap, audit, or integration documents.

Do not copy dynamic sprint, level, task, or status facts into a static document. Link to `docs/roadmap/current-sprint.md` when current state matters.

## 5. Synchronize consumers

Update only direct routing pointers, Postman contracts, integration inventories/maps, or roadmap owners that `.agents/guidance/documentation-sync.md` says are affected. Do not broaden the task into a repository-wide rewrite.

Report the owner chosen, whether a new document was considered, which gate conditions passed or failed, and all synchronized files.
