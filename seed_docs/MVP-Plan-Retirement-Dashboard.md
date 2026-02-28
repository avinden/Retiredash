# RetireView — MVP Plan
### Personal Retirement Readiness Dashboard

*A financial dashboard that answers one question: "Am I on track to retire?"*

---

## Vision

A clean, modern dashboard that pulls your full financial picture together and shows — at a glance — how your net worth, savings contributions, and investment performance are trending toward your retirement goal. No spreadsheets, no guessing, no logging into six different accounts.

**MVP is for you.** Multi-user and monetization come later.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | Next.js 14+ (App Router) | React-based, server components for fast loads, great ecosystem |
| **Database** | Supabase (PostgreSQL) | Time-series queries for MoM/QoQ/YoY, built-in auth for later, row-level security, generous free tier |
| **Styling** | Tailwind CSS + shadcn/ui | Clean, consistent design system with minimal effort |
| **Charts** | Recharts or Tremor | Purpose-built for dashboards, React-native, handles time-series well |
| **Auth** | Supabase Auth (MVP: magic link) | Simple for solo use, scales to multi-user later |
| **Hosting** | Vercel | Zero-config Next.js deploys, free tier works for MVP |
| **Data Sources** | Copilot.money MCP + PDF import | Your existing financial data pipeline |

---

## Data Model (Core Tables)

```
accounts
├── id, name, type (checking/savings/investment/retirement/debt)
├── institution (e.g., "Fidelity", "Chase")
├── is_active
└── created_at

snapshots (point-in-time account balances)
├── id, account_id, date
├── balance (total value on that date)
├── contributions (money YOU put in during this period)
├── gains (market performance = balance change - contributions)
└── source (enum: "copilot_mcp" | "pdf_import" | "manual")

retirement_settings
├── id, user_id
├── annual_spend_target (what you want to spend per year in retirement)
├── withdrawal_rate (default: 4%, the "4% rule")
├── target_retirement_age
├── current_age
├── calculated_target (auto: annual_spend_target / withdrawal_rate)
└── updated_at

import_log
├── id, source, filename, imported_at
├── records_created, records_updated
└── status (success/partial/failed), error_details
```

**Key design decisions:**
- **Snapshots, not transactions.** For retirement tracking, you need balances over time — not every coffee purchase. This massively simplifies the data model.
- **Contributions vs. gains separated.** This is the core insight your dashboard provides: "How much did I save vs. how much did the market give me?"
- **Source tracking.** Know where every data point came from for debugging and trust.

---

## Dashboard Views (MVP)

### View 1: Retirement Readiness (Hero View)

**The first thing you see.** Answers: "Am I on track?"

**Components:**
- **Retirement target number** — Large, prominent display (annual spend ÷ 0.04)
  - Example: $80k/year spend → $2,000,000 target
- **Progress bar / gauge** — Current total savings vs. target
  - Color-coded: green (on track), yellow (behind), red (significantly behind)
- **Retirement countdown** — "X years, Y months to target at current pace"
  - Based on current savings rate + projected growth
- **Monthly contribution needed** — "To hit your target by age 65, save $X/month"

**Dashboard design principles applied:**
- Single most important metric (% to goal) is the largest element
- Supporting context (countdown, monthly target) surrounds it
- No clutter — this view answers ONE question

---

### View 2: Net Worth Over Time

**Trend view.** Answers: "Is my wealth growing?"

**Components:**
- **Line chart** — Total net worth over time
  - Toggle: MoM / QoQ / YoY views
  - Hover for exact values on any date
- **Summary cards row:**
  - Current net worth (large number)
  - Change this month ($X / +Y%)
  - Change this quarter
  - Change this year
- **Account breakdown** — Stacked area or grouped bar showing which accounts contribute to net worth
  - Retirement accounts, investment accounts, cash, minus debt

**Dashboard design principles applied:**
- Time-series as primary visual (line charts for trends)
- Period comparison via toggle, not separate charts
- Summary stats as "headline numbers" above the chart
- Debt shown as negative to give true net worth picture

---

### View 3: Contributions vs. Performance

**Attribution view.** Answers: "How much was me vs. the market?"

