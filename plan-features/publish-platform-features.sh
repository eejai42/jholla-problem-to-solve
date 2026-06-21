#!/usr/bin/env bash
# Build step: json-hbars-transform always writes ./output.txt (it ignores -o).
# Publish that rendered artifact to the canonical, well-named location at project root.
# Part of `effortless build`; runs right after the platform-features JsonHbarsTransform step.
#
# Unlike the Leopold plan, every Features row is published (no [DONE] pruning) — this is a
# full catalog of what the platform has / allows for, with challenge provenance on each row.
set -euo pipefail
cd "$(dirname "$0")"

SRC="output.txt"
DEST="../PLATFORM_FEATURES.md"

if [[ ! -f "$SRC" ]]; then
  echo "[publish-platform-features] ERROR: $SRC not found — did the JsonHbarsTransform run first?" >&2
  exit 1
fi

cp "$SRC" "$DEST"

echo "[publish-platform-features] derived catalog -> PLATFORM_FEATURES.md ($(wc -l < "$DEST" | tr -d ' ') lines)"
