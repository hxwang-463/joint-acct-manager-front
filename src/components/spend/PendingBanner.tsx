'use client';

import type { PendingSummary } from '@/lib/types';

/**
 * How much spending is imported but not yet named or categorised.
 *
 * These transactions are deliberately *not* hidden from the figures. Their
 * amounts, dates and directions come straight from the statement and are
 * correct on arrival — only the merchant name and category are unknown. Hiding
 * them would leave the headline total quietly understated, which is a worse
 * failure than showing an Uncategorized bucket.
 */
export function PendingBanner({ pending }: { pending: PendingSummary | null }) {
  if (!pending || pending.pendingTransactions === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p className="text-sm text-blue-900">
        <strong>{pending.pendingTransactions}</strong> transaction
        {pending.pendingTransactions === 1 ? '' : 's'} from{' '}
        <strong>{pending.pendingMerchants}</strong> unrecognised merchant
        {pending.pendingMerchants === 1 ? '' : 's'} are waiting to be categorised. They
        already count towards the totals below and appear under{' '}
        <span className="font-medium">Uncategorized</span>.
      </p>
      <p className="text-xs text-blue-700 mt-1">
        Run the <code className="bg-blue-100 px-1 rounded">categorize-spend</code> skill in
        Claude Code to name and categorise them.
      </p>
    </div>
  );
}