**Components:**
- **Stacked bar chart** — Monthly or quarterly view
  - Green bars: Your contributions (money you put in)
  - Blue bars: Investment gains/losses (market performance)
  - Net line: Total growth
- **Summary cards:**
  - Total contributed (lifetime)
  - Total gains (lifetime)
  - Gain ratio (e.g., "For every $1 you saved, the market added $0.47")
- **Performance by account type** — Simple table
  - Retirement accounts: contributed X, gained Y
  - Investment accounts: contributed X, gained Y

**Dashboard design principles applied:**
- Stacked bars make attribution instantly visual
- The "gain ratio" metric is memorable and motivating
- Account-level breakdown available but not primary focus

---

## Data Pipeline (MVP)

### Source 1: Copilot.money MCP

*Built separately — this plan assumes the MCP server exists and returns account data.*

**Expected data flow:**
1. Dashboard calls Copilot MCP on user request ("Sync now" button)
2. MCP returns current account balances and recent transactions
3. App processes into snapshots (balance, contributions, gains)
4. Stores in Supabase with `source: "copilot_mcp"`

**What we need from the MCP:**
- Account list with types and balances
- Transaction history (to calculate contributions vs. gains)
- Ideally: historical balance snapshots if available

### Source 2: PDF Import

**Supported statement types (MVP):**
- Brokerage statements (Fidelity, Schwab, Vanguard)
- Bank statements (Chase, BoA, major banks)

**Processing flow:**
1. User uploads PDF via dashboard
2. Server-side processing extracts text (pdf-parse or similar)
3. LLM-assisted parsing (Claude API) extracts:
   - Statement date
   - Account name and type
   - Ending balance
   - Contributions/deposits during period
   - Gains/losses during period
4. User confirms extracted data before saving
5. Stores in Supabase with `source: "pdf_import"`

**Why LLM parsing:** Financial statement formats vary wildly. Rule-based parsing would require templates per institution. An LLM can handle format variation with a well-crafted prompt + user confirmation as a safety net.

### Source 3: Manual Entry (Fallback)

Simple form to add a snapshot manually:
- Select account → Enter date → Enter balance → Enter contributions
- For accounts where PDF parsing fails or MCP doesn't cover

---

## Milestone Plan (Claude Code Pacing)

*Claude Code writes the code. Your time is spent reviewing, testing, and making decisions. Each milestone is roughly one focused session (1-3 hours of your time), not weeks.*

### Milestone 1: Foundation (Session 1 — ~1 hour of your time)
**Goal:** App runs, auth works, database exists, deployed

- [ ] Initialize Next.js project with TypeScript + Tailwind + shadcn/ui
- [ ] Set up Supabase project (database + auth)
- [ ] Create full database schema (accounts, snapshots, retirement_settings, import_log)
- [ ] Implement magic link auth
- [ ] Build layout shell (sidebar nav + main content area)
- [ ] Deploy to Vercel
- [ ] Set up Git repo with proper .gitignore (.env excluded)

**Your job:** Create Supabase project manually (2 min), grab API keys, test login, confirm deploy works

**Claude Code does:** Everything else in one session

---

### Milestone 2: Retirement Calculator + Manual Entry (Session 2 — ~1-2 hours)
**Goal:** Set goals, add data by hand, see retirement progress

- [ ] Settings page: annual spend target, current age, target retirement age
- [ ] 4% rule calculation (auto-compute retirement savings target)
- [ ] Retirement readiness hero view (progress gauge, target number, countdown)
- [ ] Manual account creation form
- [ ] Manual snapshot entry form (date, balance, contributions)
- [ ] Monthly contribution needed calculator

**Your job:** Enter your real retirement goals, add 2-3 accounts with a few months of manual data, verify the math is correct

---

### Milestone 3: Dashboard Charts (Session 3 — ~2 hours)
**Goal:** All three dashboard views working with your manual data

- [ ] Net worth over time line chart with MoM/QoQ/YoY toggle
- [ ] Summary stat cards (current net worth, period changes)
- [ ] Contributions vs. performance stacked bar chart
- [ ] Gain ratio calculation and display
- [ ] Account breakdown view
- [ ] Responsive layout (works on mobile)

