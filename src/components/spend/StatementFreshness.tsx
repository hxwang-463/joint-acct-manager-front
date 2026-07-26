'use client';

import type { SpendAccount } from '@/lib/types';

/** Past this many days without an import, an account is worth re-downloading. */
const STALE_AFTER_DAYS = 14;

/**
 * Which statements need downloading again.
 *
 * Without this the totals decay quietly: a card nobody has exported in six
 * weeks simply looks like a card nobody spent on, and every figure on the page
 * is understated with no visible sign. Showing it makes the numbers honest
 * about how current they are.
 *
 * Days since the last *import* is the signal, not days since the last
 * transaction — a card exported yesterday with no recent purchases is current,
 * not stale.
 */
export function StatementFreshness({ accounts }: { accounts: SpendAccount[] }) {
  const tracked = accounts.filter((a) => a.statementFormat !== 'NONE');
  if (tracked.length === 0) return null;

  const needsAttention = tracked.filter(
    (a) => a.daysSinceImport == null || a.daysSinceImport >= STALE_AFTER_DAYS,
  );
  if (needsAttention.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        All {tracked.length} tracked statements imported within the last {STALE_AFTER_DAYS} days.
      </p>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <p className="text-sm font-medium text-amber-900 mb-2">
        {needsAttention.length} statement{needsAttention.length > 1 ? 's' : ''} may be out of date —
        spending below could be understated.
      </p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-amber-800">
        {needsAttention.map((account) => (
          <li key={account.id}>
            {account.name}
            <span className="text-amber-600">
              {account.daysSinceImport == null
                ? ' — never imported'
                : ` — ${account.daysSinceImport}d ago`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
