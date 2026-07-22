'use client';

import { useEffect, useState } from 'react';

import { ModalShell } from './ModalShell';
import { getBalanceHistory, UnauthorizedError } from '@/lib/api';
import { formatCurrency, formatDelta } from '@/lib/format';
import type { Balance } from '@/lib/types';

const LIMIT_OPTIONS = [10, 20, 50];

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const [history, setHistory] = useState<Balance[]>([]);
  const [limit, setLimit] = useState(LIMIT_OPTIONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Guards against a slower earlier request overwriting a newer one when the
    // limit is switched rapidly.
    let cancelled = false;

    // Standard fetch-on-open loading flags; the effect is the fetch trigger here,
    // not a place deriving state from props.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setHasError(false);

    getBalanceHistory(limit)
      .then((data) => {
        if (!cancelled) setHistory(data);
      })
      .catch((error) => {
        // On 401 the app re-locks over this modal; don't show a load error.
        if (error instanceof UnauthorizedError) return;
        console.error('Failed to fetch history:', error);
        if (!cancelled) {
          setHistory([]);
          setHasError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, limit]);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="View Transaction History"
      widthClassName="w-[600px] max-w-full"
      className="flex flex-col max-h-[80vh]"
    >
      <div className="flex-1 overflow-y-auto mb-4">
        <HistoryBody history={history} isLoading={isLoading} hasError={hasError} />
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {LIMIT_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => setLimit(option)}
              className={`px-3 py-1 rounded ${
                limit === option
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100 transition-colors"
        >
          Close
        </button>
      </div>
    </ModalShell>
  );
}

function HistoryBody({
  history,
  isLoading,
  hasError,
}: {
  history: Balance[];
  isLoading: boolean;
  hasError: boolean;
}) {
  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  if (hasError) {
    return <div className="text-center py-8 text-red-600">Failed to load history.</div>;
  }

  if (history.length === 0) {
    return <div className="text-center py-8 text-gray-500">No history found.</div>;
  }

  return (
    <table className="w-full min-w-[500px] text-sm">
      <thead>
        <tr className="border-b-2 border-gray-300">
          <th className="text-left p-2 font-semibold">Date</th>
          <th className="text-left p-2 font-semibold">Delta</th>
          <th className="text-left p-2 font-semibold">Amount</th>
          <th className="text-left p-2 font-semibold">Comment</th>
        </tr>
      </thead>
      <tbody>
        {history.map((item) => (
          <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
            <td className="p-2 whitespace-nowrap">{item.date}</td>
            <td className="p-2 whitespace-nowrap">
              {item.delta != null ? (
                <span
                  className={`font-bold ${item.delta < 0 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {formatDelta(item.delta)}
                </span>
              ) : (
                '-'
              )}
            </td>
            <td className="p-2 whitespace-nowrap">{formatCurrency(item.amount)}</td>
            <td className="p-2">{item.comment}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
