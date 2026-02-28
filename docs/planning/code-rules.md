# RetireView — Code Rules (Refined)

## TypeScript
- Strict mode, no exceptions
- No `any` types — use `unknown` + type guards
- All function parameters and return types explicitly typed

## File Organization
- Max 200 lines per file
- Max 30 lines per function
- Max 5 props per component
- One component per file
- Co-locate tests: `*.test.ts` next to source

## Naming
- Components: PascalCase (`RetirementGauge.tsx`)
- Utilities: camelCase (`calculateRetirementTarget.ts`)
- Types: PascalCase (`AccountSnapshot`, `RetirementSettings`)
- DB columns: snake_case
- Env vars: `NEXT_PUBLIC_` prefix only for client-safe values

## Architecture
- Prefer server components; `"use client"` only for interactivity
- No state management library (React state + server components)
- DB queries go through `lib/db/queries/` (later `lib/supabase/queries/`)
- Don't modify `components/ui/` (shadcn/ui generated)

## Financial Rules
- Money as integers (cents). Format only at display layer
- Dates as ISO 8601 strings (YYYY-MM-DD)
- 4% rule: `target = annual_spend / withdrawal_rate`
- Gains: `gains = end_balance - start_balance - contributions`
- Every calculation in `lib/calculations/` MUST have tests

## Security
- No hardcoded secrets
- No console.log of financial data
- .env.local in .gitignore (always verify)
- Validate/sanitize user input before DB writes

## Testing
- MUST test: calculations, parsers, data transformations, edge cases
- NOT tested: UI components, CRUD operations, form rendering, styles
- Framework: Vitest with jsdom environment
