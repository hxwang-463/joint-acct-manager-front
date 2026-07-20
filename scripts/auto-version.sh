#!/usr/bin/env bash
#
# Bumps the patch version unless it was already bumped by hand in this push.
#
# Usage: scripts/auto-version.sh <before-sha>
#
#   <before-sha>  The commit main pointed at before this push (github.event.before).
#                 Pass "" or the all-zero SHA when there is nothing to compare against.
#
# Writes `version=` and `bumped=` to $GITHUB_OUTPUT when running under Actions.
# Never commits or pushes — the caller decides what to do with the result.

set -euo pipefail

ZERO_SHA=0000000000000000000000000000000000000000
BEFORE="${1:-}"

pkg_version() {
  node -p "require('./package.json').version"
}

emit() {
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    printf 'version=%s\nbumped=%s\n' "$1" "$2" >> "$GITHUB_OUTPUT"
  fi
}

CURRENT=$(pkg_version)

# The version as it stood before this push. Empty means we cannot tell, in
# which case we leave the version alone rather than risk a spurious bump.
PREVIOUS=""
if [ -n "$BEFORE" ] && [ "$BEFORE" != "$ZERO_SHA" ] && git cat-file -e "${BEFORE}^{commit}" 2>/dev/null; then
  PREVIOUS=$(git show "${BEFORE}:package.json" 2>/dev/null \
    | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).version" 2>/dev/null || true)
fi

if [ -z "$PREVIOUS" ]; then
  echo "No comparable previous package.json (before='${BEFORE}'); leaving version at ${CURRENT}."
  emit "$CURRENT" false
  exit 0
fi

if [ "$PREVIOUS" != "$CURRENT" ]; then
  echo "Manual version bump detected (${PREVIOUS} -> ${CURRENT}); leaving it alone."
  emit "$CURRENT" false
  exit 0
fi

npm version patch --no-git-tag-version >/dev/null
BUMPED=$(pkg_version)
echo "Auto-bumped patch version: ${PREVIOUS} -> ${BUMPED}"
emit "$BUMPED" true
