'use client';

import { useEffect, useState } from 'react';

import { formatCurrency } from '@/lib/format';
import type { SpendTransaction } from '@/lib/types';

interface TransactionListProps {
  transactions: SpendTransaction[];
  isLoading: boolean;
  hasMore: boolean;
  hasError: boolean;
  onLoadMore: () => void;
}

export function TransactionList({
  transactions,
  isLoading,
  hasMore,
  hasError,
  onLoadMore,
}: TransactionListProps) {
  // A callback ref, not useRef: the sentinel is absent on the first render
  // (the empty branch below renders instead), and a plain ref would not
  // re-run the effect when it later appears — so it would never be observed
  // and the list would stop dead at the first page.
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);

  // Fetch the next page when the sentinel below the list scrolls into view.
  // rootMargin starts the request slightly before it is actually visible, so
  // the rows are usually there by the time the user reaches them.
  useEffect(() => {
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, hasMore, onLoadMore]);

  if (hasError) {
    return <div className="text-center py-8 text-red-600">Failed to load transactions.</div>;
  }

  if (transactions.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">No transactions match these filters.</div>
    );
  }

  return (
    <>
      {/* The table needs more width than a phone has; scroll it rather than
          letting it push the whole page sideways. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left p-2 font-semibold">Date</th>
              <th className="text-left p-2 font-semibold">Merchant</th>
              <th className="text-left p-2 font-semibold">Category</th>
              <th className="text-left p-2 font-semibold">Account</th>
              <th className="text-right p-2 font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-2 whitespace-nowrap text-gray-600">{txn.txnDate}</td>
                <td className="p-2">
                  <span className="font-medium">{txn.merchant ?? txn.description}</span>
                  {/* The raw descriptor is noisy but occasionally the only way to
                      tell two similar purchases apart, so keep it available. */}
                  {txn.merchant && (
                    <span className="block text-xs text-gray-400 truncate max-w-[260px]">
                      {txn.description}
                    </span>
                  )}
                </td>
                <td className="p-2 whitespace-nowrap">
                  <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                    {txn.category}
                  </span>
                </td>
                <td className="p-2 whitespace-nowrap text-gray-600">{txn.accountName}</td>
                <td className="p-2 text-right whitespace-nowrap tabular-nums">
                  {/* A refund is money coming back, so it is shown as a credit
                      rather than as another purchase of the same size. */}
                  <span className={txn.direction === 'CREDIT' ? 'text-green-600' : ''}>
                    {txn.direction === 'CREDIT' ? '+' : ''}
                    {formatCurrency(txn.amount)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div ref={setSentinel} className="py-4 text-center text-sm text-gray-500">
        {isLoading && 'Loading...'}
        {!isLoading && !hasMore && transactions.length > 0 && 'End of results'}
      </div>
    </>
  );
}
