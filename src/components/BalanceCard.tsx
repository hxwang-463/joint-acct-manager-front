'use client';

import Link from 'next/link';

import { formatCurrency } from '@/lib/format';

interface BalanceCardProps {
  balance: number;
  onOpenHistory: () => void;
  onDeposit: () => void;
  onWithdraw: () => void;
}

export function BalanceCard({
  balance,
  onOpenHistory,
  onDeposit,
  onWithdraw,
}: BalanceCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex flex-col gap-4">
        <div className="flex justify-start items-center gap-4">
          <h2 className="text-lg text-gray-600">Current Balance</h2>
          <button
            onClick={onOpenHistory}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            History
          </button>
          {/* A route rather than a modal: the spend view is a page of its own,
              and this way it can be linked to and bookmarked. */}
          <Link
            href="/spend"
            className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Spending
          </Link>
        </div>

        {/* Wraps on narrow screens: the buttons drop to their own full-width
            row below the balance rather than overflowing the card. */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <p className="text-3xl font-bold">{formatCurrency(balance)}</p>
          <div className="flex flex-wrap gap-3 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={onDeposit}
              className="flex-1 sm:flex-none whitespace-nowrap px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Add Deposit
            </button>
            <button
              onClick={onWithdraw}
              className="flex-1 sm:flex-none whitespace-nowrap px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Add Withdraw
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
