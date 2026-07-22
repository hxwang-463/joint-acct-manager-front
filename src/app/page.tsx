'use client';

import { useState } from 'react';

import { BalanceCard } from '@/components/BalanceCard';
import { HistoryModal } from '@/components/HistoryModal';
import { RecordsTable } from '@/components/RecordsTable';
import { TransactionModal } from '@/components/TransactionModal';
import { useAccountData } from '@/hooks/useAccountData';
import { postBalanceOffset, UnauthorizedError } from '@/lib/api';
import { withProjectedBalances } from '@/lib/format';
import { version } from '../../package.json';

export default function Home() {
  const { records, currentBalance, refresh } = useAccountData();

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleTransaction = async (amount: number, comment: string) => {
    try {
      await postBalanceOffset(amount, comment);
      await refresh();
    } catch (error) {
      // On 401 the login modal takes over; don't also alert.
      if (error instanceof UnauthorizedError) return;
      console.error('Error updating balance:', error);
      alert('Failed to update balance. Please try again.');
    }
  };

  const recordsWithBalance = withProjectedBalances(records, currentBalance);

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Joint Account Manager</h1>
        {/* Single template literal, not `v{version}` — React would otherwise
            split that into two text nodes separated by an HTML comment. */}
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{`v${version}`}</span>
      </div>

      <BalanceCard
        balance={currentBalance}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onDeposit={() => setIsDepositOpen(true)}
        onWithdraw={() => setIsWithdrawOpen(true)}
      />

      <TransactionModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onSubmit={handleTransaction}
        title="Add Deposit"
        type="deposit"
      />

      <TransactionModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onSubmit={handleTransaction}
        title="Add Withdraw"
        type="withdraw"
      />

      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />

      <RecordsTable records={recordsWithBalance} onMutated={refresh} />
    </div>
  );
}
