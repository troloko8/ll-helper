#!/usr/bin/env bash
# Full local quality gate. Run with: bash scripts/check-all.sh
set -Eeuo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

stage='preflight'
trap 'printf "\nFAIL: %s. Remaining checks were not run.\n" "$stage" >&2' ERR

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

run_stage() {
  stage="$1"
  shift
  printf '\n== %s ==\n' "$stage"
  "$@"
}

[[ "$#" -eq 0 ]] || fail 'Usage: bash scripts/check-all.sh (no skip options)'
for command_name in git node npm java docker; do
  command -v "$command_name" >/dev/null 2>&1 || fail "Required command is missing: $command_name"
done

expected_node_major="$(tr -d '[:space:]' < frontend/.node-version)"
actual_node_major="$(node -p 'process.versions.node.split(".")[0]')"
[[ "$actual_node_major" == "$expected_node_major" ]] ||
  fail "Node $expected_node_major is required; found $(node --version). Activate the project Node version first."

java_major="$(java -XshowSettings:properties -version 2>&1 | awk '$1 == "java.specification.version" { print $3 }')"
[[ "$java_major" == '21' ]] || fail "Java 21 is required (as in CI); found Java $java_major. Check JAVA_HOME and PATH."
docker info >/dev/null 2>&1 || fail 'Docker is unavailable. Start Docker and ensure this shell can access its daemon; backend Testcontainers and Nginx require it.'
printf 'Preflight passed: Node %s, Java %s, Docker available.\n' "$(node --version)" "$java_major"

run_stage 'Git whitespace (unstaged)' git diff --check
run_stage 'Git whitespace (staged)' git diff --cached --check

cd "$repo_root/frontend"
run_stage 'Frontend install' npm ci
run_stage 'Frontend format' npm run format:check
run_stage 'Frontend lint' npm run lint
run_stage 'Frontend tests' npm run test:run
run_stage 'Bundle checker tests' npm run test:bundle
run_stage 'Production build and bundle budgets' npm run build

cd "$repo_root/backend"
run_stage 'Backend verify' ./mvnw --batch-mode --no-transfer-progress verify

cd "$repo_root"
run_stage 'Agent context' bash scripts/check-agent-context.sh
run_stage 'Nginx config' bash deploy/check-nginx-config.sh

printf '\nPASS: all local quality checks completed.\n'
