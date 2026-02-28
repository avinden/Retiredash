Review the current git diff against these criteria. For each item, report PASS or FAIL with a one-line explanation.

## Security
- [ ] No secrets or API keys in code or comments
- [ ] .env.local is in .gitignore
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

## Data Integrity
- [ ] Import source tracked on every snapshot record
- [ ] Error handling present on all async operations

## FINDINGS LOG
For any FAIL items, also output them in this format:

FINDING: [Category] - [Brief description of issue]
SUGGESTION: [How to fix]
RULE_GAP: [Yes/No] - Is this a gap in the code rules that should be added?
