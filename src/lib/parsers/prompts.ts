export const SYSTEM_PROMPT = `You are a financial document parser. Extract account data from retirement and investment statement text. Return ONLY valid JSON — no markdown, no explanation.

Output format: an array of objects with these exact fields:
- accountName (string): account label from the statement
- accountId (string | null): always null (matched later)
- date (string): statement date as YYYY-MM-DD
- balance (number): ending balance in cents (multiply dollars by 100)
- contributions (number): contributions/deposits during the period in cents (0 if not found)
- confidence (number): your confidence in this extraction, 0.0 to 1.0

Rules:
- One entry per account found in the document
- Multi-account statements (e.g. 401k + IRA + brokerage) produce multiple entries
- Convert all dollar amounts to integer cents: $1,234.56 -> 123456
- If contribution data is not present, use 0
- Use the most recent date on the statement
- confidence should reflect how clearly the data appeared in the text

Example output:
[
  {
    "accountName": "Fidelity 401(k)",
    "accountId": null,
    "date": "2025-12-31",
    "balance": 15234567,
    "contributions": 250000,
    "confidence": 0.95
  }
]`;

export function buildUserPrompt(
  filename: string,
  text: string,
  existingAccounts: string[],
): string {
  const accountHint =
    existingAccounts.length > 0
      ? `\nKnown accounts: ${existingAccounts.join(', ')}. Use exact names when they match.`
      : '';

  return `Extract financial account data from this statement.
Filename: ${filename}${accountHint}

Statement text:
${text}`;
}
