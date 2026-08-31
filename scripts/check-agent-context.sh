#!/usr/bin/env bash
# check-agent-context.sh
#
# Validates the hybrid AI-agent infrastructure (shared AGENTS.md, Codex
# AGENTS.override.md + .agents/**, Windsurf .windsurf/**, and routed docs) for
# staleness, broken links, invalid routing/frontmatter, coverage gaps,
# inconsistent DB/index declarations, and stale skill/guidance assertions.
#
# Usage: ./scripts/check-agent-context.sh
# Run manually, or from the /pre-commit-review workflow.
set -uo pipefail

LAUNCH_DIR="$(pwd -P)"
GIT_ROOT=""
if GIT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  REPO_ROOT="$GIT_ROOT"
else
  REPO_ROOT="$LAUNCH_DIR"
fi
cd "$REPO_ROOT" || exit 1

FAIL=0
WARN=0

pass() { printf '  [OK]   %s\n' "$1"; }
warn() { printf '  [WARN] %s\n' "$1"; WARN=$((WARN + 1)); }
fail() { printf '  [FAIL] %s\n' "$1"; FAIL=$((FAIL + 1)); }

approx_tokens() {
  local bytes="$1"
  printf '%s' $(((bytes + 3) / 4))
}

is_empty_value() {
  case "$1" in
    ''|'""'|"''") return 0 ;;
    *) return 1 ;;
  esac
}

TMPDIR_CHECK=$(mktemp -d)
trap 'rm -rf "$TMPDIR_CHECK"' EXIT

# Exclusions applied to every file discovery. Using a bash array keeps the
# patterns as separate arguments (quoting inside a plain string does not work).
FIND_EXCLUDE=(
  -not -path '*/node_modules/*'
  -not -path '*/target/*'
  -not -path '*/__MACOSX/*'
  -not -name '.DS_Store'
  -not -name '._*'
)

# Recursive discovery for the shared, Windsurf, and Codex instruction layers.
find . -path '*/.windsurf/*' -name '*.md' "${FIND_EXCLUDE[@]}" 2>/dev/null | sort >"$TMPDIR_CHECK/windsurf_md.txt"
find . -iname 'AGENTS.md' "${FIND_EXCLUDE[@]}" 2>/dev/null | sort >"$TMPDIR_CHECK/agents_md.txt"
find . -name 'AGENTS.override.md' "${FIND_EXCLUDE[@]}" 2>/dev/null | sort >"$TMPDIR_CHECK/agents_override_md.txt"
find . -path '*/.agents/guidance/*' -name '*.md' "${FIND_EXCLUDE[@]}" 2>/dev/null | sort >"$TMPDIR_CHECK/codex_guidance_md.txt"
find . -path '*/.agents/skills/*' -name '*.md' "${FIND_EXCLUDE[@]}" 2>/dev/null | sort >"$TMPDIR_CHECK/codex_skills_md.txt"
cat "$TMPDIR_CHECK/codex_guidance_md.txt" "$TMPDIR_CHECK/codex_skills_md.txt" | sort -u >"$TMPDIR_CHECK/codex_md.txt"
find ./docs -name '*.md' "${FIND_EXCLUDE[@]}" 2>/dev/null | sort >"$TMPDIR_CHECK/docs_md.txt"
find ./backend -maxdepth 1 -name '*.md' "${FIND_EXCLUDE[@]}" 2>/dev/null | sort >"$TMPDIR_CHECK/backend_md.txt"

# Deduplicate and sort so a file found by two discovery paths is checked once.
cat \
  "$TMPDIR_CHECK/windsurf_md.txt" \
  "$TMPDIR_CHECK/agents_md.txt" \
  "$TMPDIR_CHECK/agents_override_md.txt" \
  "$TMPDIR_CHECK/codex_md.txt" \
  "$TMPDIR_CHECK/docs_md.txt" \
  "$TMPDIR_CHECK/backend_md.txt" |
  sort -u >"$TMPDIR_CHECK/all_md.txt"

echo "== 1. Discovering AI-infrastructure files =="
echo "  Found $(wc -l <"$TMPDIR_CHECK/windsurf_md.txt" | tr -d ' ') files under **/.windsurf/**, $(wc -l <"$TMPDIR_CHECK/codex_guidance_md.txt" | tr -d ' ') Codex guidance files, $(wc -l <"$TMPDIR_CHECK/codex_skills_md.txt" | tr -d ' ') Codex skill files, $(wc -l <"$TMPDIR_CHECK/agents_md.txt" | tr -d ' ') AGENTS.md, $(wc -l <"$TMPDIR_CHECK/agents_override_md.txt" | tr -d ' ') AGENTS.override.md, $(wc -l <"$TMPDIR_CHECK/docs_md.txt" | tr -d ' ') under docs/"
if [ -z "$GIT_ROOT" ]; then
  fail "Validator was launched outside a Git worktree; Codex project discovery may start at the wrong directory"
else
  pass "Git project root resolved to $REPO_ROOT"
