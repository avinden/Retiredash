#!/bin/bash
# Post-edit hook: runs after every file change
# Must be FAST — runs on every edit

FILE="$CLAUDE_FILE_PATH"

# Skip non-source files
if [[ ! "$FILE" =~ \.(ts|tsx|js|jsx|json|md)$ ]]; then
  exit 0
fi

ERRORS=""

# ── Auto-format with Prettier ──
if [[ "$FILE" =~ \.(ts|tsx|js|jsx|json)$ ]]; then
  npx prettier --write "$FILE" 2>/dev/null || true
fi

# ── File length check (max 200 lines) ──
if [[ -f "$FILE" && "$FILE" =~ \.(ts|tsx|js|jsx)$ ]]; then
  LINE_COUNT=$(wc -l < "$FILE")
  if [ "$LINE_COUNT" -gt 200 ]; then
    ERRORS+="FILE TOO LONG: $FILE is $LINE_COUNT lines (max 200). Split this file.\n"
  fi
fi

# ── TypeScript "any" type scan ──
if [[ "$FILE" =~ \.(ts|tsx)$ ]]; then
  ANY_COUNT=$(grep -n ': any\b\|<any>\|as any' "$FILE" 2>/dev/null | grep -v '^\s*//' | wc -l)
  if [ "$ANY_COUNT" -gt 0 ]; then
    ANY_LINES=$(grep -n ': any\b\|<any>\|as any' "$FILE" 2>/dev/null | grep -v '^\s*//' | head -5)
    ERRORS+="FOUND 'any' TYPE in $FILE ($ANY_COUNT occurrences):\n$ANY_LINES\nUse a specific type or 'unknown' with type guards.\n"
  fi
fi

# ── Secrets scanner ──
if [[ "$FILE" =~ \.(ts|tsx|js|jsx)$ ]]; then
  SECRETS=$(grep -n -i \
    -e 'sk_live_' \
    -e 'sk_test_' \
    -e 'api[_-]key.*=.*["'"'"'][A-Za-z0-9]' \
    -e 'password.*=.*["'"'"'][^"'"'"']' \
    -e 'secret.*=.*["'"'"'][A-Za-z0-9]' \
    -e 'supabase.*service.*role' \
    "$FILE" 2>/dev/null | grep -v '\.env\|process\.env\|NEXT_PUBLIC' | head -5)
  if [ -n "$SECRETS" ]; then
    ERRORS+="POSSIBLE SECRET in $FILE:\n$SECRETS\nMove to .env.local and use process.env.\n"
  fi
fi

# ── Float currency check ──
if [[ "$FILE" =~ \.(ts|tsx)$ ]]; then
  FLOAT_MONEY=$(grep -n -i \
    -e 'balance.*\/ ' \
    -e 'balance.*\* ' \
    -e 'amount.*\.\(toFixed\)' \
    -e 'parseFloat.*balance' \
    -e 'parseFloat.*amount' \
    "$FILE" 2>/dev/null | head -3)
  if [ -n "$FLOAT_MONEY" ]; then
    ERRORS+="POSSIBLE FLOAT CURRENCY in $FILE:\n$FLOAT_MONEY\nMoney must be stored/calculated in cents (integers). Format to dollars only at display.\n"
  fi
fi

# ── Output errors ──
if [ -n "$ERRORS" ]; then
  echo ""
  echo "=== POST-EDIT CHECK FAILURES ==="
  echo -e "$ERRORS"
  echo "Fix these before continuing."
  echo "==============================="
  exit 1
fi

exit 0
