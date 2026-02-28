# RetireView — Hooks Infrastructure

*Rules that are enforced mechanically, not requested politely.*

---

## Philosophy

CLAUDE.md says "please do X." Hooks say "you literally cannot proceed without doing X."

This document defines every hook, what it catches, and how it fits into the feedback loop. The goal: Claude Code cannot commit bad code, skip reviews, or introduce rule violations without the system catching it automatically.

---

## Hook Architecture Overview

```
Claude Code writes/edits a file
    │
    ▼
┌─────────────────────────────┐
│  PostToolUse: Edit|Write    │  ← Runs after EVERY file change
│  • Auto-format (Prettier)   │
│  • File length check (<200) │
│  • "any" type scan          │
│  • Secrets scanner          │
└─────────────┬───────────────┘
              │
    Claude Code finishes a turn
              │
              ▼
┌─────────────────────────────┐
│  Stop Hook                  │  ← Runs every time Claude pauses
│  • Lint + Typecheck + Build │
│  • Financial test suite     │
│  • Console.log scanner      │
└─────────────┬───────────────┘
              │
    Claude Code tries to commit
              │
              ▼
┌─────────────────────────────┐
│  PreToolUse: Bash(git)      │  ← Runs before any git commit
│  • Full review checklist    │
│  • .env leak check          │
│  • Rule gap detection       │
│  • Append findings to log   │
└─────────────────────────────┘
```

---

## .claude/settings.json (Complete Configuration)

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Write(./.env)",
      "Write(./.env.*)",
      "Write(./secrets/**)",
      "Write(./.gitignore)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/post-edit.sh"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/pre-bash.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/stop-check.sh"
          }
        ]
      }
    ]
  }
}
```

---

## Hook Scripts

### 1. Post-Edit Hook (`.claude/hooks/post-edit.sh`)

*Runs after every single file write or edit. Fast checks only — this fires constantly.*

```bash
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
    ERRORS+="❌ FILE TOO LONG: $FILE is $LINE_COUNT lines (max 200). Split this file.\n"
  fi
fi

# ── TypeScript "any" type scan ──
if [[ "$FILE" =~ \.(ts|tsx)$ ]]; then
  # Match ": any" or "<any>" or "as any" but not inside comments
  ANY_COUNT=$(grep -n ': any\b\|<any>\|as any' "$FILE" 2>/dev/null | grep -v '^\s*//' | wc -l)
  if [ "$ANY_COUNT" -gt 0 ]; then
    ANY_LINES=$(grep -n ': any\b\|<any>\|as any' "$FILE" 2>/dev/null | grep -v '^\s*//' | head -5)
    ERRORS+="❌ FOUND 'any' TYPE in $FILE ($ANY_COUNT occurrences):\n$ANY_LINES\nUse a specific type or 'unknown' with type guards.\n"
  fi
fi

# ── Secrets scanner ──
if [[ "$FILE" =~ \.(ts|tsx|js|jsx)$ ]]; then
  # Look for hardcoded keys/secrets (common patterns)
  SECRETS=$(grep -n -i \
    -e 'sk_live_' \
    -e 'sk_test_' \
    -e 'api[_-]key.*=.*["\x27][A-Za-z0-9]' \
    -e 'password.*=.*["\x27][^"\x27]' \
    -e 'secret.*=.*["\x27][A-Za-z0-9]' \
    -e 'supabase.*service.*role' \
    "$FILE" 2>/dev/null | grep -v '\.env\|process\.env\|NEXT_PUBLIC' | head -5)
  if [ -n "$SECRETS" ]; then
    ERRORS+="🚨 POSSIBLE SECRET in $FILE:\n$SECRETS\nMove to .env.local and use process.env.\n"
  fi
fi

# ── Float currency check ──
if [[ "$FILE" =~ \.(ts|tsx)$ ]]; then
  # Look for suspicious float operations on money-related variables
  FLOAT_MONEY=$(grep -n -i \
    -e 'balance.*\/ ' \
    -e 'balance.*\* ' \
    -e 'amount.*\.\(toFixed\)' \
    -e 'parseFloat.*balance' \
    -e 'parseFloat.*amount' \
    "$FILE" 2>/dev/null | head -3)
  if [ -n "$FLOAT_MONEY" ]; then
    ERRORS+="⚠️  POSSIBLE FLOAT CURRENCY in $FILE:\n$FLOAT_MONEY\nMoney must be stored/calculated in cents (integers). Format to dollars only at display.\n"
  fi
