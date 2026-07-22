import { getAuthHeader, handleUnauthorized } from './auth';
import type { Balance, PaymentRecord } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://joint.hxwang.xyz';

/** Thrown on a 401 so callers can skip their own error UI — re-prompting for the
 *  password is handled centrally in the API layer. */
export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
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
    throw new Error(`${init?.method ?? 'GET'} ${path} failed with ${res.status}`);
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
