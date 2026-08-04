---
description: Detect and fix inconsistencies in the AI-agent infrastructure (AGENTS.md, rules, skills, references, workflows, normative docs) after changes, without uncontrolled expansion of that infrastructure.
---

# AI Infrastructure Review Workflow

Maintains the AI-agent infrastructure itself (`AGENTS.md`, `**/.windsurf/**`, the normative docs it points to, `scripts/check-agent-context.sh`) after it has changed. Does not review application code or business logic — use `/pre-commit-review` for that.

## Safety mode (hard constraints)

- Do not modify application code.
- Do not change the content of `docs/roadmap/current-sprint.md`, `roadmap.md`, `backlog.md`, or `changelog.md`. Findings owned by `docs/roadmap/*.md` are report-only — route fixes to a separate roadmap update.
- Do not commit, push, delete branches, or perform any Git remote operation.
- Do not create a new `AGENTS.md`, rule, skill, reference, workflow, or normative documentation file unless it passes the gate in step 6 and is stated explicitly in the report.
- Do not duplicate an existing full instruction into another file — add a short routing pointer instead.
- Do not expand scope beyond the findings from step 5.

## 1. Collect the changed-file lists

Read the real Git state, not memory of a past conversation:

```bash
git diff --staged --name-only
git diff --name-only
git ls-files --others --exclude-standard
```

Union the three lists. Do not read diff bodies yet — content is loaded selectively in step 2.

## 2. Classify changed files

Keep two lists:
- `all_changed_files` — every file from step 1;
- `infra_changed_files` — the subset matching: `AGENTS.md`, `**/AGENTS.md`, `.windsurf/**`, `**/.windsurf/**`, `docs/architecture/**`, `docs/backend/**`, `docs/database/**`, `docs/features/**`, `docs/testing/**`, `docs/roadmap/**`, `scripts/check-agent-context.sh`.

Do not discard `all_changed_files`, but do not review application business logic. Load content selectively:
- routing-control files (`AGENTS.md`, `**/.windsurf/**`, `scripts/check-agent-context.sh`) — read the complete staged/unstaged diff (or full content if untracked);
- large normative documents (e.g. `docs/architecture/current-architecture.md`, `docs/database/relationships.md`, `docs/roadmap/*.md`, `docs/testing/*.md`) — read only the changed hunks first; open surrounding sections or the full file only when ownership, routing impact, or a contradiction cannot be determined from the hunks alone;
- application files — only the hunks touching endpoints, DTO contracts, entities/schema, security, package structure, or documented flows, as the signal for whether `.windsurf/rules/documentation-sync.md` triggers; do not load unrelated application hunks.

If `infra_changed_files` is empty and no application change triggers documentation sync, stop and report: "No AI-infrastructure maintenance is required for the current diff."

## 3. Script safety check + validation baseline

If `scripts/check-agent-context.sh` is staged, unstaged, or untracked, read its full current content and diff first. Confirm it performs only read-only, repository-local validation.

