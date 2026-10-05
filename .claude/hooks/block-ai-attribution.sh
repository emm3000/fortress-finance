#!/usr/bin/env bash
command -v jq >/dev/null 2>&1 || exit 0

cmd=$(jq -r '.tool_input.command // empty' 2>/dev/null) || exit 0
[ -n "$cmd" ] || exit 0

if printf '%s' "$cmd" | grep -Eq '(^|[^[:alnum:]_-])git([[:space:]]+-C[[:space:]]+[^[:space:]]+)*[[:space:]]+commit([[:space:]]|$)|(^|[^[:alnum:]_-])gh[[:space:]]+pr[[:space:]]+(create|edit)([[:space:]]|$)'; then
  if printf '%s' "$cmd" | grep -Eiq 'co-authored-by' || printf '%s' "$cmd" | grep -Fq 'Generated with [Claude Code]'; then
    echo "Blocked: AI attribution is forbidden in this repo" >&2
    exit 2
  fi
fi

exit 0
