import type { PaymentRecord, PaymentRecordWithBalance } from './types';

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/** Formats a delta with an explicit sign, e.g. "+12.00" / "-8.50". */
export function formatDelta(delta: number): string {
  return `${delta > 0 ? '+' : ''}${delta.toFixed(2)}`;
}

/**
 * Walks the records in order, subtracting each unpaid amount from the current
 * balance so every unpaid row shows what the balance will be once it clears.
 * Paid records (and those with no amount yet) get a null projection.
 */
export function withProjectedBalances(
  records: PaymentRecord[],
  currentBalance: number,
): PaymentRecordWithBalance[] {
  let runningBalance = currentBalance;

  return records.map((record) => {
    if (record.paid || record.amount === null) {
      return { ...record, balanceAfter: null };
    }

    runningBalance -= record.amount;
    return { ...record, balanceAfter: runningBalance };
  });
}