fi

# ── Output errors ──
if [ -n "$ERRORS" ]; then
  echo ""
  echo "═══════════════════════════════════════"
  echo "  POST-EDIT CHECK FAILURES"
  echo "═══════════════════════════════════════"
  echo -e "$ERRORS"
  echo "Fix these before continuing."
  echo "═══════════════════════════════════════"
  exit 1
fi

exit 0
```

---

### 2. Stop Hook (`.claude/hooks/stop-check.sh`)

*Runs every time Claude Code pauses. Catches build failures and test regressions before they compound.*

```bash
#!/bin/bash
# Stop hook: runs every time Claude Code finishes a turn
# Medium-speed checks — build, lint, typecheck, critical tests

cd "$CLAUDE_PROJECT_DIR" || exit 0

ERRORS=""
WARNINGS=""

# ── Lint check ──
LINT_OUTPUT=$(npm run lint --silent 2>&1)
LINT_EXIT=$?
if [ $LINT_EXIT -ne 0 ]; then
  ERRORS+="❌ LINT FAILED:\n$(echo "$LINT_OUTPUT" | tail -15)\n\n"
fi

# ── TypeScript strict check ──
TS_OUTPUT=$(npm run typecheck --silent 2>&1)
TS_EXIT=$?
if [ $TS_EXIT -ne 0 ]; then
  ERRORS+="❌ TYPECHECK FAILED:\n$(echo "$TS_OUTPUT" | tail -15)\n\n"
fi

# ── Build check ──
BUILD_OUTPUT=$(npm run build --silent 2>&1)
BUILD_EXIT=$?
if [ $BUILD_EXIT -ne 0 ]; then
  ERRORS+="❌ BUILD FAILED:\n$(echo "$BUILD_OUTPUT" | tail -20)\n\n"
fi

# ── Run financial calculation tests (if they exist) ──
if [ -d "src/lib/calculations" ]; then
  TEST_OUTPUT=$(npx vitest run src/lib/calculations --reporter=verbose 2>&1)
  TEST_EXIT=$?
  if [ $TEST_EXIT -ne 0 ]; then
    ERRORS+="❌ FINANCIAL CALCULATION TESTS FAILED:\n$(echo "$TEST_OUTPUT" | tail -20)\n\n"
  fi
fi

# ── Run parser tests (if they exist) ──
if [ -d "src/lib/parsers" ]; then
  TEST_OUTPUT=$(npx vitest run src/lib/parsers --reporter=verbose 2>&1)
  TEST_EXIT=$?
  if [ $TEST_EXIT -ne 0 ]; then
    ERRORS+="❌ PARSER TESTS FAILED:\n$(echo "$TEST_OUTPUT" | tail -20)\n\n"
  fi
fi

# ── Console.log scanner (warning, not blocking) ──
LOG_COUNT=$(grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v ".test." | wc -l)
if [ "$LOG_COUNT" -gt 0 ]; then
  LOG_FILES=$(grep -rl "console\.log" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v ".test." | head -5)
  WARNINGS+="⚠️  Found $LOG_COUNT console.log statements (remove before production):\n$LOG_FILES\n\n"
fi

# ── Output ──
if [ -n "$ERRORS" ]; then
  echo ""
  echo "═══════════════════════════════════════"
  echo "  STOP CHECK FAILURES — FIX BEFORE CONTINUING"
  echo "═══════════════════════════════════════"
  echo -e "$ERRORS"
  if [ -n "$WARNINGS" ]; then
    echo -e "$WARNINGS"
  fi
  echo "═══════════════════════════════════════"
  exit 1
fi

if [ -n "$WARNINGS" ]; then
  echo ""
  echo "── Warnings (non-blocking) ──"
  echo -e "$WARNINGS"
fi

exit 0
```

---

### 3. Pre-Bash Hook (`.claude/hooks/pre-bash.sh`)

*Runs before any bash command. Intercepts git commits to enforce the full review checklist.*

```bash
#!/bin/bash
# Pre-bash hook: intercepts commands before execution
# Primary purpose: gate git commits behind full review

