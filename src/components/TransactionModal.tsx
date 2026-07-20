'use client';

import { useState } from 'react';

import { ModalShell } from './ModalShell';
import type { TransactionType } from '@/lib/types';

const MAX_COMMENT_LENGTH = 100;

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, comment: string) => void;
  title: string;
  type: TransactionType;
}

/** Deposit / withdraw form. Withdrawals are submitted as a negative offset. */
export function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  type,
}: TransactionModalProps) {
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const magnitude = Math.abs(Number(amount));
    onSubmit(type === 'withdraw' ? -magnitude : magnitude, comment);

    setAmount('');
    setComment('');
    onClose();
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          className="w-full p-3 border rounded-lg mb-6 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
          placeholder={`Enter comment (max ${MAX_COMMENT_LENGTH} chars)`}
          className="w-full p-3 border rounded-lg mb-6 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={MAX_COMMENT_LENGTH}
        />
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 text-white rounded-lg transition-colors ${
              type === 'withdraw'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            Submit
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
