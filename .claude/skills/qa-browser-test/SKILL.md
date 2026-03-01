---
name: qa-browser-test
description: Run browser-based QA tests against the running RetireView app using Playwright. Triggers on "QA test", "browser test", "test the app in browser", "run QA".
disable-model-invocation: true
---

# QA Browser Test Skill

Run a comprehensive browser test suite against the RetireView app, generate an HTML report with embedded screenshots, file GitHub issues for failures, and log self-improvement notes.

---

## Section 1: Environment Setup

Before running any tests, prepare the environment:

1. **Check dev server** — run `curl -sf http://localhost:3000 > /dev/null` via Bash.
   - If it fails, start the dev server: `npm run dev` in background via Bash (`run_in_background`).
   - Poll `curl -sf http://localhost:3000` every 2 seconds, up to 30 seconds. If it never responds, abort with an error message.

2. **Capture environment info** for the report:
   ```bash
   git rev-parse --short HEAD   # commit hash
   git branch --show-current    # branch name
   date -u +"%Y-%m-%dT%H:%M:%SZ"  # UTC timestamp
   ```

3. **Create output directories**:
   ```bash
   mkdir -p qa-reports/screenshots
   ```

4. **Initialize a results array** (keep in your working memory):
   ```
   results = []   # each entry: { id, name, category, status, notes, screenshotPath }
   ```

---

## Section 2: Test Matrix

Execute **30 tests** across 8 categories, **in the order listed below**. Later categories depend on data created by earlier ones.

### Category 1: Page Load (PL)

| ID   | Test | Steps |
|------|------|-------|
| PL-1 | Dashboard loads | `browser_navigate` to `http://localhost:3000`, `browser_snapshot`, verify page contains "RetireView" and "Dashboard" |
| PL-2 | Net Worth loads | Navigate to `/net-worth`, snapshot, verify "Net Worth" heading |
| PL-3 | Contributions loads | Navigate to `/contributions`, snapshot, verify "Contributions vs. Performance" heading |
| PL-4 | Accounts loads | Navigate to `/accounts`, snapshot, verify "Accounts" heading |
| PL-5 | Settings loads | Navigate to `/settings`, snapshot, verify "Settings" heading |

### Category 2: Navigation (NAV)

| ID    | Test | Steps |
|-------|------|-------|
| NAV-1 | Sidebar renders all links | On any page, `browser_snapshot`, verify sidebar contains links: "Dashboard", "Net Worth", "Contributions", "Accounts", "Settings" |
| NAV-2 | Sidebar click navigates | Click "Settings" in sidebar, verify URL changed to `/settings` and heading visible |
| NAV-3 | Logo returns home | Click "RetireView" logo/text in sidebar header, verify URL is `/` |
| NAV-4 | Active link highlighted | Navigate to `/accounts`, snapshot, verify the "Accounts" sidebar item has active/highlighted state |

### Category 3: Settings Form (FORM)

| ID     | Test | Steps |
|--------|------|-------|
| FORM-1 | Settings form renders | Navigate to `/settings`, verify 4 inputs: `#annualSpend`, `#withdrawalRate`, `#currentAge`, `#targetAge` |
| FORM-2 | Fill and save settings | Clear fields, type: Annual Spending = `60000`, Withdrawal Rate = `4`, Current Age = `35`, Target Age = `65`. Click "Save Settings". Wait for "Saved!" text. |
| FORM-3 | Retirement target calculates | After saving, verify the page shows a retirement target of "$1,500,000.00" (60000 / 0.04) |
| FORM-4 | Settings persist on reload | Reload the page (`browser_navigate` to `/settings`), verify fields still show the saved values |

### Category 4: Account Management (ACCT)

| ID     | Test | Steps |
|--------|------|-------|
| ACCT-1 | Account form renders | Navigate to `/accounts`, verify `#accountName`, account type trigger, `#institution`, "Add Account" button |
| ACCT-2 | Create retirement account | Fill: Name = `Test 401k`, Type = `retirement` (click Select trigger with id `accountType`, then click the "Retirement (401k/IRA)" option), Institution = `Fidelity`. Click "Add Account". Wait for new card to appear. |
| ACCT-3 | Account card displays | Verify a card exists with text "Test 401k", "Fidelity", and a retirement badge |
| ACCT-4 | Create second account | Fill: Name = `Test Savings`, Type = `savings`, Institution = `Ally`. Click "Add Account". Verify card appears. |

### Category 5: Snapshot Entry (SNAP)

| ID     | Test | Steps |
|--------|------|-------|
| SNAP-1 | Snapshot form renders | On `/accounts`, verify `#snapshotAccount` trigger, `#snapshotDate`, `#snapshotBalance`, `#snapshotContributions`, "Add Snapshot" button |
| SNAP-2 | Create snapshot for 401k | Select "Test 401k" from account dropdown (click `#snapshotAccount` trigger, then click the option). Set Balance = `150000`, Contributions = `20000`. Click "Add Snapshot". Wait for table row. |
| SNAP-3 | Create snapshot for savings | Select "Test Savings", Balance = `25000`, Contributions = `5000`. Submit. Verify table shows 2 rows. |

