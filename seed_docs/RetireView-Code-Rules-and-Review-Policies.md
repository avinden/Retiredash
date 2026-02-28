# RetireView — Code Rules & Review Policies

*Infrastructure document for Claude Code development. This lives in the repo and evolves as the project matures.*

---

## Part 1: Code Rules (CLAUDE.md Foundation)

*These rules get embedded into CLAUDE.md and enforced via hooks. They are the non-negotiable standards for every line of code in this repo.*

### Project Identity

```
# RetireView

## Stack
- Framework: Next.js 14+ (App Router, TypeScript)
- Database: Supabase (PostgreSQL + Auth + RLS)
- Styling: Tailwind CSS + shadcn/ui
- Charts: Recharts
- Hosting: Vercel
- PDF Processing: pdf-parse + Claude API
- Data Sources: Copilot.money MCP, PDF import, manual entry

## Commands
- npm run dev — Start development server
- npm run build — Build for production (run before every commit)
- npm run lint — ESLint check
- npm run typecheck — TypeScript strict check
- npm test — Run test suite (Vitest)
```

### Code Standards

**TypeScript: strict mode, no exceptions.**
- No `any` types. Use `unknown` + type guards if truly needed.
- All function parameters and return types must be explicitly typed.
- Database types auto-generated from Supabase schema.

**File organization:**
```
src/
├── app/              # Next.js App Router pages
│   ├── (auth)/       # Auth-related routes
│   ├── (dashboard)/  # Main dashboard routes
│   └── api/          # API routes
├── components/
│   ├── ui/           # shadcn/ui components (don't modify)
│   ├── charts/       # Dashboard chart components
│   └── forms/        # Input forms
├── lib/
│   ├── supabase/     # Supabase client + typed queries
│   ├── calculations/ # Financial math (TESTED)
│   ├── parsers/      # PDF parsing logic (TESTED)
│   └── utils/        # Shared utilities
├── types/            # TypeScript type definitions
└── hooks/            # React custom hooks
```

**Naming conventions:**
- Components: PascalCase (`RetirementGauge.tsx`)
- Utilities/libs: camelCase (`calculateRetirementTarget.ts`)
- Types: PascalCase with suffix (`AccountSnapshot`, `RetirementSettings`)
- Database columns: snake_case (matches Supabase convention)
- Environment variables: NEXT_PUBLIC_ prefix only for client-safe values

**Simplicity rules:**
- No file exceeds 200 lines. If it does, split it.
- No component accepts more than 5 props. If it needs more, restructure.
- No function exceeds 30 lines. Extract helpers.
- One component per file. No exceptions.
- Prefer server components. Use "use client" only when interactivity requires it.
- No state management library. React state + server components + Supabase realtime is enough for this MVP.

### Security Rules (Non-Negotiable)

- **Never** hardcode API keys, passwords, or secrets in any file.
- **Never** log sensitive financial data (balances, account numbers) to console.
- **Never** expose Supabase service role key to the client.
- **Always** use parameterized queries (Supabase client handles this by default).
- **Always** validate and sanitize user input before database writes.
- **Always** use Row Level Security (RLS) on every Supabase table.
- `.env.local` is in `.gitignore`. Verify before every first commit.

### Financial Calculation Rules

- **All money values stored as integers (cents).** Never use floating point for currency. Display formatting converts cents → dollars at the UI layer only.
- **All dates stored as ISO 8601 strings** (YYYY-MM-DD). No timestamps for snapshot dates — we care about the day, not the second.
- **4% rule calculation:** `retirement_target = annual_spend_target / withdrawal_rate`. Default withdrawal rate is 0.04. User can adjust.
- **Gains calculation:** `gains = ending_balance - beginning_balance - contributions_during_period`. Never the other way around.
- **Every financial calculation must have a corresponding test.** No exceptions.

### Testing Policy (Selective, Not TDD)

**What MUST be tested:**
- All functions in `lib/calculations/` — retirement math, gains calculations, period aggregations (MoM, QoQ, YoY)
- All functions in `lib/parsers/` — PDF data extraction accuracy
- Data transformation functions — anything that maps raw data to the snapshot schema
- Edge cases: zero balances, negative gains (losses), missing data periods, division by zero

**What does NOT need tests:**
- UI components and layouts
- Supabase CRUD operations (trust the client library)
- Form rendering
- Styling and responsive behavior

**Test file convention:** `*.test.ts` co-located next to the source file.

**Test framework:** Vitest (fast, native TypeScript, works with Next.js)

---

## Part 2: Code Reviewer Policies

*These define how Claude Code should review its own work and how the review process feeds back into improving the code rules above.*

### Review Triggers

The code reviewer runs at two points:

1. **Pre-commit hook** — Automated checks (lint, typecheck, build, tests)
2. **End-of-milestone review** — Claude Code reviews the full milestone diff against these policies

### Automated Pre-Commit Checks

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$CLAUDE_FILE_PATH\" 2>/dev/null || true"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "cd $CLAUDE_PROJECT_DIR && npm run lint --silent && npm run typecheck --silent && npm run build --silent 2>&1 | tail -20"
          }
        ]
      }
    ]
  }
}
```

**What this does:**
- Every file edit gets auto-formatted by Prettier (no style debates)
- Every time Claude stops working, lint + typecheck + build all run automatically
- If any check fails, Claude sees the output and must fix before continuing

### Milestone Review Checklist

At the end of each milestone, before committing, Claude Code should review against this checklist. This can be invoked as a slash command (`/project:review`).

**`.claude/commands/review.md`:**

```markdown
Review the current git diff against these criteria. For each item, report PASS or FAIL with a one-line explanation.

