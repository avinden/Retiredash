# RetireView — MVP Plan (Refined)

Personal retirement readiness dashboard: "Am I on track to retire?"

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router, TypeScript strict) |
| Database (dev) | SQLite + Drizzle ORM (`better-sqlite3`) |
| Database (prod) | Supabase PostgreSQL (Milestone 4) |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Auth | None (MVP) -> Supabase Auth (M4) |
| Hosting | Vercel (after Supabase) |
| Testing | Vitest |

## Data Model

All tables have `user_id` (text). Money stored as integer cents.
IDs are text (nanoid). Booleans are integer 0/1 (SQLite).

- **accounts**: id, user_id, name, type, institution, is_active, created_at
- **snapshots**: id, user_id, account_id (FK), date, balance, contributions, gains, source
- **retirement_settings**: id, user_id, annual_spend_target, withdrawal_rate (real), target_retirement_age, current_age, updated_at
- **import_log**: id, user_id, source, filename, imported_at, records_created, records_updated, status, error_details

## Key Formulas

- Retirement target = annual_spend_target / withdrawal_rate
- Gains = ending_balance - beginning_balance - contributions
- Monthly contribution needed = f(target, current_savings, years_to_retirement, return_rate)

## Milestones

1. **Foundation**: Scaffold, schema, layout, hooks
2. **Calculator + Manual Entry**: Settings, forms, retirement hero view
3. **Dashboard Charts**: Net worth, contributions vs gains, breakdowns
4. **Supabase Migration + Auth**: Replace SQLite, add auth, deploy
5. **PDF Import**: Upload, parse with Claude API, confirm, save

## Decisions

- Local-first with SQLite for dev (no Supabase dependency until M4)
- `calculated_target` computed app-side, not stored in DB
- `DEFAULT_USER_ID = "default"` until auth in M4
- Recharts locked in (was "Recharts or Tremor")
- No auth wall for MVP