### Category 6: Dashboard Integration (DASH)

| ID     | Test | Steps |
|--------|------|-------|
| DASH-1 | Dashboard shows hero stats | Navigate to `/`, snapshot, verify retirement target and current savings values are displayed (not empty state) |
| DASH-2 | Progress percentage shown | Verify a progress indicator/bar exists showing savings progress toward target |
| DASH-3 | Account breakdown shown | Verify account breakdown section renders with account type data |

### Category 7: Charts (CHART)

| ID      | Test | Steps |
|---------|------|-------|
| CHART-1 | Net worth page has stats | Navigate to `/net-worth`, snapshot, verify summary stats (total balance) are displayed |
| CHART-2 | Net worth chart renders | Verify a chart/recharts container element exists on the page |
| CHART-3 | Contributions page renders | Navigate to `/contributions`, verify contributions chart or stats section |

### Category 8: Responsive (RESP)

| ID     | Test | Steps |
|--------|------|-------|
| RESP-1 | Mobile viewport | `browser_resize` to 375x667. Navigate to `/`. Snapshot. Verify content is visible and sidebar is collapsed/hidden. |
| RESP-2 | Mobile content accessible | On mobile viewport, verify main dashboard content is readable (hero section visible) |
| RESP-3 | Desktop viewport | `browser_resize` to 1280x800. Navigate to `/`. Snapshot. Verify sidebar is visible alongside content. |

---

## Section 3: Execution Protocol

For **each test**, follow this exact pattern:

1. **Execute** the test steps described in the matrix above.
2. **Screenshot** — call `browser_take_screenshot` after each test. Save the returned screenshot to `qa-reports/screenshots/{test-id}.png` (you will read the screenshot data from the tool result).
3. **Assess** — determine PASS, FAIL, or SKIP:
   - **PASS**: All assertions met.
   - **FAIL**: Any assertion not met. Record what was expected vs. what was observed.
   - **SKIP**: A dependency failed (e.g., SNAP tests skip if ACCT tests failed).
4. **Record** the result: `{ id, name, category, status, notes, screenshotPath }`.
5. **On failure**: Take an additional screenshot, record the failure details, then **continue** to the next test. Do NOT stop the suite.

### Important: shadcn Select components

The account type and snapshot account dropdowns use shadcn/ui `<Select>` (Radix UI). To interact:
1. `browser_click` on the `<SelectTrigger>` element (identified by its `id` attribute, e.g., `#accountType`).
2. Wait for the dropdown to open.
3. `browser_snapshot` to see the options in the accessibility tree.
4. `browser_click` on the desired `<SelectItem>` option text.

Do NOT try to use native `<select>` interactions — these are custom Radix popover-based selects.

### Important: Form field clearing

Before typing into input fields that may have existing values, use `browser_click` on the field first, then `browser_press_key` with `Control+a` (or `Meta+a` on Mac) followed by the new value via `browser_type` or `browser_fill_form`. This ensures old values are replaced.

---

## Section 4: HTML Report Generation

After all tests complete, generate a self-contained HTML report.

**Filename**: `qa-reports/qa-report-{YYYY-MM-DDTHH-MM-SS}.html` (use the UTC timestamp captured in setup, replacing colons with hyphens).

### Report structure

