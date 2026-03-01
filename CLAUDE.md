# RetireView

Personal retirement readiness dashboard — "Am I on track to retire?"

## Stack
- Next.js 15 (App Router, TypeScript strict)
- Supabase PostgreSQL + Drizzle ORM (postgres-js driver)
- Tailwind CSS + shadcn/ui
- Recharts (charts)
- Vitest (testing)

## Commands
- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript strict check
- `npm test` — Vitest
- `npm run db:push` — push Drizzle schema to Supabase PostgreSQL
- `npm run db:studio` — Drizzle Studio GUI

## File Organization
```
src/app/(dashboard)/     — pages (home, net-worth, contributions, settings)
src/components/ui/       — shadcn/ui (don't modify)
src/components/layout/   — sidebar, page-header
src/components/charts/   — Recharts wrappers
src/components/forms/    — input forms
src/lib/db/              — Drizzle schema + connection + queries
src/lib/calculations/    — financial math (MUST be tested)
src/lib/parsers/         — PDF parsing (MUST be tested)
src/lib/utils/           — formatCurrency, formatDate
src/types/               — shared TypeScript types
```

## Code Rules
- No `any` types — use `unknown` + type guards
- Max 200 lines per file, 30 lines per function, 5 props per component
- Prefer server components; `"use client"` only when needed
- One component per file

## Financial Rules
- Money stored as integers (cents). Display: `formatCurrency(cents)`
- Gains = ending_balance - beginning_balance - contributions
- Retirement target = annual_spend / withdrawal_rate (default 0.04)
- Every calculation in `lib/calculations/` MUST have a `.test.ts` file

## Security
- No hardcoded secrets — use `.env.local` + `process.env`
- No `console.log` of financial data
- `DEFAULT_USER_ID = "default"` until auth (M4)

## Docs
- Planning: `docs/planning/`
- Review findings: `docs/review-findings.md`
- Decisions: `docs/decisions/`
