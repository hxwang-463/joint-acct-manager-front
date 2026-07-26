'use client';

import type { FilterOptions, TransactionFilters as Filters } from '@/lib/types';

interface TransactionFiltersProps {
  filters: Filters;
  options: FilterOptions | null;
  onChange: (next: Filters) => void;
  /** Live merchant text, kept separate so typing is not debounced away. */
  merchantDraft: string;
  onMerchantDraftChange: (value: string) => void;
  resultCount: number;
}

const inputClass =
  'border border-gray-300 rounded px-2 py-1 text-sm bg-white min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-400';

export function TransactionFilters({
  filters,
  options,
  onChange,
  merchantDraft,
  onMerchantDraftChange,
  resultCount,
}: TransactionFiltersProps) {
  // Undefined rather than empty string, so the query parameter is omitted
  // entirely instead of being sent as a blank value.
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  const hasAnyFilter =
    filters.from || filters.to || filters.accountId != null || filters.category || filters.merchant;

  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">From</span>
          <input
            type="date"
            value={filters.from ?? ''}
            onChange={(e) => set({ from: e.target.value || undefined })}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">To</span>
          <input
            type="date"
            value={filters.to ?? ''}
            onChange={(e) => set({ to: e.target.value || undefined })}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Account</span>
          <select
            value={filters.accountId ?? ''}
            onChange={(e) => set({ accountId: e.target.value ? Number(e.target.value) : undefined })}
            className={inputClass}
          >
            <option value="">All accounts</option>
            {options?.accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Category</span>
          <select
            value={filters.category ?? ''}
            onChange={(e) => set({ category: e.target.value || undefined })}
            className={inputClass}
          >
            <option value="">All categories</option>
            {options?.categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <span className="text-xs text-gray-500">Merchant</span>
          <input
            type="search"
            value={merchantDraft}
            placeholder="e.g. amazon"
            onChange={(e) => onMerchantDraftChange(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {resultCount} transaction{resultCount === 1 ? '' : 's'} loaded
        </span>
        {hasAnyFilter && (
          <button
            onClick={() => {
              onMerchantDraftChange('');
              onChange({});
            }}
            className="text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
