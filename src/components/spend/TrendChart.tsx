'use client';

import { formatCurrency } from '@/lib/format';
import type { MonthTotal } from '@/lib/types';

interface TrendChartProps {
  months: MonthTotal[];
  /** Highlights the month currently shown in the summary above. */
  selectedYear: number;
  selectedMonth: number;
  onSelect: (year: number, month: number) => void;
}

/**
 * Six bars of monthly spend.
 *
 * Hand-drawn rather than pulling in a charting library: the app's dependencies
 * are just React and Next, and a handful of bars is a few lines of SVG against
 * a few hundred kilobytes of bundle.
 *
 * Bars are buttons, so picking a month here drives the summary above.
 */
export function TrendChart({ months, selectedYear, selectedMonth, onSelect }: TrendChartProps) {
  // Guard the divisor: every month being zero would otherwise scale to NaN.
  const peak = Math.max(...months.map((m) => m.amount), 0) || 1;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg text-gray-600 mb-4">Last {months.length} months</h2>

      {/* items-stretch, not items-end: the columns must fill this height for the
          bars' percentage heights to resolve against anything. */}
      <div className="flex items-stretch justify-between gap-2 h-44">
        {months.map((month) => {
          const isSelected = month.year === selectedYear && month.month === selectedMonth;
          // Keep a sliver visible for a zero month so the axis still reads as a
          // month that happened rather than one that is missing.
          const heightPercent = month.amount > 0 ? Math.max((month.amount / peak) * 100, 2) : 1;

          return (
            <button
              key={`${month.year}-${month.month}`}
              onClick={() => onSelect(month.year, month.month)}
              title={`${month.label}: ${formatCurrency(month.amount)} across ${month.txnCount} transactions`}
              className="flex-1 h-full flex flex-col items-center gap-1 group cursor-pointer"
            >
              <span
                className={`text-[11px] tabular-nums ${
                  isSelected ? 'text-blue-700 font-semibold' : 'text-gray-500'
                }`}
              >
                {month.amount > 0 ? Math.round(month.amount).toLocaleString() : '-'}
              </span>

              {/* Fixed-height track so every bar grows from the same baseline. */}
              <span className="w-full flex-1 flex items-end">
                <span
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t transition-colors ${
                    isSelected ? 'bg-blue-600' : 'bg-blue-300 group-hover:bg-blue-400'
                  }`}
                />
              </span>

              <span
                className={`text-[11px] whitespace-nowrap ${
                  isSelected ? 'text-blue-700 font-semibold' : 'text-gray-500'
                }`}
              >
                {month.label.replace(' 20', " '")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