fi
case "$LAUNCH_DIR/" in
"$REPO_ROOT"/*) pass "Launch directory is inside the resolved Git project" ;;
*) fail "Launch directory $LAUNCH_DIR is outside the resolved Git project $REPO_ROOT" ;;
esac
if [ -f AGENTS.override.md ] && [ -d .agents/skills ]; then
  pass "Codex root override and repository skills are discoverable from the Git root"
else
  fail "Git root is missing AGENTS.override.md or .agents/skills; check the Codex project root"
fi

echo ""
echo "== 2. Rule file size limits (Windsurf hard cap: 12000 chars/workspace rule) =="
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
  */rules/*)
    size=$(wc -m <"$f" | tr -d ' ')
    if [ "$size" -gt 12000 ]; then
      fail "$f is ${size} chars — over the 12000 char Windsurf rule limit"
    elif [ "$size" -gt 10000 ]; then
      warn "$f is ${size} chars — approaching the 12000 char limit"
    else
      pass "$f (${size} chars)"
    fi
    ;;
  esac
done <"$TMPDIR_CHECK/windsurf_md.txt"

echo ""
echo "== 3. always_on + directory-scoped AGENTS.md chains (target: <= 5 KB each) =="
always_on_total=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if grep -q '^trigger: always_on' "$f" 2>/dev/null; then
    size=$(wc -c <"$f" | tr -d ' ')
    always_on_total=$((always_on_total + size))
  fi
done <"$TMPDIR_CHECK/windsurf_md.txt"

agents_scope_count=0
while IFS= read -r scope_file; do
  [ -z "$scope_file" ] && continue
  scope_dir=$(dirname "$scope_file")
  scope_label="${scope_dir#./}"
  [ "$scope_label" = "." ] && scope_label="root"
  scope_total=$always_on_total

  # Root AGENTS.md applies everywhere. A subtree AGENTS.md applies only to its
  # own directory and descendants, so sibling scopes must never be summed.
  while IFS= read -r candidate_file; do
    [ -z "$candidate_file" ] && continue
    candidate_dir=$(dirname "$candidate_file")
    if [ "$candidate_dir" = "." ] \
      || [ "$scope_dir" = "$candidate_dir" ] \
      || [[ "$scope_dir" == "$candidate_dir/"* ]]; then
      size=$(wc -c <"$candidate_file" | tr -d ' ')
      scope_total=$((scope_total + size))
    fi
  done <"$TMPDIR_CHECK/agents_md.txt"

  agents_scope_count=$((agents_scope_count + 1))
  if [ "$scope_total" -gt 5120 ]; then
    warn "Windsurf AGENTS scope '$scope_label' is ${scope_total} bytes (> 5 KB target)"
  else
    pass "Windsurf AGENTS scope '$scope_label' is ${scope_total} bytes (<= 5 KB target)"
  fi
done <"$TMPDIR_CHECK/agents_md.txt"

if [ "$agents_scope_count" -eq 0 ]; then
  fail "No AGENTS.md scope was found"
fi

echo ""
echo "== 4. Empty / near-empty infrastructure files =="
empty=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  size=$(wc -c <"$f" | tr -d ' ')
  if [ "$size" -eq 0 ]; then
    fail "$f is 0 bytes"
    empty=1
  elif [ "$size" -lt 50 ]; then
    warn "$f is only ${size} bytes — suspicious"
  fi
done <"$TMPDIR_CHECK/all_md.txt"
[ "$empty" -eq 0 ] && pass "No empty infrastructure files"

echo ""
echo "== 5. Windsurf rule/skill and Codex skill frontmatter validity =="
frontmatter_ok=1
while IFS= read -r f; do
  [ -z "$f" ] && continue

  case "$f" in
  */.windsurf/rules/*.md)
    opener=$(head -1 "$f" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    if [ "$opener" != '---' ]; then
      fail "$f: missing or malformed frontmatter opener"
      frontmatter_ok=0
      continue
    fi
    closer_line=$(grep -n '^---$' "$f" | sed -n '2p' | cut -d: -f1)
    if [ -z "$closer_line" ]; then
      fail "$f: missing frontmatter closer '---'"
      frontmatter_ok=0
      continue
    fi
    fm=$(sed -n "1,${closer_line}p" "$f")

    trigger=$(echo "$fm" | grep '^trigger:' | head -1 | sed 's/^trigger: *//;s/[[:space:]]*$//')
    description=$(echo "$fm" | grep '^description:' | head -1 | sed 's/^description: *//;s/[[:space:]]*$//')
    globs=$(echo "$fm" | grep '^globs:' | head -1 | sed 's/^globs: *//;s/[[:space:]]*$//')

    if is_empty_value "$trigger"; then
      fail "$f: frontmatter has no 'trigger'"
      frontmatter_ok=0
    else
      case "$trigger" in
      always_on|model_decision|glob)
        if is_empty_value "$description"; then
          fail "$f: trigger '$trigger' has empty description"
          frontmatter_ok=0
        fi
        if [ "$trigger" = 'glob' ] && is_empty_value "$globs"; then
          fail "$f: trigger 'glob' has empty globs"
          frontmatter_ok=0
        fi
        ;;
      *)
        warn "$f: unknown trigger '$trigger'"
        ;;
      esac
    fi
    ;;

  */.windsurf/skills/*/SKILL.md|*/.windsurf/skills/SKILL.md)
    opener=$(head -1 "$f" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    if [ "$opener" != '---' ]; then
      fail "$f: missing or malformed frontmatter opener"
      frontmatter_ok=0
      continue
    fi
    closer_line=$(grep -n '^---$' "$f" | sed -n '2p' | cut -d: -f1)
    if [ -z "$closer_line" ]; then
      fail "$f: missing frontmatter closer '---'"
      frontmatter_ok=0
      continue
    fi
    fm=$(sed -n "1,${closer_line}p" "$f")

    name=$(echo "$fm" | grep '^name:' | head -1 | sed 's/^name: *//;s/[[:space:]]*$//')
    description=$(echo "$fm" | grep '^description:' | head -1 | sed 's/^description: *//;s/[[:space:]]*$//')

    if is_empty_value "$name"; then
      fail "$f: skill frontmatter has no 'name'"
      frontmatter_ok=0
    fi
    if is_empty_value "$description"; then
      fail "$f: skill frontmatter has no 'description'"
      frontmatter_ok=0
    fi
    ;;
  esac
done <"$TMPDIR_CHECK/windsurf_md.txt"

: >"$TMPDIR_CHECK/codex_skill_names.txt"
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
  */.agents/skills/*/SKILL.md)
    opener=$(head -1 "$f" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    if [ "$opener" != '---' ]; then
      fail "$f: missing or malformed frontmatter opener"
      frontmatter_ok=0
      continue
    fi
    closer_line=$(grep -n '^---$' "$f" | sed -n '2p' | cut -d: -f1)
    if [ -z "$closer_line" ]; then
      fail "$f: missing frontmatter closer '---'"
      frontmatter_ok=0
      continue
    fi
    fm=$(sed -n "1,${closer_line}p" "$f")
    name=$(echo "$fm" | grep '^name:' | head -1 | sed 's/^name: *//;s/[[:space:]]*$//;s/^"//;s/"$//')
    description=$(echo "$fm" | grep '^description:' | head -1 | sed 's/^description: *//;s/[[:space:]]*$//;s/^"//;s/"$//')

    if is_empty_value "$name"; then
      fail "$f: Codex skill frontmatter has no 'name'"
      frontmatter_ok=0
    else
      printf '%s\n' "$name" >>"$TMPDIR_CHECK/codex_skill_names.txt"
      if ! [[ "$name" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
        fail "$f: Codex skill name '$name' must use lowercase hyphen-case"
        frontmatter_ok=0
      fi
      skill_dir=$(basename "$(dirname "$f")")
      if [ "$name" != "$skill_dir" ]; then
        fail "$f: Codex skill name '$name' does not match directory '$skill_dir'"
        frontmatter_ok=0
      fi
    fi
    if is_empty_value "$description"; then
      fail "$f: Codex skill frontmatter has no 'description'"
      frontmatter_ok=0
    fi
    ;;
  esac
done <"$TMPDIR_CHECK/codex_skills_md.txt"

duplicate_skill_names=$(sort "$TMPDIR_CHECK/codex_skill_names.txt" | uniq -d)
if [ -n "$duplicate_skill_names" ]; then
  while IFS= read -r name; do
    [ -n "$name" ] && fail "Duplicate Codex skill name: $name"
  done <<<"$duplicate_skill_names"
  frontmatter_ok=0
fi

USER_CODEX_SKILL_HOME="${CODEX_HOME:-$HOME/.codex}/skills"
USER_SKILL_ROOTS=("$HOME/.agents/skills" "$USER_CODEX_SKILL_HOME")
while IFS= read -r name; do
  [ -z "$name" ] && continue
  for user_skill_root in "${USER_SKILL_ROOTS[@]}"; do
    if [ -f "$user_skill_root/$name/SKILL.md" ]; then
      warn "Codex skill '$name' exists in both repository and user scope ($user_skill_root/$name); duplicate discovery may be ambiguous"
    fi
  done
done < <(sort -u "$TMPDIR_CHECK/codex_skill_names.txt")

[ "$frontmatter_ok" -eq 1 ] && pass "All Windsurf rules/skills and Codex skills have valid frontmatter"

echo ""
echo "== 6. Absolute local paths (must be repo-relative) =="
found_abs=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  matches=$(grep -nE '/(Users|home)/[A-Za-z0-9_.-]+/' "$f" 2>/dev/null)
  if [ -n "$matches" ]; then
    fail "$f contains an absolute local path"
    echo "$matches" | sed 's/^/      /'
    found_abs=1
  fi
done <"$TMPDIR_CHECK/all_md.txt"
[ "$found_abs" -eq 0 ] && pass "No absolute /Users/... or /home/... paths found"

echo ""
echo "== 7. Stale or forbidden terms outside changelog/backlog =="
stale_matches=$(
  grep -lE 'CardDesc|cardDesc|card_desc|Flyway|flyway' \
    $(cat "$TMPDIR_CHECK/all_md.txt") 2>/dev/null \
  | grep -vE '(changelog|backlog)\.md$'
)
if [ -n "$stale_matches" ]; then
  while IFS= read -r m; do
    [ -n "$m" ] && warn "$m contains a stale/forbidden term"
  done <<<"$stale_matches"
else
  pass "No stale/forbidden terms found outside changelog.md/backlog.md"
fi

echo ""
echo "== 8. Exactly one active sprint declared =="
if [ -f docs/roadmap/current-sprint.md ]; then
  sprint_headers=$(grep -c '^## Sprint ' docs/roadmap/current-sprint.md)
  if [ "$sprint_headers" -eq 1 ]; then
    pass "current-sprint.md declares exactly one sprint"
  elif [ "$sprint_headers" -eq 0 ]; then
    warn "current-sprint.md has no '## Sprint' header — check manually"
  else
    fail "current-sprint.md declares $sprint_headers sprints — should be exactly one"
  fi
else
  fail "docs/roadmap/current-sprint.md not found"
fi

echo ""
echo "== 9. No hardcoded sprint references outside current-sprint.md/changelog.md/backlog.md =="
stale_sprint=$(
  grep -lE '(\*\*Sprint:\*\*[[:space:]]*Sprint [0-9]\.[0-9]+|Fixes Sprint [0-9]\.[0-9]+ Task #[0-9]+|Sprint [0-9]\.[0-9]+ Task #[0-9]+)' \
    $(cat "$TMPDIR_CHECK/all_md.txt") 2>/dev/null \
  | grep -vE '(current-sprint|changelog|backlog)\.md$'
)
if [ -n "$stale_sprint" ]; then
  while IFS= read -r m; do
    [ -n "$m" ] && warn "$m has a hardcoded sprint reference — should point to docs/roadmap/current-sprint.md instead"
  done <<<"$stale_sprint"
else
  pass "No hardcoded sprint references found outside current-sprint.md/changelog.md/backlog.md"
fi

echo ""
echo "== 10. No static 'current project is Level X' assertions in skills/guidance/rules =="
# Skills, guidance, and rules should not hardcode the current project level.
static_level=$(
  grep -ilE 'current (project|level) is Level [0-9]|project is Level [0-9]|we are at Level [0-9]' \
    $(cat "$TMPDIR_CHECK/windsurf_md.txt") $(cat "$TMPDIR_CHECK/codex_md.txt") 2>/dev/null \
  | grep -vE '(current-sprint|changelog|backlog|roadmap)\.md$' || true
)
if [ -n "$static_level" ]; then
  while IFS= read -r m; do
    [ -n "$m" ] && warn "$m contains a static 'current project is Level X' assertion"
  done <<<"$static_level"
else
  pass "No static level assertions in skills/guidance/rules"
fi

echo ""
echo "== 11. Contradictory DB index declarations (heuristic) =="
# If an index name appears in both an implemented/done context and a pending/todo
# context across the normative DB docs, that is likely a contradiction.
# We ignore summary/status lines that mention both (e.g. "Partially implemented ...
# still pending") and changelog lines with TODO/Sprint dates.
db_contradiction=0
DB_DOCS="docs/database/relationships.md docs/database/schema-ownership.md"
DB_COMBINED="$TMPDIR_CHECK/db_combined.md"
: > "$DB_COMBINED"
for db_doc in $DB_DOCS; do
  [ -f "$db_doc" ] || continue
  awk -v f="$db_doc" '{print f ":" NR ":" $0}' "$db_doc" >> "$DB_COMBINED"
done

all_idx=$(
  for db_doc in $DB_DOCS; do
    [ -f "$db_doc" ] && cat "$db_doc"
  done | grep -oE '(idx|uk|pk)_[[:alnum:]_]+' | sort -u
)

for name in $all_idx; do
  # Implemented: explicit done markers or migration version.
  # Exclude lines that also talk about "pending", "Backlog", "not created" or "still".
  impl=$(grep -E "($name)" "$DB_COMBINED" \
    | grep -iE '(✅|\[x\]|Added in V[0-9]+|✓)' \
    | grep -viE '(pending|Backlog|not created|still|remaining|Partially)' \
    | head -1)
  # Pending: explicit pending markers, "not created", or Backlog in a status column.
  # Exclude lines that also contain done markers or look like changelog/history.
  pend=$(grep -E "($name)" "$DB_COMBINED" \
    | grep -iE '(Pending|not created|Backlog|⏳|\[ \]|deferred)' \
    | grep -viE '(✅|\[x\]|Added in V[0-9]+|✓|Sprint [0-9]\.[0-9]|TODO)' \
    | head -1)
  if [ -n "$impl" ] && [ -n "$pend" ]; then
    loc=$(printf '%s' "$impl" | cut -d: -f1,2 | tr ':' ':')
    warn "$loc and related: index '$name' appears both as implemented and pending"
    db_contradiction=1
  fi
done
[ "$db_contradiction" -eq 0 ] && pass "No contradictory DB index declarations found"

echo ""
echo "== 12. Broken relative markdown references (best-effort) =="
# Planned references: files that are deliberately referenced before creation.
# Add paths here (repo-relative, no leading ./) only when a forward-reference is
# approved and documented. Remove the entry once the file is created.
PLANNED_REFS=""

is_planned_ref() {
  local ref_clean="$1"
  for planned in $PLANNED_REFS; do
    [ "$ref_clean" = "$planned" ] && return 0
  done
  return 1
}

broken=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
  */changelog.md | */backlog.md) continue ;;
  esac
  dir=$(dirname "$f")

  # Backtick-wrapped .md paths: `some/path/file.md` or `file.md` or with #anchor
  refs_bt=$(grep -oE '\`[A-Za-z0-9_.@/-]+(/[A-Za-z0-9_.@/-]+)+\.md(#[A-Za-z0-9_.-]+)?\`' "$f" \
    | tr -d '\`' | sed 's/#.*//' | sort -u)
  # Markdown links: [text](some/path/file.md) or [text](file.md), with optional #anchor
  refs_md=$(grep -oE '\[([^]]+)\]\([^)]+\.md(#[^)]+)?\)' "$f" \
    | sed -E 's/.*\]\(([^)]+)\)/\1/' | sed 's/#.*//' \
    | grep -vE '^(https?|mailto):' | sort -u)

  for ref in $refs_bt $refs_md; do
    [ -z "$ref" ] && continue
    ref_clean="${ref#/}"
    ref_clean="${ref_clean#./}"
    if [ ! -e "$REPO_ROOT/$ref_clean" ] && [ ! -e "$dir/$ref_clean" ]; then
      if is_planned_ref "$ref_clean"; then
        pass "$f → $ref (planned, not yet created)"
      else
        fail "$f references missing file: $ref"
        broken=1
      fi
    fi
  done
done <"$TMPDIR_CHECK/all_md.txt"
[ "$broken" -eq 0 ] && pass "No broken .md references found (best-effort check)"

echo ""
echo "== 13. Obsolete rule/skill paths referenced in rules/skills =="
# Old paths that should no longer appear in active rules/skills (history in changelog/backlog is OK).
obs_paths=$(
  grep -lE '\.windsurf/rules/(database-schema-ownership|project-roadmap|security-standards)\.md|docs/roadmap/LL_Helper_Project_Roadmap\.md|backend/\.windsurf/rules/(database-schema-ownership|project-roadmap|security-standards)\.md' \
    $(cat "$TMPDIR_CHECK/windsurf_md.txt") 2>/dev/null
)
if [ -n "$obs_paths" ]; then
  while IFS= read -r m; do
    [ -n "$m" ] && fail "$m references an obsolete rule/skill path"
  done <<<"$obs_paths"
else
  pass "No obsolete rule/skill paths found"
fi

echo ""
echo "== 14. Backend Contract Inventory wiring (existence + exact-path references) =="
INVENTORY_PATH="docs/frontend/integration/BACKEND_CONTRACT_INVENTORY.md"
if [ -f "$INVENTORY_PATH" ]; then
  pass "$INVENTORY_PATH exists"
else
  fail "$INVENTORY_PATH not found"
fi
if [ -f AGENTS.md ] && grep -qF "$INVENTORY_PATH" AGENTS.md; then
  pass "AGENTS.md references $INVENTORY_PATH"
else
  fail "AGENTS.md does not reference $INVENTORY_PATH"
fi
if [ -f frontend/AGENTS.md ] && grep -qF "$INVENTORY_PATH" frontend/AGENTS.md; then
  pass "frontend/AGENTS.md references $INVENTORY_PATH"
else
  fail "frontend/AGENTS.md does not reference $INVENTORY_PATH"
fi
if [ -f .windsurf/rules/documentation-sync.md ] && grep -qF "$INVENTORY_PATH" .windsurf/rules/documentation-sync.md; then
  pass ".windsurf/rules/documentation-sync.md references $INVENTORY_PATH"
else
  fail ".windsurf/rules/documentation-sync.md does not reference $INVENTORY_PATH"
fi
if [ -f .agents/guidance/documentation-sync.md ] && grep -qF "$INVENTORY_PATH" .agents/guidance/documentation-sync.md; then
  pass ".agents/guidance/documentation-sync.md references $INVENTORY_PATH"
else
  fail ".agents/guidance/documentation-sync.md does not reference $INVENTORY_PATH"
fi

echo ""
echo "== 15. Frontend Integration Map wiring (existence + exact-path references) =="
MAP_PATH="docs/frontend/integration/FRONTEND_INTEGRATION_MAP.md"
if [ -f "$MAP_PATH" ]; then
  pass "$MAP_PATH exists"
else
  fail "$MAP_PATH not found"
fi
if [ -f AGENTS.md ] && grep -qF "$MAP_PATH" AGENTS.md; then
  pass "AGENTS.md references $MAP_PATH"
else
  fail "AGENTS.md does not reference $MAP_PATH"
fi
if [ -f frontend/AGENTS.md ] && grep -qF "$MAP_PATH" frontend/AGENTS.md; then
  pass "frontend/AGENTS.md references $MAP_PATH"
else
  fail "frontend/AGENTS.md does not reference $MAP_PATH"
fi
if [ -f .windsurf/rules/documentation-sync.md ] && grep -qF "$MAP_PATH" .windsurf/rules/documentation-sync.md; then
  pass ".windsurf/rules/documentation-sync.md references $MAP_PATH"
else
  fail ".windsurf/rules/documentation-sync.md does not reference $MAP_PATH"
fi
if [ -f .agents/guidance/documentation-sync.md ] && grep -qF "$MAP_PATH" .agents/guidance/documentation-sync.md; then
  pass ".agents/guidance/documentation-sync.md references $MAP_PATH"
else
  fail ".agents/guidance/documentation-sync.md does not reference $MAP_PATH"
fi

echo ""
echo "== 16. Codex AGENTS.override.md routing =="
override_ok=1
for override in AGENTS.override.md backend/AGENTS.override.md frontend/AGENTS.override.md; do
  if [ -f "$override" ]; then
    pass "$override exists"
  else
    fail "$override not found"
    override_ok=0
  fi
done

check_override_ref() {
  local owner="$1"
  local target="$2"
  if [ -f "$owner" ] && grep -qF "$target" "$owner"; then
    return 0
  fi
  fail "$owner does not route to $target"
  override_ok=0
}

check_override_ref AGENTS.override.md 'AGENTS.md'
check_override_ref AGENTS.override.md 'backend/AGENTS.md'
check_override_ref AGENTS.override.md 'backend/AGENTS.override.md'
check_override_ref AGENTS.override.md 'frontend/AGENTS.md'
check_override_ref AGENTS.override.md 'frontend/AGENTS.override.md'
check_override_ref AGENTS.override.md '.agents/guidance/documentation-sync.md'
check_override_ref AGENTS.override.md '.agents/skills/database/SKILL.md'
check_override_ref AGENTS.override.md '.agents/skills/testing/SKILL.md'
check_override_ref AGENTS.override.md '.agents/skills/design-decision/SKILL.md'
check_override_ref AGENTS.override.md '.agents/skills/pre-commit-review/SKILL.md'
check_override_ref AGENTS.override.md '.agents/skills/ai-infrastructure-review/SKILL.md'
check_override_ref AGENTS.override.md 'docs/roadmap/current-sprint.md'

check_override_ref backend/AGENTS.override.md 'backend/AGENTS.md'
check_override_ref backend/AGENTS.override.md '.agents/guidance/backend/entity-conventions.md'
check_override_ref backend/AGENTS.override.md '.agents/guidance/backend/liquibase-conventions.md'
check_override_ref backend/AGENTS.override.md '.agents/guidance/backend/mapstruct-conventions.md'
check_override_ref backend/AGENTS.override.md '.agents/guidance/backend/testing-conventions.md'
check_override_ref backend/AGENTS.override.md '.agents/skills/database/SKILL.md'
check_override_ref backend/AGENTS.override.md '.agents/skills/testing/SKILL.md'

check_override_ref frontend/AGENTS.override.md 'frontend/AGENTS.md'
check_override_ref frontend/AGENTS.override.md '.agents/guidance/frontend/fsd-conventions.md'
check_override_ref frontend/AGENTS.override.md '.agents/guidance/frontend/testing-conventions.md'
check_override_ref frontend/AGENTS.override.md '.agents/guidance/documentation-sync.md'
[ "$override_ok" -eq 1 ] && pass "Codex root and subtree overrides route to all required owners"

echo ""
echo "== 17. Codex guidance separation from Windsurf metadata =="
codex_guidance_ok=1
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if grep -qE '^(trigger|globs):' "$f"; then
    fail "$f contains Windsurf-only trigger/globs frontmatter"
    codex_guidance_ok=0
  fi
  if grep -qF '.windsurf/' "$f"; then
    fail "$f depends on a Windsurf instruction path"
    codex_guidance_ok=0
  fi
done <"$TMPDIR_CHECK/codex_guidance_md.txt"
[ "$codex_guidance_ok" -eq 1 ] && pass "Codex guidance has no Windsurf trigger/globs metadata or Windsurf-path dependency"

echo ""
echo "== 18. Windsurf to Codex functional coverage =="
coverage_ok=1
cat >"$TMPDIR_CHECK/coverage_map.txt" <<'COVERAGE_MAP'
.windsurf/rules/documentation-sync.md|.agents/guidance/documentation-sync.md
backend/.windsurf/rules/entity-conventions.md|.agents/guidance/backend/entity-conventions.md
backend/.windsurf/rules/liquibase-conventions.md|.agents/guidance/backend/liquibase-conventions.md
backend/.windsurf/rules/mapstruct-conventions.md|.agents/guidance/backend/mapstruct-conventions.md
backend/.windsurf/rules/testing-conventions.md|.agents/guidance/backend/testing-conventions.md
frontend/.windsurf/rules/fsd-conventions.md|.agents/guidance/frontend/fsd-conventions.md
frontend/.windsurf/rules/testing-conventions.md|.agents/guidance/frontend/testing-conventions.md
.windsurf/skills/database/SKILL.md|.agents/skills/database/SKILL.md
.windsurf/skills/database/references/foreign-keys-and-indexes.md|.agents/skills/database/references/foreign-keys-and-indexes.md
.windsurf/skills/database/references/schema-ownership.md|.agents/skills/database/references/schema-ownership.md
.windsurf/skills/database/references/timestamp-migrations.md|.agents/skills/database/references/timestamp-migrations.md
.windsurf/skills/testing/SKILL.md|.agents/skills/testing/SKILL.md
.windsurf/skills/testing/references/controller-tests.md|.agents/skills/testing/references/controller-tests.md
.windsurf/skills/testing/references/testcontainers.md|.agents/skills/testing/references/testcontainers.md
.windsurf/skills/testing/references/unit-tests.md|.agents/skills/testing/references/unit-tests.md
.windsurf/skills/create-design-note/SKILL.md|.agents/skills/design-decision/SKILL.md
.windsurf/workflows/pre-commit-review.md|.agents/skills/pre-commit-review/SKILL.md
.windsurf/workflows/ai-infrastructure-review.md|.agents/skills/ai-infrastructure-review/SKILL.md
COVERAGE_MAP

while IFS='|' read -r windsurf_owner codex_owner; do
  [ -z "$windsurf_owner" ] && continue
  if [ ! -f "$windsurf_owner" ]; then
    fail "Tracked Windsurf owner missing: $windsurf_owner"
    coverage_ok=0
  elif [ ! -f "$codex_owner" ]; then
    fail "$windsurf_owner has no Codex owner at $codex_owner"
    coverage_ok=0
  else
    pass "$windsurf_owner → $codex_owner"
  fi
done <"$TMPDIR_CHECK/coverage_map.txt"

while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
  */.windsurf/rules/*.md|*/.windsurf/skills/*/SKILL.md|*/.windsurf/skills/*/references/*.md|*/.windsurf/workflows/*.md)
    source_owner="${f#./}"
    if ! grep -qF "${source_owner}|" "$TMPDIR_CHECK/coverage_map.txt"; then
      fail "$source_owner is not tracked in the Windsurf to Codex coverage map"
      coverage_ok=0
    fi
    ;;
  esac
done <"$TMPDIR_CHECK/windsurf_md.txt"
[ "$coverage_ok" -eq 1 ] && pass "Every tracked Windsurf responsibility has a Codex owner path"

semantic_coverage_ok=1
check_semantic_clause() {
  local owner="$1"
  local pattern="$2"
  local label="$3"
  if [ -f "$owner" ] && grep -qiE "$pattern" "$owner"; then
    pass "$label"
  else
    fail "$owner is missing critical semantic coverage: $label"
    semantic_coverage_ok=0
  fi
}

check_semantic_clause .agents/skills/design-decision/SKILL.md 'references/feature-design-note\.md' 'Design-decision routes feature-note detail progressively'
check_semantic_clause .agents/skills/ai-infrastructure-review/SKILL.md 'auto-generated memory' 'Infrastructure review rejects memory as a source of truth'
check_semantic_clause .agents/skills/ai-infrastructure-review/SKILL.md 'full normative instruction' 'Infrastructure review prohibits same-platform normative duplication'
check_semantic_clause .agents/guidance/frontend/fsd-conventions.md '\.gitkeep.*initial scaffold' 'FSD guidance preserves the initial-scaffold .gitkeep exception'
check_semantic_clause .agents/guidance/backend/liquibase-conventions.md 'createIndex' 'Liquibase guidance requires an explicit index change when needed'
check_semantic_clause .agents/guidance/backend/entity-conventions.md 'defaults and update triggers' 'Entity guidance keeps technical timestamps database-managed'
check_semantic_clause .agents/skills/database/references/timestamp-migrations.md 'explicitly in the service' 'Timestamp guidance keeps business timestamps event-managed in services'
check_semantic_clause .agents/skills/testing/SKILL.md 'RestAssured' 'Testing routing preserves the planned Level 3 HTTP mechanism'
check_semantic_clause .agents/skills/testing/references/controller-tests.md 'AccessDeniedException' 'Controller testing distinguishes service ownership 403 behavior'
[ "$semantic_coverage_ok" -eq 1 ] && pass "Critical Windsurf-to-Codex semantic clauses are covered"

echo ""
echo "== 19. .codex/rules contains permissions only =="
codex_rules_ok=1
if [ ! -e .codex/rules ]; then
  pass ".codex/rules is absent; no shell permission policy is currently required"
elif [ ! -d .codex/rules ]; then
  fail ".codex/rules exists but is not a directory"
  codex_rules_ok=0
else
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    case "$f" in
    *.rules) ;;
    *)
      fail "$f is not a Codex permission .rules file"
      codex_rules_ok=0
      continue
      ;;
    esac
    if [ ! -s "$f" ]; then
      fail "$f is empty"
      codex_rules_ok=0
    elif ! grep -qE '^[[:space:]]*prefix_rule[[:space:]]*\(' "$f"; then
      warn "$f has no prefix_rule permission entry; verify it with Codex execpolicy tooling"
    fi
    if grep -qiE '(FSD|testing conventions|entity conventions|documentation sync|roadmap|architecture conventions)' "$f"; then
      fail "$f contains project guidance; move it to AGENTS.override.md, .agents/guidance, or .agents/skills"
      codex_rules_ok=0
    fi
  done < <(find .codex/rules -type f 2>/dev/null | sort)
  [ "$codex_rules_ok" -eq 1 ] && pass ".codex/rules contains only shell permission rules"
fi

echo ""
echo "== 20. Codex skill independence and progressive references =="
codex_skill_independence_ok=1
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
  ./.agents/skills/ai-infrastructure-review/SKILL.md) continue ;;
  esac
  if grep -qF '.windsurf/' "$f"; then
    fail "$f depends on a Windsurf instruction path"
    codex_skill_independence_ok=0
  fi
done <"$TMPDIR_CHECK/codex_skills_md.txt"
[ "$codex_skill_independence_ok" -eq 1 ] && pass "Codex skills are independent of Windsurf instructions; the infrastructure review keeps only its explicit comparison boundary"

codex_reference_routing_ok=1
while IFS= read -r f; do
  [ -z "$f" ] && continue
  skill_root=$(dirname "$(dirname "$f")")
  ref_path="${f#"$skill_root"/}"
  if [ -f "$skill_root/SKILL.md" ] && grep -qF "$ref_path" "$skill_root/SKILL.md"; then
    pass "$f is routed from its parent SKILL.md"
  else
    fail "$f is not routed from its parent SKILL.md"
    codex_reference_routing_ok=0
  fi
done < <(find .agents/skills -path '*/references/*.md' -type f 2>/dev/null | sort)

if grep -qF 'references/' AGENTS.override.md backend/AGENTS.override.md frontend/AGENTS.override.md 2>/dev/null; then
  fail "An AGENTS.override.md routes directly to a deep skill reference; route through the parent skill instead"
  codex_reference_routing_ok=0
else
  pass "AGENTS overrides do not auto-route deep skill references"
fi
[ "$codex_reference_routing_ok" -eq 1 ] && pass "Codex deep references remain progressively disclosed"

echo ""
echo "== 21. Codex context token estimates (approximate: 4 bytes/token) =="
root_override_bytes=$(wc -c <AGENTS.override.md | tr -d ' ')
root_agents_bytes=$(wc -c <AGENTS.md | tr -d ' ')
backend_override_bytes=$(wc -c <backend/AGENTS.override.md | tr -d ' ')
backend_agents_bytes=$(awk 'BEGIN { active=0 } /^## Hard gates/ { active=1 } active && /^## / && $0 !~ /^## Hard gates/ { exit } active { print }' backend/AGENTS.md | wc -c | tr -d ' ')
frontend_override_bytes=$(wc -c <frontend/AGENTS.override.md | tr -d ' ')
frontend_agents_bytes=$(awk 'BEGIN { active=0 } /^## Hard gates/ { active=1 } active && /^## / && $0 !~ /^## Hard gates/ { exit } active { print }' frontend/AGENTS.md | wc -c | tr -d ' ')
skill_catalog_bytes=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  name=$(grep '^name:' "$f" | head -1 | sed 's/^name: *//')
  description=$(grep '^description:' "$f" | head -1 | sed 's/^description: *//')
  catalog_entry="$name $description ${f#./}"
  skill_catalog_bytes=$((skill_catalog_bytes + ${#catalog_entry} + 1))
done < <(find .agents/skills -mindepth 2 -maxdepth 2 -name SKILL.md 2>/dev/null | sort)

root_discovery_bytes=$((root_override_bytes + skill_catalog_bytes))
shared_task_bytes=$((root_discovery_bytes + root_agents_bytes))
backend_task_bytes=$((shared_task_bytes + backend_override_bytes + backend_agents_bytes))
frontend_task_bytes=$((shared_task_bytes + frontend_override_bytes + frontend_agents_bytes))
optional_codex_bytes=$(cat "$TMPDIR_CHECK/codex_md.txt" | xargs wc -c 2>/dev/null | tail -1 | awk '{print $1}')
optional_codex_bytes=${optional_codex_bytes:-0}

pass "Root discovery metadata: ~$(approx_tokens "$root_discovery_bytes") tokens (${root_override_bytes} override bytes + ${skill_catalog_bytes} skill-catalog bytes)"
pass "Shared task after the required one-time AGENTS.md read: ~$(approx_tokens "$shared_task_bytes") tokens"
pass "Backend hard-gate routing baseline before task-specific guidance: ~$(approx_tokens "$backend_task_bytes") tokens"
pass "Frontend hard-gate routing baseline before task-specific workflow/guidance: ~$(approx_tokens "$frontend_task_bytes") tokens"
pass "All Codex guidance/skill bodies stored: ~$(approx_tokens "$optional_codex_bytes") tokens; progressive routing should load only selected files"

echo ""
echo "================================"
echo "FAIL: $FAIL   WARN: $WARN"
if [ "$FAIL" -gt 0 ]; then
  echo "Result: FAILED — fix the FAIL items above before committing infra changes."
  exit 1
else
  echo "Result: PASSED (warnings do not block)."
  exit 0
fi
