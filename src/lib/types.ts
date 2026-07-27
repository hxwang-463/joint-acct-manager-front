/** A scheduled payment against the joint account. */
export interface PaymentRecord {
  id: number;
  acctName: string;
  date: string;
  amount: number | null;
  paid: boolean;
}

/** A payment record annotated with the projected balance once it clears. */
export interface PaymentRecordWithBalance extends PaymentRecord {
  balanceAfter: number | null;
}

/** A point in the account's balance history. */
export interface Balance {
  id: number;
  amount: number;
  delta: number;
  date: string;
  comment: string;
}

export type TransactionType = 'deposit' | 'withdraw';

// ---------------------------------------------------------------- spend

export type StatementFormat = 'NONE' | 'CHASE' | 'AMEX' | 'BOA' | 'CITI' | 'DISCOVER';
export type Direction = 'DEBIT' | 'CREDIT';
export type TxnType = 'PURCHASE' | 'REFUND' | 'PAYMENT' | 'FEE' | 'ADJUSTMENT';
export type CategorySource = 'BANK' | 'AI' | 'USER' | 'DEFAULT';

/** One imported or generated purchase. Amount is always positive; `direction` carries the sign. */
export interface SpendTransaction {
  id: number;
  accountId: number;
  accountName: string;
  txnDate: string;
  description: string;
  merchant: string | null;
  amount: number;
  direction: Direction;
  txnType: TxnType;
  category: string;
  categorySource: CategorySource;
  bankCategory: string | null;
  recordId: number | null;
}

export interface CategoryTotal {
  category: string;
  displayName: string;
  amount: number;
  txnCount: number;
}

/**
 * Totals for a window. Net of refunds, and always excluding card payments.
 *
 * The API also returns a per-cardholder split, but it is not modelled here:
 * Chase exports carry no cardholder at all, so any such breakdown would file
 * most of the spending as unattributed and say very little.
 */
export interface SpendSummary {
  from: string;
  to: string;
  totalSpend: number;
  byCategory: CategoryTotal[];
}

export interface MonthTotal {
  year: number;
  month: number;
  label: string;
  amount: number;
  txnCount: number;
}

export interface FilterOptions {
  accounts: { id: number; name: string }[];
  categories: string[];
}

/** An account plus how stale its imported statement is. */
export interface SpendAccount {
  id: number;
  name: string;
  dayOfMonth: number;
  defaultAmount: number | null;
  statementFormat: StatementFormat;
  defaultCategory: string | null;
  lastTxnDate: string | null;
  lastImportedAt: string | null;
  daysSinceImport: number | null;
  txnCount: number;
}

/** What an upload actually did — the counts matter when exports overlap. */
export interface ImportSummary {
  importId: number;
  accountId: number;
  accountName: string;
  filename: string;
  periodStart: string | null;
  periodEnd: string | null;
  rowCount: number;
  inserted: number;
  duplicates: number;
  payments: number;
  /** Rows with a merchant we have not classified before; they wait for the skill. */
  pendingClassification: number;
  /** True when this exact file had already been imported, so nothing was re-read. */
  alreadyImported: boolean;
}

export interface ImportView {
  id: number;
  accountId: number;
  accountName: string;
  filename: string;
  importedAt: string;
  periodStart: string | null;
  periodEnd: string | null;
  rowCount: number | null;
  insertedCount: number | null;
  duplicateCount: number | null;
  status: string;
}

/** How much is waiting on the classifier. */
export interface PendingSummary {
  pendingTransactions: number;
  pendingMerchants: number;
}

export interface TransactionFilters {
  from?: string;
  to?: string;
  accountId?: number;
  category?: string;
  merchant?: string;
}
