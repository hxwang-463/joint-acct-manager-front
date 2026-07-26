import { getAuthHeader, handleUnauthorized } from './auth';
import type {
  Balance,
  FilterOptions,
  ImportSummary,
  ImportView,
  MonthTotal,
  PaymentRecord,
  PendingSummary,
  SpendAccount,
  SpendSummary,
  SpendTransaction,
  StatementFormat,
  TransactionFilters,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://joint.hxwang.xyz';

/** Thrown on a 401 so callers can skip their own error UI — re-prompting for the
 *  password is handled centrally in the API layer. */
export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

/**
 * A non-2xx response, carrying the server's own explanation.
 *
 * The API answers errors as RFC 9457 problem details, where `detail` says
 * something genuinely useful — which account a file was rejected for, why an
 * import is refused. Without this the UI could only report a status code.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  // Merge any per-call headers (e.g. Content-Type) with the Authorization header.
  const headers = new Headers(init?.headers);
  const authHeader = getAuthHeader();
  if (authHeader) {
    headers.set('Authorization', authHeader);
  }

  const res = await fetch(`${BASE_URL}${path}`, { cache: 'no-store', ...init, headers });

  if (res.status === 401) {
    // Body is empty on 401 — don't parse. Clear the credential and re-prompt.
    handleUnauthorized();
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    // Prefer the server's explanation; fall back to the status if the body is
    // not problem details (or is empty).
    let detail = `${init?.method ?? 'GET'} ${path} failed with ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // Not JSON — keep the generic message.
    }
    throw new ApiError(res.status, detail);
  }

  return res;
}

export async function getBalance(): Promise<number> {
  const res = await request('/api/v1/balance');
  const data: Balance = await res.json();
  return data.amount;
}

export async function getRecords(): Promise<PaymentRecord[]> {
  const res = await request('/api/v1/records');
  return res.json();
}

export async function getBalanceHistory(limit: number): Promise<Balance[]> {
  const res = await request(`/api/v1/balance/history?limit=${limit}`);
  return res.json();
}

export async function postBalanceOffset(offset: number, comment: string): Promise<void> {
  await request('/api/v1/balance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ offset, comment }),
  });
}

export async function updateRecordAmount(id: number, amount: number): Promise<void> {
  await request(`/api/v1/records/${id}/amount`, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain' },
    body: amount.toString(),
  });
}

export async function markRecordAsPaid(id: number): Promise<void> {
  await request(`/api/v1/records/${id}/paid`, { method: 'PUT' });
}

export async function revertRecordToUnpaid(id: number): Promise<void> {
  await request(`/api/v1/records/${id}/unpaid`, { method: 'PUT' });
}

// ---------------------------------------------------------------- spend

/** Totals for one calendar month, by category and by cardholder. */
export async function getMonthlySummary(year: number, month: number): Promise<SpendSummary> {
  const res = await request(`/api/v1/analysis/monthly?year=${year}&month=${month}`);
  return res.json();
}

/** Net spend per month for the last N months, oldest first. */
export async function getSpendTrend(months: number): Promise<MonthTotal[]> {
  const res = await request(`/api/v1/analysis/trend?months=${months}`);
  return res.json();
}

/** Filter choices built from the data actually present. */
export async function getFilterOptions(): Promise<FilterOptions> {
  const res = await request('/api/v1/analysis/filters');
  return res.json();
}

export async function getSpendAccounts(): Promise<SpendAccount[]> {
  const res = await request('/api/v1/accounts');
  return res.json();
}

/**
 * One page of transactions. The API returns a bare array, so "there is more"
 * is inferred from getting a full page back rather than from a flag.
 */
export async function getTransactions(
  filters: TransactionFilters,
  page: number,
  size: number,
): Promise<SpendTransaction[]> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.accountId != null) params.set('accountId', String(filters.accountId));
  if (filters.category) params.set('category', filters.category);
  if (filters.merchant) params.set('merchant', filters.merchant);

  const res = await request(`/api/v1/transactions?${params.toString()}`);
  return res.json();
}

/**
 * Uploads a statement export to one account.
 *
 * No Content-Type is set deliberately: the browser has to add it itself so it
 * can include the multipart boundary.
 */
export async function uploadStatement(accountId: number, file: File): Promise<ImportSummary> {
  const body = new FormData();
  body.append('file', file);
  const res = await request(`/api/v1/accounts/${accountId}/statements`, { method: 'POST', body });
  return res.json();
}

/** How many transactions are still waiting to be named and categorised. */
export async function getPendingSummary(): Promise<PendingSummary> {
  const res = await request('/api/v1/spend/pending/summary');
  return res.json();
}

export async function getImports(limit: number): Promise<ImportView[]> {
  const res = await request(`/api/v1/statements?limit=${limit}`);
  return res.json();
}

/** Removes an import and every transaction it brought in. */
export async function undoImport(importId: number): Promise<void> {
  await request(`/api/v1/statements/${importId}`, { method: 'DELETE' });
}

/** Points an account at a parser, so statements can be imported for it. */
export async function configureAccount(
  accountId: number,
  statementFormat: StatementFormat,
): Promise<SpendAccount> {
  const res = await request(`/api/v1/accounts/${accountId}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ statementFormat }),
  });
  return res.json();
}