If it mutates files, writes to Git, uses the network, installs packages, invokes unknown repository scripts, runs build/package managers, or cannot be verified, record `Validation baseline unavailable: script safety not established`, continue in report-only mode, and skip the baseline run below (repeat this same check before step 10's run).

If the script is unchanged, or has passed this safety check, run, before applying any fix:

```bash
bash scripts/check-agent-context.sh
```

Record the baseline FAIL/WARN counts and messages verbatim — this run is not itself a finding; it is only the step 10 reference point.

## 4. Assign a knowledge owner to each changed unit

Split semantic changes only in `infra_changed_files` into owner-assigned units (not per line). Application files from `all_changed_files` never get an infrastructure owner and are never new-infrastructure candidates — only their documentation-sync signal (step 2) matters.

Classify each `infra_changed_files` unit with this table only — do not invent a category:

| Nature of the change | Owner |
|---|---|
| Repository-wide hard gate | root `AGENTS.md` |
| Backend-wide hard gate / routing entry | `backend/AGENTS.md` |
| File-glob convention | rule under `.windsurf/rules/` or `backend/.windsurf/rules/` |
| Branching task needing progressive disclosure | skill under `.windsurf/skills/*/SKILL.md` |
| Optional deep procedure for some tasks | skill `references/*.md` |
| Repeatable explicit procedure invoked on demand | `.windsurf/workflows/*.md` |
| Current project state (sprint, level, status, priorities, tasks) | `docs/roadmap/*.md` — never a rule/skill |
| Architecture snapshot / accepted decisions | `docs/architecture/*.md` |
| Database/schema/relationship snapshot | `docs/database/*.md` |
| Documented business or API flow | `docs/features/*.md` |
| Project-wide testing strategy | `docs/testing/*.md` |
| Backend guidance unsuitable for auto-loading | `docs/backend/*.md` |
| Machine-checkable invariant | `scripts/check-agent-context.sh` |

If a fact has no owner here and no existing file already owns it, flag it in step 6 as a candidate — do not create anything yet.

## 5. Check only severity >= 4/10

For each owner-assigned unit, check only the changed owner file and the routing/documentation files directly connected to it. No repository-wide audit — open an unchanged file only if it is directly referenced by, or possibly contradicted by, a changed unit. Check only:

- obsolete or broken paths
- duplicated normative instructions across files
- conflicting owners for the same fact
- over-broad auto-loading/routing (`always_on` rule, unscoped glob)
- loss of progressive disclosure
- dynamic project state leaking into a static rule/skill
- a rule/skill glob/description no longer matching the actual structure
- an unnecessary new `AGENTS.md`/rule/skill/reference/workflow/normative doc that fails the step 6 gate
- a contradiction across the AGENTS → rules → skills → references chain
- documentation left unsynced after an API/DB/security/architecture change (cross-check `.windsurf/rules/documentation-sync.md`)

Discard anything below severity 4/10.

## 6. Do not create new infra by default

One new source file alone never justifies new infrastructure, and no candidate below is valid if an existing file already owns the fact (check step 4 first). Prefer, in order: (1) update the existing owner; (2) add a one-line routing pointer; (3) move optional detail into an existing skill's `references/*.md`; (4) extend `scripts/check-agent-context.sh` with a deterministic check.

Beyond "no existing owner," each type needs ALL of its own conditions:

| New | Additional required conditions |
|---|---|
| Rule | convention repeats, not a one-off; scoped to a specific glob; must auto-apply unasked; absence causes a stated severity >= 4/10 problem |
| Skill | recurring task class (not one instance); multiple branching solution paths; needs progressive disclosure |
| Reference | belongs to an existing skill; needed by only some of its branches; inline placement would harm progressive disclosure; holds substantial procedure/examples/decision matrix |
| Workflow | explicitly invoked, not auto-loaded; repeated across tasks; stable multi-step sequence; coordinates several files/validations |
| `AGENTS.md` | stable subtree with distinct hard gates/routing needs; applies broadly in that subtree; a parent `AGENTS.md` would broaden context or create ambiguity; stays limited to hard gates/routing, not deep procedure |
| Normative doc | stable project knowledge, not temporary state; merging into the nearest related existing normative document would mix distinct concerns or materially hurt maintainability; has a clear single scope; a routing pointer from the appropriate existing routing owner (e.g. `AGENTS.md`, a rule, skill, or workflow) is identified |

If a candidate fails its gate, report it as "considered, not created" with the failing condition.

## 7. Memory migration check

Never treat auto-generated memory as a source of truth. Before migrating any memory content into a rule/skill/doc: identify the existing owner via the step 4 table and update it if one exists; if none exists, run the content through the step 6 gates — absence of an owner is not itself a pass. Also verify: it is still accurate against current files (re-read, don't assume); its paths still exist; it is stable (not a sprint/task/temporary priority); it doesn't contradict current content. Drop anything failing a check; do not migrate it.

## 8. Report

Default to report-only mode. Present the full final list of step 5 findings (owner + minimal fix each, no scope expansion), Default to report-only mode. Present the full final list of step 5 findings
(owner + minimal fix each, no scope expansion), plus every new-infrastructure
candidate evaluated in step 6, its gate result (`accepted` or
`considered, not created`), and the decisive conditions.

Apply a fix without waiting for confirmation only when it is deterministic, unambiguous, and does not change routing semantics, ownership, triggers, globs, or progressive-disclosure behavior (e.g. an unambiguous renamed-file path, a path typo, a dangling reference to a file confirmedly moved to one known place). A one-line change is not automatically low-risk.

For every semantic routing or ownership change (e.g. an AGENTS.md routing table, a rule's `trigger`/`globs`, a skill's `description`), stop after the report and wait for explicit confirmation before editing.

## 9. Apply and re-check

After applying the minimal fixes, re-check only the findings just fixed and any new direct contradiction the fix itself introduced. Do not re-run the full step 4/5 classification over unrelated files.

## 10. Run the validation script and compare to baseline

Re-apply the step 3 script-safety check, because the script may now be edited:
- if it is still unsafe or unverifiable, stop and report that after-fix validation could not be run;
- if it is now safe but step 3 recorded no baseline, run the script and report the result as `after-fix only` — do not classify findings as pre-existing or newly introduced;
- if a baseline exists, run the script and compare `baseline → after-fix`.

// turbo
```bash
bash scripts/check-agent-context.sh
```

Only findings absent from an available baseline and present after the fix are "newly introduced"; everything else is pre-existing.

## 11. Routing acceptance tests (only if routing semantics changed)

Routing semantics include, but aren't limited to: `AGENTS.md` tables/subtree ownership, rule frontmatter (`trigger`/`globs`/`description`), skill routing branches/reference links, workflow routing pointers, and the `documentation-sync.md` table.

If step 9 changed any of these, list only the minimal manual checks to re-verify, e.g. "editing an entity file still surfaces `backend/.windsurf/rules/entity-conventions.md`". Do not re-run the full rule/skill suite unless the change affects multiple routing branches, a root/subtree ownership boundary, or repository-wide routing semantics.