Use the Write tool to create the HTML file. The report must be a single self-contained HTML file with inline CSS. Structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>RetireView QA Report — {timestamp}</title>
  <style>
    /* Inline styles: */
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f9fafb; }
    .header { background: #1e293b; color: white; padding: 24px; border-radius: 8px; margin-bottom: 24px; }
    .header h1 { margin: 0 0 8px; }
    .header .meta { opacity: 0.8; font-size: 14px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
    .stat-card .number { font-size: 32px; font-weight: 700; }
    .stat-card .label { font-size: 14px; color: #6b7280; margin-top: 4px; }
    .pass { color: #16a34a; }
    .fail { color: #dc2626; }
    .skip { color: #ca8a04; }
    .health-bar { height: 12px; border-radius: 6px; background: #e5e7eb; overflow: hidden; margin: 16px 0; }
    .health-fill { height: 100%; border-radius: 6px; transition: width 0.3s; }
    .healthy { background: #16a34a; }
    .attention { background: #ca8a04; }
    .critical { background: #dc2626; }
    .verdict { font-size: 20px; font-weight: 700; text-align: center; padding: 12px; border-radius: 8px; margin-bottom: 24px; }
    .verdict.healthy { background: #f0fdf4; color: #16a34a; }
    .verdict.attention { background: #fefce8; color: #ca8a04; }
    .verdict.critical { background: #fef2f2; color: #dc2626; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    th { background: #f1f5f9; padding: 12px 16px; text-align: left; font-size: 13px; text-transform: uppercase; color: #64748b; }
    td { padding: 12px 16px; border-top: 1px solid #e2e8f0; }
    tr.pass-row td:first-child { border-left: 4px solid #16a34a; }
    tr.fail-row td:first-child { border-left: 4px solid #dc2626; }
    tr.skip-row td:first-child { border-left: 4px solid #ca8a04; }
    .category-header { background: #1e293b; color: white; padding: 12px 20px; border-radius: 8px 8px 0 0; margin-top: 24px; font-weight: 600; }
    .screenshot-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-top: 24px; }
    .screenshot-card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .screenshot-card img { width: 100%; height: auto; }
    .screenshot-card .caption { padding: 8px 12px; font-size: 13px; color: #374151; }
    .bug-detail { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .bug-detail h4 { margin: 0 0 8px; color: #dc2626; }
  </style>
</head>
<body>
```

**Header section**: Branch, commit hash, timestamp, total test count.

**Summary section**: 4 stat cards — Total Tests, Passed, Failed, Skipped. Color-coded numbers.

**Health bar**: Width = `(passCount / totalTests) * 100%`. Class based on pass rate:
- 100% → `healthy`, verdict text: "ALL TESTS PASSING — HEALTHY"
- 81-99% → `attention`, verdict text: "SOME FAILURES — NEEDS ATTENTION"
- ≤80% → `critical`, verdict text: "SIGNIFICANT FAILURES — CRITICAL"

**Results tables**: One table per category. Columns: ID | Test Name | Status | Notes. Row class: `pass-row`, `fail-row`, or `skip-row`.

**Screenshot gallery**: Show ALL screenshots (pass and fail). Embed as base64 data URIs by reading each screenshot PNG file and converting. Each card: image + caption with test ID and status.

**Bug details section** (only if failures exist): For each FAIL, show: test ID, what was expected, what actually happened, screenshot.

Close the HTML with `</body></html>`.

### Embedding screenshots

For each screenshot PNG saved during testing:
1. Read the file using the Read tool (it supports images).
2. The screenshot data is available from `browser_take_screenshot` results. Save each screenshot to disk as a PNG in `qa-reports/screenshots/`.
3. In the HTML report, embed screenshots using `<img src="./screenshots/{test-id}.png">` with relative paths (simpler and avoids massive HTML files).

---

## Section 5: GitHub Issue Creation

After generating the report, create GitHub issues for any **FAIL** results.

### Pre-check

1. **Ensure `qa-automated` label exists**:
   ```bash
   gh label list | grep -q "qa-automated" || gh label create "qa-automated" --color "d93f0b" --description "Automated QA test failure"
   ```

2. For each FAIL result:

   a. **Check for duplicates**:
   ```bash
   gh issue list --label "qa-automated" --state open --search "{test-id}"
   ```
   If an open issue already exists with that test ID in the title, **skip** creating a duplicate. Instead, add a comment to the existing issue noting the re-occurrence.

   b. **Create issue** (if no duplicate):
   ```bash
   gh issue create \
     --title "QA FAIL: {test-id} — {test-name}" \
     --label "bug" --label "qa-automated" \
     --body "$(cat <<'EOF'
   ## QA Test Failure

   **Test ID:** {test-id}
   **Test Name:** {test-name}
   **Category:** {category}
   **Branch:** {branch}
   **Commit:** {commit-hash}
   **Date:** {timestamp}

   ## Expected
   {what should have happened}

   ## Actual
   {what actually happened}

   ## Reproduction Steps
   1. Start dev server: `npm run dev`
   2. Navigate to {url}
   3. {specific steps}

   ## Screenshot
   See qa-report for screenshot: `qa-reports/screenshots/{test-id}.png`

   ---
   *Filed automatically by `/qa-browser-test` skill*
   EOF
   )"
   ```

3. **Track created issues** — record the issue number and URL for the summary output.

---

## Section 6: Self-Improvement

After filing issues, append a reflection entry to `qa-reports/skill-improvements.md`.

- If the file doesn't exist, create it with a `# QA Skill Improvement Log` header.
- If it exists, read it first and append below existing content.

### Entry format

```markdown
## Run: {timestamp} ({branch} @ {commit})

### Results Summary
- Passed: {n} | Failed: {n} | Skipped: {n}

### Difficulties Encountered
- {list any problems: selectors that didn't work, timing issues, unexpected DOM structure, etc.}
- {if none: "No difficulties encountered."}

### Suggested SKILL.md Improvements
- {specific edits to this skill file that would help future runs}
- {new selectors, better wait strategies, additional assertions, etc.}
- {if none: "No improvements needed."}

### New Test Ideas
- {tests that would add coverage based on what you observed}
- {if none: "Current coverage is sufficient."}
```

### Consolidation

If you notice the same difficulty or suggestion appearing 3+ times across entries, add a `### Recurring Patterns` section at the top of the file summarizing them.

---

## Section 7: Summary Output

Print a final summary to the user:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  QA Test Run Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Branch:  {branch} @ {commit}
  Tests:   {total} total
  Passed:  {pass}  ✓
  Failed:  {fail}  ✗
  Skipped: {skip}  ○

  Health:  {HEALTHY | NEEDS ATTENTION | CRITICAL}

  Report:  qa-reports/qa-report-{timestamp}.html
  Issues:  {n} created, {n} duplicates skipped

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Then suggest: `open qa-reports/qa-report-{timestamp}.html`

**Do NOT stop the dev server** — leave it running for the user.
