#!/usr/bin/env bash
# Build step: the json-hbars-transform always writes plan/output.txt (it ignores -o).
# Publish that rendered artifact to the canonical, well-named location at project root.
# Part of `effortless build`; runs right after the JsonHbarsTransform step.
set -euo pipefail
cd "$(dirname "$0")"

SRC="output.txt"
DEST="../LEOPOLD_LOOPING_PLAN.md"

if [[ ! -f "$SRC" ]]; then
  echo "[publish-plan] ERROR: $SRC not found — did JsonHbarsTransform run first?" >&2
  exit 1
fi

cp "$SRC" "$DEST"
echo "[publish-plan] derived plan -> LEOPOLD_LOOPING_PLAN.md ($(wc -l < "$DEST" | tr -d ' ') lines)"
