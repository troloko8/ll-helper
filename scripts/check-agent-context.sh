#!/usr/bin/env bash
# check-agent-context.sh
#
# Validates the AI-agent infrastructure (AGENTS.md, .windsurf/**, docs/**) for
# staleness, broken links, oversized rules, missing/empty frontmatter,
# inconsistent DB/index declarations, and stale skill/rule assertions.
#
# Usage: ./scripts/check-agent-context.sh
# Run manually, or from the /pre-commit-review workflow.
set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT" || exit 1

FAIL=0
WARN=0

pass() { printf '  [OK]   %s\n' "$1"; }
warn() { printf '  [WARN] %s\n' "$1"; WARN=$((WARN + 1)); }
fail() { printf '  [FAIL] %s\n' "$1"; FAIL=$((FAIL + 1)); }

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

# Recursive discovery — no hardcoded directory list. Finds .windsurf/ at repo
# root, inside backend/, or any future nested location automatically.
find . -path '*/.windsurf/*' -name '*.md' "${FIND_EXCLUDE[@]}" 2>/dev/null | sort >"$TMPDIR_CHECK/windsurf_md.txt"
find . -iname 'AGENTS.md' "${FIND_EXCLUDE[@]}" 2>/dev/null | sort >"$TMPDIR_CHECK/agents_md.txt"
find ./docs -name '*.md' "${FIND_EXCLUDE[@]}" 2>/dev/null | sort >"$TMPDIR_CHECK/docs_md.txt"
find ./backend -maxdepth 1 -name '*.md' "${FIND_EXCLUDE[@]}" 2>/dev/null | sort >"$TMPDIR_CHECK/backend_md.txt"

# Deduplicate and sort so a file found by two discovery paths is checked once.
cat \
  "$TMPDIR_CHECK/windsurf_md.txt" \
  "$TMPDIR_CHECK/agents_md.txt" \
  "$TMPDIR_CHECK/docs_md.txt" \
  "$TMPDIR_CHECK/backend_md.txt" |
  sort -u >"$TMPDIR_CHECK/all_md.txt"

echo "== 1. Discovering AI-infrastructure files =="
echo "  Found $(wc -l <"$TMPDIR_CHECK/windsurf_md.txt" | tr -d ' ') files under **/.windsurf/**, $(wc -l <"$TMPDIR_CHECK/agents_md.txt" | tr -d ' ') AGENTS.md, $(wc -l <"$TMPDIR_CHECK/docs_md.txt" | tr -d ' ') under docs/"

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
echo "== 3. always_on + AGENTS.md total size (target: <= 5 KB) =="
always_on_total=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if grep -q '^trigger: always_on' "$f" 2>/dev/null; then
    size=$(wc -c <"$f" | tr -d ' ')
    always_on_total=$((always_on_total + size))
  fi
done <"$TMPDIR_CHECK/windsurf_md.txt"
while IFS= read -r f; do
  [ -z "$f" ] && continue
  size=$(wc -c <"$f" | tr -d ' ')
  always_on_total=$((always_on_total + size))
done <"$TMPDIR_CHECK/agents_md.txt"
if [ "$always_on_total" -gt 5120 ]; then
  warn "Combined always_on + AGENTS.md size is ${always_on_total} bytes (> 5 KB target)"
else
  pass "Combined always_on + AGENTS.md size is ${always_on_total} bytes (<= 5 KB target)"
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
echo "== 5. Rule/skill frontmatter validity =="
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
[ "$frontmatter_ok" -eq 1 ] && pass "All rules/skills have valid frontmatter"

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
  grep -rlE 'CardDesc|cardDesc|card_desc|Flyway|flyway' \
    ./docs ./backend/*.md ./AGENTS.md ./.windsurf ./backend/.windsurf 2>/dev/null \
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
echo "== 10. No static 'current project is Level X' assertions in skills/rules =="
# Skills and rules should not hardcode the current project level; it changes over time.
static_level=$(
  grep -ilE 'current (project|level) is Level [0-9]|project is Level [0-9]|we are at Level [0-9]' \
    $(cat "$TMPDIR_CHECK/windsurf_md.txt") 2>/dev/null \
  | grep -vE '(current-sprint|changelog|backlog|roadmap)\.md$' || true
)
if [ -n "$static_level" ]; then
  while IFS= read -r m; do
    [ -n "$m" ] && warn "$m contains a static 'current project is Level X' assertion"
  done <<<"$static_level"
else
  pass "No static level assertions in skills/rules"
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
echo "================================"
echo "FAIL: $FAIL   WARN: $WARN"
if [ "$FAIL" -gt 0 ]; then
  echo "Result: FAILED — fix the FAIL items above before committing infra changes."
  exit 1
else
  echo "Result: PASSED (warnings do not block)."
  exit 0
fi