**Your job:** This is the most design-iteration-heavy milestone. You'll look at the charts, say "make the bars wider" or "the YoY toggle isn't working right," and iterate. Budget extra time here — getting the dashboard *feeling* right matters.

---

### Milestone 4: Copilot MCP Integration (Session 4 — ~1-2 hours)
**Goal:** Pull real data from Copilot.money

- [ ] Integrate Copilot.money MCP client
- [ ] "Sync now" button on dashboard
- [ ] Map Copilot data → accounts + snapshots schema
- [ ] Handle sync errors gracefully
- [ ] Import log (show what was synced and when)

**Your job:** Test with your real Copilot data. Verify balances match what you see in Copilot. This is where data accuracy issues surface — budget time for debugging mappings.

**Depends on:** Copilot MCP being ready. If it's not, skip to Milestone 5 and come back.

---

### Milestone 5: PDF Statement Import (Session 5 — ~2-3 hours)
**Goal:** Upload statements and extract financial data

- [ ] PDF upload component
- [ ] Server-side text extraction
- [ ] Claude API integration for intelligent parsing
- [ ] Confirmation/correction UI (show extracted data before saving)
- [ ] Import history log

**Your job:** This is the most testing-intensive milestone. Upload real statements from different institutions, check that extracted numbers are correct, iterate on the parsing prompt. The LLM parsing will need prompt tuning based on your specific statement formats.

---

### Realistic Total Timeline

| Scenario | Your time | Calendar time |
|----------|-----------|---------------|
| **Focused sprint** (one session per day) | ~8-10 hours | ~5 days |
| **Evenings/weekends** (a few sessions per week) | ~8-10 hours | ~2 weeks |
| **Casual pace** (one session per week) | ~8-10 hours | ~5 weeks |

The bottleneck is never Claude Code's coding speed — it's your availability to test, make design decisions, and validate data accuracy. PDF parsing (Milestone 5) will likely need the most iteration.

---

## What's Explicitly NOT in the MVP

These are deferred intentionally — not forgotten:

| Feature | Why deferred | When to add |
|---------|-------------|-------------|
| Multi-user / auth flows | You're the only user for now | Before public launch |
| Stripe billing | No users to charge yet | When you have beta users |
| Spending vs. budget view | Not in your top 3 priorities | V2 |
| Savings rate tracking | Not in your top 3 priorities | V2 |
| Plaid integration | Copilot MCP covers this for now | When/if MCP is insufficient |
| Mobile app | Responsive web works for MVP | If user demand exists |
| Data export | Nice-to-have, not essential | V2 |
| Projections / Monte Carlo | Complex, needs good data first | V2 (after 3+ months of data) |
| Account linking (auto-sync) | Copilot MCP + PDF is enough | If manual sync is too painful |

---

## Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Copilot MCP data gaps** | Dashboard shows incomplete picture | Manual entry as fallback; PDF import covers gaps |
| **PDF parsing accuracy** | Wrong numbers in dashboard | Always show user confirmation step; never auto-save parsed data |
| **Contributions vs. gains calculation** | Core feature is wrong | Start with manual separation; validate against statements |
| **Scope creep** | Never ships | Milestones are small; ship each one; resist adding features |
| **Financial data security** | Data leak | Supabase RLS from day one; no client-side secrets; HTTPS only |

---

## Design Principles for the Dashboard

Following top dashboarding practices:

1. **One question per view** — Each dashboard view answers exactly one question
2. **Headline numbers first** — Large, scannable metrics before charts
3. **Progressive disclosure** — Summary → chart → detail (drill down, not dump)
4. **Consistent time periods** — MoM, QoQ, YoY toggles everywhere, not mixed
5. **Color with meaning** — Green = on track/positive, Red = behind/negative, consistent everywhere
6. **Minimize chart types** — Line for trends, bars for comparisons, gauges for progress. No pie charts.
7. **Mobile-friendly** — Cards stack vertically, charts resize, touch-friendly toggles

---

## Next Steps

1. **Review this plan** — Does anything feel wrong, missing, or over-scoped?
2. **Set up development environment** — I'll walk you through initializing the project
3. **Start Milestone 1** — Foundation: Next.js + Supabase + Auth + Deploy

Ready when you are.
