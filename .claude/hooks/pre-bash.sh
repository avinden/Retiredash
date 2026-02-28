#!/bin/bash
# Pre-bash hook: intercepts commands before execution
# Primary purpose: gate git commits behind full review

# Only intercept git commit commands
if [[ ! "$CLAUDE_BASH_COMMAND" =~ ^git\ commit ]]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 1

echo ""
echo "=== PRE-COMMIT REVIEW GATE ==="
echo ""

ERRORS=""
WARNINGS=""
FINDINGS=""

# ── .env leak check ──
STAGED_ENV=$(git diff --cached --name-only | grep -E '\.env')
if [ -n "$STAGED_ENV" ]; then
  ERRORS+="ENV FILE STAGED FOR COMMIT: $STAGED_ENV\nRun: git reset HEAD $STAGED_ENV\n\n"
fi

# ── Check .gitignore includes .env ──
if ! grep -q '\.env' .gitignore 2>/dev/null; then
  ERRORS+=".gitignore does not include .env files!\n\n"
fi

# ── Scan staged files for secrets ──
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$')
for FILE in $STAGED_FILES; do
  SECRETS=$(grep -n -i \
    -e 'sk_live_\|sk_test_' \
    -e 'api[_-]key.*=.*["'"'"'][A-Za-z0-9]' \
    -e 'supabase.*service.*role.*=.*["'"'"']' \
    "$FILE" 2>/dev/null | grep -v 'process\.env\|NEXT_PUBLIC' | head -3)
  if [ -n "$SECRETS" ]; then
    ERRORS+="POSSIBLE SECRET in staged file $FILE:\n$SECRETS\n\n"
  fi
done

# ── Check that financial calculations have tests ──
STAGED_CALC_FILES=$(echo "$STAGED_FILES" | grep 'lib/calculations/')
if [ -n "$STAGED_CALC_FILES" ]; then
  for FILE in $STAGED_CALC_FILES; do
    if [[ ! "$FILE" =~ \.test\. ]]; then
      TEST_FILE="${FILE%.ts}.test.ts"
      if [ ! -f "$TEST_FILE" ]; then
        ERRORS+="FINANCIAL CODE WITHOUT TEST: $FILE has no test at $TEST_FILE\nFinancial calculations MUST have tests.\n\n"
      fi
    fi
  done
fi

# ── Check that parser files have tests ──
STAGED_PARSER_FILES=$(echo "$STAGED_FILES" | grep 'lib/parsers/')
if [ -n "$STAGED_PARSER_FILES" ]; then
  for FILE in $STAGED_PARSER_FILES; do
    if [[ ! "$FILE" =~ \.test\. ]]; then
      TEST_FILE="${FILE%.ts}.test.ts"
      if [ ! -f "$TEST_FILE" ]; then
        ERRORS+="PARSER CODE WITHOUT TEST: $FILE has no test at $TEST_FILE\nParsers MUST have tests.\n\n"
      fi
    fi
  done
fi

# ── Run full test suite ──
TEST_OUTPUT=$(npm test -- --run 2>&1)
TEST_EXIT=$?
if [ $TEST_EXIT -ne 0 ]; then
  ERRORS+="TEST SUITE FAILED — cannot commit:\n$(echo "$TEST_OUTPUT" | tail -15)\n\n"
fi

# ── Build check (full gate) ──
BUILD_OUTPUT=$(npm run build --silent 2>&1)
BUILD_EXIT=$?
if [ $BUILD_EXIT -ne 0 ]; then
  ERRORS+="BUILD FAILED — cannot commit:\n$(echo "$BUILD_OUTPUT" | tail -15)\n\n"
fi

# ── Scan for new "any" types in staged files ──
for FILE in $STAGED_FILES; do
  if [[ "$FILE" =~ \.(ts|tsx)$ ]]; then
    ANY_IN_DIFF=$(git diff --cached "$FILE" | grep '^+' | grep -v '^+++' | grep ': any\b\|<any>\|as any' | head -3)
    if [ -n "$ANY_IN_DIFF" ]; then
      WARNINGS+="New 'any' type added in $FILE:\n$ANY_IN_DIFF\n\n"
    fi
  fi
done

# ── Check for Supabase client imports outside lib/supabase/ ──
for FILE in $STAGED_FILES; do
  if [[ "$FILE" =~ \.(ts|tsx)$ && ! "$FILE" =~ lib/supabase ]]; then
    DIRECT_IMPORT=$(grep -n "from.*@supabase/\|createClient\|createBrowserClient\|createServerClient" "$FILE" 2>/dev/null | head -3)
    if [ -n "$DIRECT_IMPORT" ]; then
      FINDINGS+="FINDING: [Architecture] $FILE imports Supabase client directly\n"
      WARNINGS+="Direct Supabase import in $FILE (should go through lib/supabase/):\n$DIRECT_IMPORT\n\n"
    fi
  fi
done

# ── Check for console.log in staged files ──
for FILE in $STAGED_FILES; do
  if [[ "$FILE" =~ \.(ts|tsx)$ && ! "$FILE" =~ \.test\. ]]; then
    LOGS=$(git diff --cached "$FILE" | grep '^+' | grep -v '^+++' | grep 'console\.log' | head -3)
    if [ -n "$LOGS" ]; then
      WARNINGS+="console.log added in $FILE — remove before production\n"
    fi
  fi
done

# ── Log findings to docs/review-findings.md ──
if [ -n "$FINDINGS" ]; then
  FINDINGS_FILE="$CLAUDE_PROJECT_DIR/docs/review-findings.md"
  if [ -f "$FINDINGS_FILE" ]; then
    echo "" >> "$FINDINGS_FILE"
    echo "### $(date +%Y-%m-%d) — Pre-commit Review" >> "$FINDINGS_FILE"
    echo '```' >> "$FINDINGS_FILE"
    echo -e "$FINDINGS" >> "$FINDINGS_FILE"
    echo '```' >> "$FINDINGS_FILE"
  fi
fi

# ── Final output ──
if [ -n "$ERRORS" ]; then
  echo "COMMIT BLOCKED — fix these issues:"
  echo ""
  echo -e "$ERRORS"
  if [ -n "$WARNINGS" ]; then
    echo "Additionally:"
    echo -e "$WARNINGS"
  fi
  echo "==============================="
  exit 1
fi

if [ -n "$WARNINGS" ]; then
  echo "COMMIT ALLOWED with warnings:"
  echo ""
  echo -e "$WARNINGS"
fi

echo "All pre-commit checks passed."
echo "==============================="
exit 0
