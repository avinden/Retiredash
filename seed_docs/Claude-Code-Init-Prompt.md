# RetireView — Claude Code Initialization Prompt

*Copy-paste this into Claude Code to kick off the project. Run this AFTER the planning docs are committed to the repo.*

---

## The Prompt

```
I'm building RetireView — a personal retirement readiness dashboard. I'm a non-technical solo builder using you (Claude Code) to implement everything. I make product decisions, you write the code.

## First: Read the planning docs

Read all 3 files in the "planning notes/" directory carefully before doing anything:
1. MVP-Plan-Retirement-Dashboard.md — the full product plan
2. RetireView-Code-Rules-and-Review-Policies.md — code standards and review policies
3. RetireView-Hooks-Infrastructure.md — enforcement hooks

These are your source of truth. Do not deviate from them without asking me first.

## Your task: Initialize the project (Milestone 1)

Set up the complete project foundation. Here's exactly what I need:

### 1. Scaffold Next.js project
- Next.js 14+ with App Router
- TypeScript (strict mode)
- Tailwind CSS
- shadcn/ui (init with default config)
- Recharts (install, don't configure yet)
- Vitest for testing

### 2. Create the file structure from the code rules doc
```
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   └── api/
├── components/
│   ├── ui/
│   ├── charts/
│   └── forms/
├── lib/
│   ├── supabase/
│   ├── calculations/
│   ├── parsers/
│   └── utils/
├── types/
└── hooks/
```

### 3. Set up the hooks infrastructure
- Create .claude/settings.json with the full config from the hooks doc
- Create .claude/hooks/post-edit.sh, stop-check.sh, pre-bash.sh
- Make all hook scripts executable
- Create .claude/commands/review.md with the review checklist

### 4. Create CLAUDE.md
- Use the code rules doc Part 1 as the foundation
- Keep it under 60 lines — concise, not comprehensive
- Point to planning notes/ for detailed context

### 5. Set up supporting files
- .env.local.example with placeholder vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- .gitignore (Node, Next.js, .env*, .claude/ hooks output)
- docs/review-findings.md (empty template)
- docs/decisions/ directory with a README
- Prettier config (.prettierrc)
- ESLint config (Next.js defaults + strict TS)
- Vitest config
- tsconfig.json with strict: true

### 6. Create the Supabase schema file
- Create supabase/schema.sql with the full schema from the MVP plan:
  - accounts table
  - snapshots table
  - retirement_settings table
  - import_log table
- Include RLS policy templates (I'll run this manually in Supabase dashboard)
- All money columns as integer (cents)
- All dates as date type (not timestamp) for snapshot dates

### 7. Build the app shell
- Layout with sidebar navigation (Dashboard, Net Worth, Retirement, Settings)
- Empty page stubs for each route
- A simple "Welcome to RetireView" on the dashboard page
- Magic link auth flow (using Supabase Auth helpers for Next.js)
  - Login page
  - Auth callback route
  - Protected route middleware

### 8. Add npm scripts
- dev, build, lint, typecheck, test
- Make sure ALL scripts pass before you're done

## Rules for this session

- Tell me your plan before writing any code. Wait for my go-ahead.
- Commit after each logical chunk (scaffold, hooks, auth, shell) — not one giant commit.
- Run npm run build && npm run lint && npm run typecheck before each commit.
- If anything fails, fix it before moving on.
- Keep it simple. This is a foundation — we'll add features in later sessions.
- Do NOT start on Milestone 2 (retirement calculator, charts, etc.) — just the foundation.

## What I need from you before you start

1. Confirm you've read all 3 planning docs
2. Tell me your plan — what order you'll do things and roughly how many commits
3. Flag anything in the planning docs that seems wrong or conflicting
4. Wait for my approval before writing code
```

---

## What to do BEFORE pasting this prompt

1. **Commit the 3 planning docs** to the `planning notes/` folder in the repo
2. **Create a Supabase project** at [supabase.com](https://supabase.com):
   - New project → name it "retireview" → choose a region → set a database password
   - Go to Settings → API → copy the Project URL and anon/public key
   - You'll paste these into .env.local after Claude Code creates the file
3. **Create a Vercel project** (optional — can do after Milestone 1):
   - Connect to the GitHub repo
   - Add the Supabase env vars

## What to expect from Claude Code

1. It will read the planning docs (~1-2 minutes)
2. It will present a plan and ask for approval
3. It will scaffold in chunks, committing after each:
   - Commit 1: Next.js scaffold + configs
   - Commit 2: Hooks infrastructure + CLAUDE.md
   - Commit 3: File structure + supporting docs
   - Commit 4: Supabase schema + types
   - Commit 5: App shell + auth flow
4. Total time: ~15-20 minutes of Claude working, ~10 minutes of you reviewing/approving

## After Milestone 1 is done

Verify:
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] You can see the app at localhost:3000
- [ ] Login page appears (won't work until you add Supabase keys to .env.local)
- [ ] All hook scripts exist and are executable
- [ ] CLAUDE.md exists and is concise

Then move on to Milestone 2 (retirement calculator + manual data entry) in a fresh session with `/clear`.
