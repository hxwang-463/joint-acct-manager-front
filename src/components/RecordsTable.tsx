'use client';

import { useState } from 'react';

import { RecordRow } from './RecordRow';
import { markRecordAsPaid, revertRecordToUnpaid, updateRecordAmount } from '@/lib/api';
import type { PaymentRecordWithBalance } from '@/lib/types';

interface RecordsTableProps {
  records: PaymentRecordWithBalance[];
  /** Refetches records + balance after a successful mutation. */
  onMutated: () => Promise<void>;
}

/**
 * Which row, if any, is mid-interaction. A single value rather than one id per
 * mode, so the states cannot overlap: opening anything anywhere closes whatever
 * was open before, including a half-typed amount on another row.
 */
type RowAction =
  | { kind: 'editing'; id: number }
  | { kind: 'confirmingPaid'; id: number }
  | { kind: 'confirmingRevert'; id: number }
  | null;

export function RecordsTable({ records, onMutated }: RecordsTableProps) {
  const [action, setAction] = useState<RowAction>(null);
  const [draftAmount, setDraftAmount] = useState('');

  const reset = () => {
    setAction(null);
    setDraftAmount('');
  };

  const startEdit = (record: PaymentRecordWithBalance) => {
    setAction({ kind: 'editing', id: record.id });
    setDraftAmount(record.amount?.toString() ?? '');
  };

  const startConfirmPaid = (record: PaymentRecordWithBalance) => {
    setAction({ kind: 'confirmingPaid', id: record.id });
    setDraftAmount('');
  };

  const startConfirmRevert = (record: PaymentRecordWithBalance) => {
    setAction({ kind: 'confirmingRevert', id: record.id });
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
      reset();
    } catch (error) {
      console.error('Error updating amount:', error);
      alert('Failed to update amount. Please try again.');
    }
  };

  const confirmPaid = async (id: number) => {
    try {
      await markRecordAsPaid(id);
      await onMutated();
      reset();
    } catch (error) {
      console.error('Error marking record as paid:', error);
      alert('Failed to mark record as paid. Please try again.');
    }
  };

  const confirmRevert = async (id: number) => {
    try {
      await revertRecordToUnpaid(id);
      await onMutated();
      reset();
    } catch (error) {
      console.error('Error reverting record to unpaid:', error);
      alert('Failed to revert record. Please try again.');
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
              isEditingAmount={action?.kind === 'editing' && action.id === record.id}
              isConfirmingPaid={action?.kind === 'confirmingPaid' && action.id === record.id}
              isConfirmingRevert={action?.kind === 'confirmingRevert' && action.id === record.id}
              draftAmount={draftAmount}
              onDraftAmountChange={setDraftAmount}
              onStartEdit={() => startEdit(record)}
              onSaveAmount={() => saveAmount(record.id)}
              onCancelEdit={reset}
              onStartConfirmPaid={() => startConfirmPaid(record)}
              onConfirmPaid={() => confirmPaid(record.id)}
              onCancelPaid={reset}
              onStartConfirmRevert={() => startConfirmRevert(record)}
              onConfirmRevert={() => confirmRevert(record.id)}
              onCancelRevert={reset}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
