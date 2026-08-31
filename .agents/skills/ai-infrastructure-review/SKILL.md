---
name: ai-infrastructure-review
description: Review LLHelper agent infrastructure changes across AGENTS files, Codex guidance/skills, Windsurf compatibility files, normative docs, and the context validator. Report semantic routing changes before applying them.
---

# AI Infrastructure Review

Maintain the repository's agent infrastructure without reviewing unrelated business logic. Use `.agents/skills/pre-commit-review/SKILL.md` for application-code commit readiness.

## Safety constraints

- Do not modify application code.
- Do not change `docs/roadmap/current-sprint.md`, `docs/roadmap/roadmap.md`, `docs/roadmap/backlog.md`, or `docs/roadmap/changelog.md`; report roadmap-owned findings separately.
- Do not commit, push, delete branches, or mutate remotes.
- Treat `.windsurf/**` as the Windsurf compatibility owner and `.agents/**` plus `AGENTS.override.md` files as the Codex owner. Compare them for functional coverage, but do not edit Windsurf files unless explicitly requested.
- Do not create new agent infrastructure unless the new-infrastructure gate below passes and the candidate is stated in the report.
- Do not duplicate a full normative instruction within one platform. Keep one owner and add only a short routing pointer or optional reference from consumers.
- Do not apply semantic routing, ownership, discovery, or progressive-disclosure changes before explicit user confirmation.

## 1. Collect current changes

Read staged, unstaged, and untracked file lists from Git and form their union. Keep all changed files visible, but classify infrastructure separately.

Infrastructure includes root/subtree `AGENTS.md` and `AGENTS.override.md`, `.agents/**`, `.windsurf/**`, directly routed normative docs, and `scripts/check-agent-context.sh`.

Read complete diffs for routing-control files and the validator. For large normative docs, read changed hunks first and expand only when ownership or contradiction cannot be resolved. Inspect application hunks only for documentation-sync signals such as endpoints, DTO contracts, entities/schema, security, package structure, and documented flows.

If no infrastructure changed and no application change triggers documentation sync, report that no infrastructure maintenance is required.

## 2. Establish a validation baseline

Before running `scripts/check-agent-context.sh`, inspect the whole script if it changed. It must be read-only, repository-local, and limited to validation. It must not modify files or Git, use the network, install dependencies, run package/build tools, or invoke unknown repository scripts.

If safety is established, run it and record exact FAIL/WARN counts and messages. If not, continue report-only and state that the baseline is unavailable.

## 3. Assign one owner per changed fact

Use these owners:

| Fact | Owner |
|---|---|
| Repository-wide hard gate and shared routing | `AGENTS.md` |
| Codex repository-wide adaptation | `AGENTS.override.md` |
| Backend or frontend hard gate | subtree `AGENTS.md` |
| Codex subtree routing | subtree `AGENTS.override.md` |
| Scoped, directly applicable Codex convention | `.agents/guidance/**` |
| Branching Codex task with progressive disclosure | `.agents/skills/*/SKILL.md` |
| Optional branch-specific procedure | skill `references/*.md` |
| Windsurf behavior | corresponding `.windsurf/**` file |
| Current project state | `docs/roadmap/**` |
| Architecture snapshot | `docs/architecture/**` |
| Database snapshot | `docs/database/**` |
| Business/API flow | `docs/features/**` |
| Testing strategy | `docs/testing/**` |
| Machine-checkable invariant | `scripts/check-agent-context.sh` |

For Codex/Windsurf parity, equivalent responsibility is expected across platform-specific owners; duplicated ownership within the same platform is not.

## 4. Review material findings only

Check changed owners and directly connected files for issues with practical severity at least 4/10:

- broken or obsolete paths;
- duplicate or conflicting owners within one platform;
- lost functional coverage between Windsurf and Codex;
- over-broad routing or lost progressive disclosure;
- dynamic sprint/level/status copied into static guidance or skills;
- skill name/description that misroutes discovery;
- Windsurf-only metadata copied into Codex guidance;
- project conventions incorrectly placed in `.codex/rules` instead of Codex guidance/skills;
- unnecessary infrastructure that fails the creation gate;
- contradictions along AGENTS → guidance/skills → references;
- missing documentation sync after an API/DB/security/architecture change.

Discard lower-severity observations.

## 5. New-infrastructure gate

Prefer updating an existing owner, adding a short routing pointer, adding optional detail to an existing skill reference, or adding a deterministic validator check.

A new file requires no existing owner plus all conditions for its type:

- Guidance: stable repeating convention, a clear scope and route, and a material problem if omitted.
- Skill: recurring task class, branching decisions, and real progressive-disclosure value.
- Reference: belongs to an existing skill, is needed only for some branches, and is substantial enough that inline content would harm routing.
- `AGENTS.override.md`: distinct stable Codex routing is needed at that repository/subtree boundary.
- Normative doc: stable single responsibility that would materially harm the nearest owner if merged, plus a direct routing owner.

For a temporary audit/plan, require an explicit retirement or conversion trigger.

Report every candidate as `accepted` or `considered, not created`, with the decisive conditions.

## 6. Memory migration check

Never use auto-generated memory as a source of truth. Before migrating memory content:

1. identify its existing owner from the ownership table and update that owner if one exists;
2. if no owner exists, run the content through the new-infrastructure gate above — missing ownership is not approval to create a file;
3. verify the fact against current repository files and confirm every referenced path still exists;
4. separate stable knowledge from sprint, task, status, or temporary-priority state;
5. check for contradictions with current owners and direct consumers.

Drop content that fails any check instead of preserving it for completeness.

## 7. Report before semantic changes

Default to report-only. Give the complete material finding list, each owner, minimal fix, scope boundary, and all infrastructure candidates. Apply only deterministic path corrections that do not alter semantics without waiting.

Stop for confirmation before changing routing tables, ownership, skill discovery descriptions, scope, or progressive disclosure.

## 8. Apply confirmed fixes and validate

After confirmation, apply only reported fixes. Re-check those findings and direct contradictions introduced by the fix.

Re-inspect validator safety, run `bash scripts/check-agent-context.sh`, and compare baseline to the new FAIL/WARN result. Only messages absent at baseline and present after changes are newly introduced.

When routing changed, perform minimal acceptance checks for each affected boundary, including root-to-backend/frontend routing, guidance selection, skill-reference selection, documentation sync, and Codex/Windsurf functional coverage. Confirm `.windsurf/**` has no diff when it was designated read-only.

## Final report

Report changed infrastructure files, application files changed (normally none), roadmap changes (normally none), validation baseline → after result, routing checks, Windsurf diff status, and whether anything was committed or pushed.
