#!/usr/bin/env bash
set -euo pipefail
# Log a stage event using hub scripts/log_event.py
MSG="$1"
STATUS="${2:-pass}"
LOG_HELPER="${LOG_HELPER:-../scripts/log_event.py}"
CONTEXT="${3:-{} }"
if [[ ! -f "$LOG_HELPER" ]]; then
  echo "Log helper not found: $LOG_HELPER" >&2
  exit 1
fi
python "$LOG_HELPER" --type stage --status "$STATUS" --message "$MSG" --context "$CONTEXT"
