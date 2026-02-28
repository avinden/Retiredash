#!/bin/bash
# Stop hook: runs every time Claude Code finishes a turn
# LIGHTER version — lint + typecheck only (no build)

cd "$CLAUDE_PROJECT_DIR" || exit 0

# Graceful exit if npm not available
if ! command -v npm &>/dev/null; then
  exit 0
fi

ERRORS=""
WARNINGS=""

# ── Lint check ──
LINT_OUTPUT=$(npm run lint --silent 2>&1)
LINT_EXIT=$?
if [ $LINT_EXIT -ne 0 ]; then
  ERRORS+="LINT FAILED:\n$(echo "$LINT_OUTPUT" | tail -15)\n\n"
fi

# ── TypeScript strict check ──
TS_OUTPUT=$(npm run typecheck --silent 2>&1)
TS_EXIT=$?
if [ $TS_EXIT -ne 0 ]; then
  ERRORS+="TYPECHECK FAILED:\n$(echo "$TS_OUTPUT" | tail -15)\n\n"
fi

# ── Run financial calculation tests (if they exist) ──
if ls src/lib/calculations/*.test.* 1>/dev/null 2>&1; then
  TEST_OUTPUT=$(npx vitest run src/lib/calculations --reporter=verbose 2>&1)
  TEST_EXIT=$?
  if [ $TEST_EXIT -ne 0 ]; then
    ERRORS+="FINANCIAL CALCULATION TESTS FAILED:\n$(echo "$TEST_OUTPUT" | tail -20)\n\n"
  fi
fi

# ── Run parser tests (if they exist) ──
if ls src/lib/parsers/*.test.* 1>/dev/null 2>&1; then
  TEST_OUTPUT=$(npx vitest run src/lib/parsers --reporter=verbose 2>&1)
  TEST_EXIT=$?
  if [ $TEST_EXIT -ne 0 ]; then
    ERRORS+="PARSER TESTS FAILED:\n$(echo "$TEST_OUTPUT" | tail -20)\n\n"
  fi
fi

# ── Console.log scanner (warning, not blocking) ──
LOG_COUNT=$(grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v ".test." | wc -l)
if [ "$LOG_COUNT" -gt 0 ]; then
  LOG_FILES=$(grep -rl "console\.log" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v ".test." | head -5)
  WARNINGS+="Found $LOG_COUNT console.log statements (remove before production):\n$LOG_FILES\n\n"
fi

# ── Output ──
if [ -n "$ERRORS" ]; then
  echo ""
  echo "=== STOP CHECK FAILURES — FIX BEFORE CONTINUING ==="
  echo -e "$ERRORS"
  if [ -n "$WARNINGS" ]; then
    echo -e "$WARNINGS"
  fi
  echo "===================================================="
  exit 1
fi

if [ -n "$WARNINGS" ]; then
  echo ""
  echo "-- Warnings (non-blocking) --"
  echo -e "$WARNINGS"
fi

exit 0
