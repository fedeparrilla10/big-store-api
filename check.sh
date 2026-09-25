#!/usr/bin/env bash

set -o pipefail

LINT_COMMAND=()
TYPECHECK_COMMAND=(pnpm run typecheck)
TEST_COMMAND=(pnpm test)

if (( $# != 0 )); then
  printf '[FAIL] check.sh does not accept arguments\n' >&2
  exit 1
fi

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR" || exit 1

run_check() {
  local name="$1"
  shift

  if (( $# == 0 )); then
    return 0
  fi

  printf '[RUN] %s\n' "$name"
  if "$@"; then
    printf '[OK] %s\n' "$name"
    return 0
  fi

  printf '[FAIL] %s\n' "$name" >&2
  return 1
}

if (( ${#TEST_COMMAND[@]} == 0 )); then
  printf '[FAIL] The full test suite is not configured\n' >&2
  exit 1
fi

status=0
run_check "Linter" "${LINT_COMMAND[@]}" || status=1
run_check "Typecheck" "${TYPECHECK_COMMAND[@]}" || status=1
run_check "Tests" "${TEST_COMMAND[@]}" || status=1

exit "$status"
