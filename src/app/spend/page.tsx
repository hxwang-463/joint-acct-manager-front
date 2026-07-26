'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { PendingBanner } from '@/components/spend/PendingBanner';
import { StatementFreshness } from '@/components/spend/StatementFreshness';
import { ImportStatementModal } from '@/components/spend/ImportStatementModal';
import { SummaryCard } from '@/components/spend/SummaryCard';
import { TransactionFilters } from '@/components/spend/TransactionFilters';
import { TransactionList } from '@/components/spend/TransactionList';
import { TrendChart } from '@/components/spend/TrendChart';
import { useInfiniteTransactions } from '@/hooks/useInfiniteTransactions';
import {
  getFilterOptions,
  getMonthlySummary,
  getSpendAccounts,
  getPendingSummary,
  getSpendTrend,
  UnauthorizedError,
} from '@/lib/api';
import type {
  FilterOptions,
  MonthTotal,
  PendingSummary,
  SpendAccount,
  SpendSummary,
  TransactionFilters as Filters,
} from '@/lib/types';

const TREND_MONTHS = 6;
const MERCHANT_DEBOUNCE_MS = 350;

/** Calendar month `offset` months before the current one. */
function monthAt(offset: number): { year: number; month: number } {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  return { year: target.getFullYear(), month: target.getMonth() + 1 };
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function lastDayOfMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;
}

function firstDayOfMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

export default function SpendPage() {
  // The summary defaults to last month: this month is usually only part-way
  // through, and a partial month invites a misleading comparison.
  const [monthOffset, setMonthOffset] = useState(1);
  const { year, month } = useMemo(() => monthAt(monthOffset), [monthOffset]);

  const [summary, setSummary] = useState<SpendSummary | null>(null);
  const [previousTotal, setPreviousTotal] = useState<number | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [trend, setTrend] = useState<MonthTotal[]>([]);
  const [accounts, setAccounts] = useState<SpendAccount[]>([]);
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [pending, setPending] = useState<PendingSummary | null>(null);

  const [filters, setFilters] = useState<Filters>({});
  const [merchantDraft, setMerchantDraft] = useState('');
  // Bumped after an import so the summary, chart and list all refetch — the
  // numbers on this page would otherwise silently describe the data as it was
  // before the upload.
  const [reloadToken, setReloadToken] = useState(0);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Typing a merchant shouldn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) =>
        current.merchant === (merchantDraft || undefined)
          ? current
          : { ...current, merchant: merchantDraft || undefined },
      );
    }, MERCHANT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [merchantDraft]);

  // Summary for the selected month, plus the month before it for the comparison.
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSummaryLoading(true);

    const previous = monthAt(monthOffset + 1);
    Promise.all([
      getMonthlySummary(year, month),
      getMonthlySummary(previous.year, previous.month).catch(() => null),
    ])
      .then(([current, prior]) => {
        if (cancelled) return;
        setSummary(current);
        setPreviousTotal(prior?.totalSpend ?? null);
      })
      .catch((error) => {
        if (error instanceof UnauthorizedError || cancelled) return;
        console.error('Failed to load summary:', error);
      })
      .finally(() => {
        if (!cancelled) setIsSummaryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [year, month, monthOffset, reloadToken]);

  // Reference data, fetched once.
  useEffect(() => {
    Promise.all([
      getSpendTrend(TREND_MONTHS),
      getSpendAccounts(),
      getFilterOptions(),
      getPendingSummary(),
    ])
      .then(([trendData, accountData, optionData, pendingData]) => {
        setTrend(trendData);
        setAccounts(accountData);
        setOptions(optionData);
        setPending(pendingData);
      })
      .catch((error) => {
        if (error instanceof UnauthorizedError) return;
        console.error('Failed to load spend reference data:', error);
      });
  }, [reloadToken]);

  const { transactions, isLoading, hasMore, hasError, loadMore } = useInfiniteTransactions(
    filters,
    reloadToken,
  );

  /** Selecting a bar moves the summary to that month. */
  const handleTrendSelect = useCallback((selectedYear: number, selectedMonth: number) => {
    const now = new Date();
    const offset =
      (now.getFullYear() - selectedYear) * 12 + (now.getMonth() + 1 - selectedMonth);
    setMonthOffset(Math.max(offset, 0));
  }, []);

  /**
   * Drill down from the summary: scope the list to that category within the
   * month being summarised, so the two halves of the page agree.
   */
  const handleCategoryClick = useCallback(
    (category: string) => {
      setFilters({
        category,
        from: firstDayOfMonth(year, month),
        to: lastDayOfMonth(year, month),
      });
      setMerchantDraft('');
      document.getElementById('transactions')?.scrollIntoView({ behavior: 'smooth' });
    },
    [year, month],
  );

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Spending</h1>
        <Link
          href="/"
          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          ← Back to account
        </Link>
        <button
          onClick={() => setIsImportOpen(true)}
          className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          Import statement
        </button>
      </div>

      <ImportStatementModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        accounts={accounts}
        onImported={() => setReloadToken((token) => token + 1)}
      />

      <div className="flex flex-col gap-6">
        <PendingBanner pending={pending} />

        <StatementFreshness accounts={accounts} />

        <SummaryCard
          summary={summary}
          isLoading={isSummaryLoading}
          previousTotal={previousTotal}
          label={monthLabel(year, month)}
          monthOffset={monthOffset}
          onPickMonth={setMonthOffset}
          onCategoryClick={handleCategoryClick}
        />

        <TrendChart
          months={trend}
          selectedYear={year}
          selectedMonth={month}
          onSelect={handleTrendSelect}
        />

        <div id="transactions" className="bg-white rounded-lg shadow-sm p-6 scroll-mt-4">
          <h2 className="text-lg text-gray-600 mb-4">Transactions</h2>

          <TransactionFilters
            filters={filters}
            options={options}
            onChange={setFilters}
            merchantDraft={merchantDraft}
            onMerchantDraftChange={setMerchantDraft}
            resultCount={transactions.length}
          />

          <TransactionList
            transactions={transactions}
            isLoading={isLoading}
            hasMore={hasMore}
            hasError={hasError}
            onLoadMore={loadMore}
          />
        </div>
      </div>
    </div>
  );
}