# Only intercept git commit commands
if [[ ! "$CLAUDE_BASH_COMMAND" =~ ^git\ commit ]]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 1

echo ""
echo "═══════════════════════════════════════"
echo "  PRE-COMMIT REVIEW GATE"
echo "═══════════════════════════════════════"
echo ""

ERRORS=""
WARNINGS=""
FINDINGS=""

# ── .env leak check ──
STAGED_ENV=$(git diff --cached --name-only | grep -E '\.env')
if [ -n "$STAGED_ENV" ]; then
  ERRORS+="🚨 .ENV FILE STAGED FOR COMMIT: $STAGED_ENV\nRun: git reset HEAD $STAGED_ENV\n\n"
fi

# ── Check .gitignore includes .env ──
if ! grep -q '\.env' .gitignore 2>/dev/null; then
  ERRORS+="🚨 .gitignore does not include .env files!\n\n"
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
    ERRORS+="🚨 POSSIBLE SECRET in staged file $FILE:\n$SECRETS\n\n"
  fi
done

# ── Check that financial calculations have tests ──
STAGED_CALC_FILES=$(echo "$STAGED_FILES" | grep 'lib/calculations/')
if [ -n "$STAGED_CALC_FILES" ]; then
  for FILE in $STAGED_CALC_FILES; do
    if [[ ! "$FILE" =~ \.test\. ]]; then
      TEST_FILE="${FILE%.ts}.test.ts"
      if [ ! -f "$TEST_FILE" ]; then
        ERRORS+="❌ FINANCIAL CODE WITHOUT TEST: $FILE has no test at $TEST_FILE\nFinancial calculations MUST have tests.\n\n"
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
        ERRORS+="❌ PARSER CODE WITHOUT TEST: $FILE has no test at $TEST_FILE\nParsers MUST have tests.\n\n"
      fi
    fi
  done
fi

# ── Run full test suite ──
TEST_OUTPUT=$(npm test -- --run 2>&1)
TEST_EXIT=$?
if [ $TEST_EXIT -ne 0 ]; then
  ERRORS+="❌ TEST SUITE FAILED — cannot commit:\n$(echo "$TEST_OUTPUT" | tail -15)\n\n"
fi

# ── Build check (final gate) ──
BUILD_OUTPUT=$(npm run build --silent 2>&1)
BUILD_EXIT=$?
if [ $BUILD_EXIT -ne 0 ]; then
  ERRORS+="❌ BUILD FAILED — cannot commit:\n$(echo "$BUILD_OUTPUT" | tail -15)\n\n"
fi

# ── Scan for new "any" types in staged files ──
for FILE in $STAGED_FILES; do
  if [[ "$FILE" =~ \.(ts|tsx)$ ]]; then
    ANY_IN_DIFF=$(git diff --cached "$FILE" | grep '^+' | grep -v '^+++' | grep ': any\b\|<any>\|as any' | head -3)
    if [ -n "$ANY_IN_DIFF" ]; then
      WARNINGS+="⚠️  New 'any' type added in $FILE:\n$ANY_IN_DIFF\n\n"
    fi
  fi
done

# ── Check for Supabase client imports outside lib/supabase/ ──
for FILE in $STAGED_FILES; do
  if [[ "$FILE" =~ \.(ts|tsx)$ && ! "$FILE" =~ lib/supabase ]]; then
    DIRECT_IMPORT=$(grep -n "from.*@supabase/\|createClient\|createBrowserClient\|createServerClient" "$FILE" 2>/dev/null | head -3)
    if [ -n "$DIRECT_IMPORT" ]; then
      FINDINGS+="FINDING: [Architecture] $FILE imports Supabase client directly instead of through lib/supabase/\n"
      FINDINGS+="SUGGESTION: Move query to lib/supabase/queries/ and import from there\n"
      FINDINGS+="RULE_GAP: No — this is covered but was violated\n\n"
      WARNINGS+="⚠️  Direct Supabase import in $FILE (should go through lib/supabase/):\n$DIRECT_IMPORT\n\n"
    fi
  fi
done

# ── Check for console.log in staged files ──
for FILE in $STAGED_FILES; do
  if [[ "$FILE" =~ \.(ts|tsx)$ && ! "$FILE" =~ \.test\. ]]; then
    LOGS=$(git diff --cached "$FILE" | grep '^+' | grep -v '^+++' | grep 'console\.log' | head -3)
    if [ -n "$LOGS" ]; then
      WARNINGS+="⚠️  console.log added in $FILE — remove before production\n"
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
  echo "═══════════════════════════════════════"
  exit 1
