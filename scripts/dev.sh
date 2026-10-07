#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$REPOSITORY_ROOT/backend"
FRONTEND_DIR="$REPOSITORY_ROOT/frontend"
BACKEND_ENV_FILE="${BACKEND_ENV_FILE:-$BACKEND_DIR/.env}"

BACKEND_PID=""
FRONTEND_PID=""

usage() {
    cat <<'EOF'
Usage: ./scripts/dev.sh

Starts the Spring Boot backend and Vite frontend together.

Environment:
    BACKEND_ENV_FILE  Backend environment file to load
                    (default: backend/.env)

Press Ctrl+C to stop both processes.
EOF
}

fail() {
    printf 'Error: %s\n' "$1" >&2
    exit 1
}

require_command() {
    command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

stop_process() {
    local pid="$1"

    if [[ -z "$pid" ]] || ! kill -0 "$pid" 2>/dev/null; then
        return
    fi

    if command -v pgrep >/dev/null 2>&1; then
        local child
        while IFS= read -r child; do
            [[ -n "$child" ]] && stop_process "$child"
        done < <(pgrep -P "$pid" 2>/dev/null || true)
    fi

    kill -TERM "$pid" 2>/dev/null || true
}

cleanup() {
    local exit_code=$?
    trap - EXIT INT TERM HUP

    if [[ -n "$BACKEND_PID" || -n "$FRONTEND_PID" ]]; then
        printf '\nStopping backend and frontend...\n'
    fi

    stop_process "$FRONTEND_PID"
    stop_process "$BACKEND_PID"
    wait "$FRONTEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true

    exit "$exit_code"
}

handle_signal() {
    exit 130
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
    usage
    exit 0
fi

if [[ $# -gt 0 ]]; then
    usage >&2
    exit 2
fi

require_command java
require_command npm

[[ -x "$BACKEND_DIR/mvnw" ]] || fail "Backend Maven wrapper is not executable"
[[ -d "$FRONTEND_DIR/node_modules" ]] || fail "Frontend dependencies are missing; run: cd frontend && npm install"
[[ -f "$BACKEND_ENV_FILE" ]] || fail "Backend environment file not found: $BACKEND_ENV_FILE"

set -a
# shellcheck disable=SC1090
source "$BACKEND_ENV_FILE"
set +a

missing_variables=()
for variable_name in DB_URL DB_USERNAME DB_PASSWORD JWT_SECRET; do
    if [[ -z "${!variable_name:-}" ]]; then
        missing_variables+=("$variable_name")
    fi
done

if [[ ${#missing_variables[@]} -gt 0 ]]; then
    fail "Missing backend environment variables: ${missing_variables[*]}"
fi

trap cleanup EXIT
trap handle_signal INT TERM HUP

printf 'Starting backend:  http://localhost:8080\n'
(
    cd "$BACKEND_DIR"
    exec ./mvnw spring-boot:run
) &
BACKEND_PID=$!

printf 'Starting frontend: http://localhost:5173\n'
(
    cd "$FRONTEND_DIR"
    exec npm run dev -- --host 127.0.0.1
) &
FRONTEND_PID=$!

printf 'Press Ctrl+C to stop both processes.\n\n'

while true; do
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        if wait "$BACKEND_PID"; then
            backend_status=0
        else
            backend_status=$?
        fi
        printf '\nBackend stopped (exit %s).\n' "$backend_status" >&2
        exit "$backend_status"
    fi

    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        if wait "$FRONTEND_PID"; then
            frontend_status=0
        else
            frontend_status=$?
        fi
        printf '\nFrontend stopped (exit %s).\n' "$frontend_status" >&2
        exit "$frontend_status"
    fi

    sleep 1
done
