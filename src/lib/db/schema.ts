import {
  pgTable,
  text,
  integer,
  boolean,
  doublePrecision,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  type: text('type', {
    enum: ['checking', 'savings', 'investment', 'retirement', 'debt'],
  }).notNull(),
  institution: text('institution').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: text('created_at').notNull(),
});

export const snapshots = pgTable('snapshots', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id),
  date: text('date').notNull(),
  balance: integer('balance').notNull(),
  contributions: integer('contributions').notNull(),
  gains: integer('gains').notNull(),
  source: text('source', {
    enum: ['manual', 'pdf_import', 'copilot_mcp'],
  }).notNull(),
}, (table) => [
  uniqueIndex('snapshots_account_date_idx').on(table.accountId, table.date),
]);

export const retirementSettings = pgTable('retirement_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  annualSpendTarget: integer('annual_spend_target').notNull(),
  withdrawalRate: doublePrecision('withdrawal_rate').notNull().default(0.04),
  targetRetirementAge: integer('target_retirement_age').notNull(),
  currentAge: integer('current_age').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const importLog = pgTable('import_log', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  source: text('source').notNull(),
  filename: text('filename').notNull(),
  importedAt: text('imported_at').notNull(),
  recordsCreated: integer('records_created').notNull(),
  recordsUpdated: integer('records_updated').notNull(),
  status: text('status', {
    enum: ['success', 'partial', 'failed'],
  }).notNull(),
  errorDetails: text('error_details'),
});
