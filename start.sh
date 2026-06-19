#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

case "${1:-build}" in
  build) effortless build ;;
  *)
    echo "Usage: ./start.sh [build]" >&2
    echo "  build — regenerate RuleSpeak and other transpiler outputs (default)" >&2
    exit 1
    ;;
esac
