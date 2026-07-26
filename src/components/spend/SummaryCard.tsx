'use client';

import { formatCurrency } from '@/lib/format';
import type { SpendSummary } from '@/lib/types';

interface SummaryCardProps {
  summary: SpendSummary | null;
  isLoading: boolean;
  /** The same window a month earlier, for the comparison line. */
  previousTotal: number | null;
  label: string;
  onPickMonth: (offsetFromNow: number) => void;
  monthOffset: number;
  /** Drill down: filters the transaction list to this category and month. */
  onCategoryClick: (category: string) => void;
}

const QUICK_PICKS = [
  { label: 'This month', offset: 0 },
  { label: 'Last month', offset: 1 },
  { label: '2 months ago', offset: 2 },
];

/**
 * Headline spend for one month, broken down by category and by cardholder.
 *
 * Every figure is net of refunds and excludes card payments — paying a card off
 * is money moving between our own accounts, so counting it would roughly double
 * the apparent outgoings.
 */
export function SummaryCard({
  summary,
  isLoading,
  previousTotal,
  label,
  onPickMonth,
  monthOffset,
  onCategoryClick,
}: SummaryCardProps) {
  const total = summary?.totalSpend ?? 0;
  const change =
    previousTotal != null && previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg text-gray-600">{label}</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_PICKS.map((pick) => (
            <button
              key={pick.offset}
              onClick={() => onPickMonth(pick.offset)}
              className={`px-3 py-1 text-sm rounded ${
                monthOffset === pick.offset
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {pick.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-3 mb-6">
            <p className="text-3xl font-bold">{formatCurrency(total)}</p>
            {change != null && (
              <span className={`text-sm ${change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {change > 0 ? '↑' : '↓'} {Math.abs(change).toFixed(0)}% vs previous month
              </span>
            )}
          </div>

          {total === 0 ? (
            <p className="text-gray-500 text-sm">
              No spending recorded for this month. Import a statement to populate it.
            </p>
          ) : (
            <CategoryBreakdown summary={summary} total={total} onCategoryClick={onCategoryClick} />
          )}
        </>
      )}
    </div>
  );
}

function CategoryBreakdown({
  summary,
  total,
  onCategoryClick,
}: {
  summary: SpendSummary | null;
  total: number;
  onCategoryClick: (category: string) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        By category
      </h3>
      <ul className="flex flex-col gap-2">
        {summary?.byCategory.map((entry) => {
          const share = total > 0 ? (entry.amount / total) * 100 : 0;
          return (
            <li key={entry.category}>
              <button
                onClick={() => onCategoryClick(entry.category)}
                className="w-full text-left group"
                title={`Show ${entry.txnCount} ${entry.displayName} transactions`}
              >
                <div className="flex justify-between text-sm mb-1">
                  <span className="group-hover:text-blue-600">
                    {entry.displayName}{' '}
                    <span className="text-gray-400">({entry.txnCount})</span>
                  </span>
                  <span className="tabular-nums font-medium">{formatCurrency(entry.amount)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="h-full bg-blue-400 group-hover:bg-blue-500 rounded"
                    style={{ width: `${share}%` }}
                  />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

