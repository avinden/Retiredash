import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type {
  accounts,
  snapshots,
  retirementSettings,
  importLog,
} from '@/lib/db/schema';

export const AccountType = {
  CHECKING: 'checking',
  SAVINGS: 'savings',
  INVESTMENT: 'investment',
  RETIREMENT: 'retirement',
  DEBT: 'debt',
} as const;
export type AccountType = (typeof AccountType)[keyof typeof AccountType];

export const SnapshotSource = {
  MANUAL: 'manual',
  PDF_IMPORT: 'pdf_import',
  COPILOT_MCP: 'copilot_mcp',
} as const;
export type SnapshotSource =
  (typeof SnapshotSource)[keyof typeof SnapshotSource];

export const ImportStatus = {
  SUCCESS: 'success',
  PARTIAL: 'partial',
  FAILED: 'failed',
} as const;
export type ImportStatus = (typeof ImportStatus)[keyof typeof ImportStatus];

export type Account = InferSelectModel<typeof accounts>;
export type NewAccount = InferInsertModel<typeof accounts>;

export type Snapshot = InferSelectModel<typeof snapshots>;
export type NewSnapshot = InferInsertModel<typeof snapshots>;

export type RetirementSettings = InferSelectModel<typeof retirementSettings>;
export type NewRetirementSettings = InferInsertModel<typeof retirementSettings>;

export type ImportLog = InferSelectModel<typeof importLog>;
export type NewImportLog = InferInsertModel<typeof importLog>;