## Security
- [ ] No secrets or API keys in code or comments
- [ ] .env.local is in .gitignore
- [ ] All Supabase tables have RLS policies
- [ ] No sensitive data logged to console
- [ ] User input validated before database writes

## Code Quality
- [ ] No files exceed 200 lines
- [ ] No components accept more than 5 props
- [ ] No functions exceed 30 lines
- [ ] No `any` types in TypeScript
- [ ] All new functions have explicit return types
- [ ] "use client" only where necessary

## Financial Accuracy
- [ ] Money stored as integers (cents), not floats
- [ ] All calculations in lib/calculations/ have tests
- [ ] Gains formula: gains = end_balance - start_balance - contributions
- [ ] 4% rule uses division by rate, not multiplication

## Architecture
- [ ] New files follow the directory convention in code rules
- [ ] No unnecessary dependencies added
- [ ] Server components preferred over client components
- [ ] No state management libraries introduced

## Data Integrity
- [ ] PDF parser shows confirmation UI before saving
- [ ] Import source tracked on every snapshot record
- [ ] Error handling present on all async operations
- [ ] Failed imports don't leave partial data

## FINDINGS LOG
For any FAIL items, also output them in this format:

FINDING: [Category] - [Brief description of issue]
SUGGESTION: [How to fix]
RULE_GAP: [Yes/No] - Is this a gap in the code rules that should be added?
```

### The Feedback Loop: How Review Improves Rules

This is the most important part. The review process is **not static** — it learns.

**How it works:**

1. **Reviewer finds an issue not covered by current rules**
   - Example: Claude Code puts a Supabase query directly in a component instead of in `lib/supabase/`
   - Reviewer flags it as `RULE_GAP: Yes`

2. **Issue gets logged to `docs/review-findings.md`**
   - This file is a running log of every RULE_GAP finding
   - Format: date, finding, suggested rule, status (pending/added/rejected)

3. **You decide whether to promote it to a code rule**
   - If yes: CLAUDE.md or this document gets updated with the new rule
   - If no: finding stays logged with rationale for why it was rejected

4. **Updated rules apply to all future sessions**
   - Next time Claude Code works on the project, the new rule is in CLAUDE.md
   - The same mistake won't happen again

**`docs/review-findings.md` template:**

```markdown
# Review Findings Log

| Date | Finding | Suggested Rule | Status | Notes |
|------|---------|---------------|--------|-------|
| | | | pending/added/rejected | |
```

**Example lifecycle:**

```
Session 3: Claude Code builds chart components
  → Review finds: Chart data fetched directly in component, 
    not through a data layer
  → RULE_GAP: Yes
  → Suggested rule: "All Supabase queries go through lib/supabase/queries/. 
    Components never import the Supabase client directly."
  
You review: "Good catch, add it."
  → CLAUDE.md updated with new rule
  → docs/review-findings.md entry marked "added"

Session 4: Claude Code builds MCP integration
  → New rule is in CLAUDE.md
  → Claude Code routes all data through lib/supabase/queries/
  → Same mistake never happens again
```

### Review Escalation

Not everything is auto-fixable. Some findings require your judgment:

**Claude Code fixes autonomously:**
- Formatting issues (handled by Prettier)
- Missing return types
- Files exceeding line limits (refactor/split)
- Missing error handling

**Claude Code flags for your review:**
- Security findings (any FAIL in the security section)
- Architectural decisions (new patterns not in the rules)
- Financial calculation mismatches (wrong math)
- New dependencies being added

**The rule:** If in doubt, flag it. Never silently fix a security or financial accuracy issue — the user needs to know it happened.

---

## Part 3: Infrastructure Setup Checklist

*Run through this before starting Milestone 1.*

### Repository Setup

- [ ] Initialize Git repo
- [ ] Create `.gitignore` (Node, Next.js, .env*, .claude/)
- [ ] Create `.env.local.example` with required vars (no real values)
- [ ] Create `CLAUDE.md` from Part 1 of this document
- [ ] Create `.claude/settings.json` with hooks from Part 2
- [ ] Create `.claude/commands/review.md` with review checklist
- [ ] Create `docs/review-findings.md` with empty template
- [ ] Create `docs/decisions/` directory for Architecture Decision Records

### Supabase Setup

- [ ] Create Supabase project
- [ ] Enable email/magic link auth
- [ ] Run initial schema migration (accounts, snapshots, retirement_settings, import_log)
- [ ] Enable RLS on all tables
- [ ] Create RLS policies (user can only read/write their own data)
- [ ] Generate TypeScript types from schema

### Vercel Setup

- [ ] Connect repo to Vercel
- [ ] Add environment variables (Supabase URL, anon key)
- [ ] Confirm deploy succeeds with empty Next.js app
- [ ] Set up preview deployments for branches

### Development Environment

- [ ] Node.js 18+ installed
- [ ] npm dependencies installed
- [ ] Prettier config (`.prettierrc`)
- [ ] ESLint config (Next.js defaults + strict TypeScript)
- [ ] Vitest config for test runner
- [ ] Confirm `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck` all pass

---

## Versioning This Document

This document is version-controlled alongside the code. When the feedback loop produces new rules:

1. Update the relevant section
2. Commit with message: `docs: update code rules — [brief description of new rule]`
3. The git history of this file IS the evolution of your project's standards

Over time, this document becomes a living record of every lesson learned from AI-generated code in this project.