fi

if [ -n "$WARNINGS" ]; then
  echo "COMMIT ALLOWED with warnings:"
  echo ""
  echo -e "$WARNINGS"
fi

echo "✅ All pre-commit checks passed."
echo "═══════════════════════════════════════"
exit 0
```

---

## The Self-Improving Feedback Loop (Mechanized)

The pre-bash hook doesn't just block bad commits — it **automatically appends findings** to `docs/review-findings.md`. Here's how the full loop works without relying on anyone remembering to do it:

```
Step 1: Hook catches violation
  → Blocks commit (if error) or warns (if non-blocking)
  → Auto-appends to docs/review-findings.md

Step 2: You see findings during normal workflow
  → "Hey Claude, check docs/review-findings.md and suggest 
     any new rules for CLAUDE.md"

Step 3: Claude proposes CLAUDE.md updates
  → You approve or reject
  → Approved rules go into CLAUDE.md AND into hook scripts

Step 4: Next session has stronger enforcement
  → Hook catches the new category automatically
  → The same class of mistake can never be committed again
```

**What makes this mechanical, not aspirational:**
- Findings are written to a file by the hook script, not by Claude remembering
- The file is version-controlled so findings can't be lost
- You don't need to run a special review command — it happens on every commit
- New rules become new hook checks, not just new CLAUDE.md instructions

---

## Permission Denials (Defense in Depth)

Hooks catch mistakes. Permissions prevent entire categories of mistakes from being possible.

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Write(./.env)",
      "Write(./.env.*)",  
      "Write(./secrets/**)",
      "Write(./.gitignore)",
      "Write(./supabase/migrations/**)"
    ]
  }
}
```

**Why each denial:**
- `.env` files: Claude should never read or write secrets directly. You set these manually.
- `secrets/`: Same rationale, broader scope.
- `.gitignore`: Prevents accidental removal of .env from ignore list.
- `supabase/migrations/`: Migrations should be created through Supabase CLI, not hand-written. Prevents Claude from generating migration files that could corrupt your schema.

---

## Hook Installation Checklist

When setting up the repo for the first time:

```bash
# 1. Create hook directories
mkdir -p .claude/hooks
mkdir -p docs

# 2. Copy hook scripts
# (post-edit.sh, stop-check.sh, pre-bash.sh go in .claude/hooks/)

# 3. Make hooks executable
chmod +x .claude/hooks/*.sh

# 4. Create settings.json
# (copy the .claude/settings.json from this document)

# 5. Create findings log
echo "# Review Findings Log" > docs/review-findings.md
echo "" >> docs/review-findings.md
echo "| Date | Finding | Suggested Rule | Status | Notes |" >> docs/review-findings.md
echo "|------|---------|---------------|--------|-------|" >> docs/review-findings.md

# 6. Verify hooks work
echo "console.log('test')" > /tmp/test.ts
# Should trigger post-edit warnings
```

---

## What Each Layer Catches (Summary)

| Problem | Post-Edit | Stop | Pre-Commit | Permission |
|---------|:---------:|:----:|:----------:|:----------:|
| Code formatting | ✅ auto-fix | | | |
| File too long (>200 lines) | ✅ block | | | |
| `any` TypeScript type | ✅ block | | ✅ warn | |
| Hardcoded secrets | ✅ block | | ✅ block | |
| Float currency math | ✅ warn | | | |
| Lint errors | | ✅ block | | |
| Type errors | | ✅ block | | |
| Build failures | | ✅ block | ✅ block | |
| Failed tests | | ✅ block | ✅ block | |
| console.log left in | | ✅ warn | ✅ warn | |
| .env staged for commit | | | ✅ block | |
| Missing test for calc | | | ✅ block | |
| Missing test for parser | | | ✅ block | |
| Direct Supabase import | | | ✅ finding | |
| Reading .env files | | | | ✅ deny |
| Writing to migrations | | | | ✅ deny |
| Modifying .gitignore | | | | ✅ deny |

Four layers. Each catches what the others miss. None rely on CLAUDE.md being followed.
