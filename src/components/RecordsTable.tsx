'use client';

import { useState } from 'react';

import { RecordRow } from './RecordRow';
import { markRecordAsPaid, updateRecordAmount } from '@/lib/api';
import type { PaymentRecordWithBalance } from '@/lib/types';

interface RecordsTableProps {
  records: PaymentRecordWithBalance[];
  /** Refetches records + balance after a successful mutation. */
  onMutated: () => Promise<void>;
}

export function RecordsTable({ records, onMutated }: RecordsTableProps) {
  // Ids rather than booleans so only one row can be edited or confirmed at a time.
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmingPaidId, setConfirmingPaidId] = useState<number | null>(null);
  const [draftAmount, setDraftAmount] = useState('');

  const startEdit = (record: PaymentRecordWithBalance) => {
    setEditingId(record.id);
    setDraftAmount(record.amount?.toString() ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftAmount('');
  };

  const saveAmount = async (id: number) => {
    const amount = Number(draftAmount);

    if (draftAmount.trim() === '' || Number.isNaN(amount)) {
      alert('Please enter a valid amount.');
      return;
    }

    try {
      await updateRecordAmount(id, amount);
      await onMutated();
      cancelEdit();
    } catch (error) {
      console.error('Error updating amount:', error);
      alert('Failed to update amount. Please try again.');
    }
  };

  const confirmPaid = async (id: number) => {
    try {
      await markRecordAsPaid(id);
      await onMutated();
      setConfirmingPaidId(null);
    } catch (error) {
      console.error('Error marking record as paid:', error);
      alert('Failed to mark record as paid. Please try again.');
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left p-4 font-semibold">Date</th>
            <th className="text-left p-4 font-semibold">Acct Name</th>
            <th className="text-left p-4 font-semibold">Amount</th>
            <th className="text-left p-4 font-semibold">Balance After</th>
            <th className="text-left p-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <RecordRow
              key={record.id}
              record={record}
              isEditingAmount={editingId === record.id}
              isConfirmingPaid={confirmingPaidId === record.id}
              draftAmount={draftAmount}
              onDraftAmountChange={setDraftAmount}
              onStartEdit={() => startEdit(record)}
              onSaveAmount={() => saveAmount(record.id)}
              onCancelEdit={cancelEdit}
              onStartConfirmPaid={() => setConfirmingPaidId(record.id)}
              onConfirmPaid={() => confirmPaid(record.id)}
              onCancelPaid={() => setConfirmingPaidId(null)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
