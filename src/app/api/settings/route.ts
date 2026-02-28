import { NextResponse } from 'next/server';
import { DEFAULT_USER_ID } from '@/lib/constants';
import {
  getRetirementSettings,
  upsertRetirementSettings,
} from '@/lib/db/queries/retirement-settings';

export async function GET() {
  const settings = await getRetirementSettings(DEFAULT_USER_ID);
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const body: unknown = await request.json();
  if (!isValidSettingsBody(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const settings = await upsertRetirementSettings(DEFAULT_USER_ID, {
    annualSpendTarget: body.annualSpendTarget,
    withdrawalRate: body.withdrawalRate,
    targetRetirementAge: body.targetRetirementAge,
    currentAge: body.currentAge,
  });

  return NextResponse.json(settings);
}

function isValidSettingsBody(
  body: unknown,
): body is {
  annualSpendTarget: number;
  withdrawalRate: number;
  targetRetirementAge: number;
  currentAge: number;
} {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.annualSpendTarget === 'number' &&
    typeof b.withdrawalRate === 'number' &&
    typeof b.targetRetirementAge === 'number' &&
    typeof b.currentAge === 'number' &&
    b.annualSpendTarget >= 0 &&
    b.withdrawalRate > 0 &&
    b.withdrawalRate <= 1 &&
    b.targetRetirementAge > 0 &&
    b.currentAge > 0
  );
}
