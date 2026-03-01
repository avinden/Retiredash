import Anthropic from '@anthropic-ai/sdk';
import type { PdfExtraction, ParsedSnapshot, ParseResult } from '@/types';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';

interface ExistingAccount {
  id: string;
  name: string;
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  return new Anthropic({ apiKey });
}

function matchAccountId(
  name: string,
  existing: ExistingAccount[],
): string | null {
  const lower = name.toLowerCase().trim();
  for (const account of existing) {
    const accountLower = account.name.toLowerCase().trim();
    if (lower === accountLower || lower.includes(accountLower) || accountLower.includes(lower)) {
      return account.id;
    }
  }
  return null;
}

function isSnapshotArray(data: unknown): data is ParsedSnapshot[] {
  if (!Array.isArray(data)) return false;
  return data.every((item) => {
    if (typeof item !== 'object' || item === null) return false;
    const s = item as Record<string, unknown>;
    return (
      typeof s.accountName === 'string' &&
      typeof s.date === 'string' &&
      typeof s.balance === 'number' &&
      typeof s.contributions === 'number' &&
      typeof s.confidence === 'number'
    );
  });
}

function parseJsonResponse(raw: string): ParsedSnapshot[] {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('No JSON array found in response');
  }

  const parsed: unknown = JSON.parse(jsonMatch[0]);
  if (!isSnapshotArray(parsed)) {
    throw new Error('Response does not match ParsedSnapshot[] schema');
  }

  return parsed.map((s) => ({
    accountName: s.accountName,
    accountId: s.accountId ?? null,
    date: s.date,
    balance: Math.round(s.balance),
    contributions: Math.round(s.contributions),
    confidence: Math.max(0, Math.min(1, s.confidence)),
  }));
}

export async function parseStatementText(
  extraction: PdfExtraction,
  existingAccounts: ExistingAccount[],
): Promise<ParseResult> {
  const client = getClient();
  const accountNames = existingAccounts.map((a) => a.name);
  const userPrompt = buildUserPrompt(
    extraction.filename,
    extraction.text,
    accountNames,
  );

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  const rawResponse = textBlock.text;
  const snapshots = parseJsonResponse(rawResponse);

  const matched = snapshots.map((s) => ({
    ...s,
    accountId: matchAccountId(s.accountName, existingAccounts),
  }));

  return {
    importId: crypto.randomUUID(),
    filename: extraction.filename,
    parsedAt: new Date().toISOString(),
    snapshots: matched,
    rawResponse,
  };
}
