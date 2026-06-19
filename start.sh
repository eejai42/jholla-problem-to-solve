#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# /* effortless build is not necessary 
# case "${1:-build}" in
#   build) effortless build ;;
#   *)
#     echo "Usage: ./start.sh [build]" >&2
#     echo "  build — regenerate RuleSpeak and other transpiler outputs (default)" >&2
#     exit 1
#     ;;
# esac
# */

# stop backend and front end servers
# restart both on ports 6347 and 6348 respectively

# --- admin app (Loop 0.5+) -------------------------------------------------
# The case-intake admin app lives in admin-app/ (Express API + Vite client).
# It ships with the witnessed inference test harness, RED until each DAG node
# is surfaced. See admin-app/tests/README.md.
#   cd admin-app && npm install   # one-time
#   cd admin-app && npm test      # run the witnessed inference harness (RED today)
#   PORT=6348 cd admin-app && npm run server   # API on 6348
#   cd admin-app && npm run client             # Vite client (proxies /api -> API)