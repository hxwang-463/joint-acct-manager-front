'use client';

import { ActionButton } from './ActionButton';
import { CheckIcon, CloseIcon, PencilIcon } from './icons';
import { formatCurrency } from '@/lib/format';
import type { PaymentRecordWithBalance } from '@/lib/types';

/** Width of the action column: auto on mobile, fixed once there is room for labels. */
const ACTION_SLOT = 'w-auto sm:w-[180px]';

interface RecordRowProps {
  record: PaymentRecordWithBalance;
  isEditingAmount: boolean;
  isConfirmingPaid: boolean;
  draftAmount: string;
  onDraftAmountChange: (value: string) => void;
  onStartEdit: () => void;
  onSaveAmount: () => void;
  onCancelEdit: () => void;
  onStartConfirmPaid: () => void;
  onConfirmPaid: () => void;
  onCancelPaid: () => void;
}

export function RecordRow({
  record,
  isEditingAmount,
  isConfirmingPaid,
  draftAmount,
  onDraftAmountChange,
  onStartEdit,
  onSaveAmount,
  onCancelEdit,
  onStartConfirmPaid,
  onConfirmPaid,
  onCancelPaid,
}: RecordRowProps) {
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="p-4">{record.date}</td>

      <td className="p-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              record.acctName.startsWith('K') ? 'bg-orange-500' : 'bg-blue-800'
            }`}
          />
          {record.acctName}
        </div>
      </td>

      <td className="p-4">
        <div className="flex items-center gap-3">
          {isEditingAmount ? (
            <>
              <input
                type="number"
                step="0.01"
                value={draftAmount}
                onChange={(e) => onDraftAmountChange(e.target.value)}
                className="w-28 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                autoFocus
              />
              <div className={`flex gap-2 ${ACTION_SLOT}`}>
                <ActionButton
                  variant="confirm"
                  onClick={onSaveAmount}
                  icon={<CheckIcon />}
                  label="Save"
                />
                <ActionButton
                  variant="cancel"
                  onClick={onCancelEdit}
                  icon={<CloseIcon />}
                  label="Cancel"
                />
              </div>
            </>
          ) : (
            <>
              <span
                className={`inline-block w-28 ${
                  record.amount === null ? 'text-red-600 font-bold' : 'text-gray-900'
                }`}
              >
                {record.amount !== null ? formatCurrency(record.amount) : 'N/A'}
              </span>
              {!record.paid && (
                <div className={ACTION_SLOT}>
                  <ActionButton
                    variant="subtle"
                    onClick={onStartEdit}
                    icon={<PencilIcon />}
                    label="Edit Amount"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </td>

      <td className="p-4">
        {record.balanceAfter !== null ? (
          <span className={record.balanceAfter < 0 ? 'text-red-600 font-bold' : undefined}>
            {formatCurrency(record.balanceAfter)}
          </span>
        ) : (
          '-'
        )}
      </td>

      <td className="p-4">
        <div className="flex items-center gap-3">
          <span
            className={`inline-block w-20 text-center px-2 py-1 rounded-full text-sm ${
              record.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {record.paid ? 'Paid' : 'Unpaid'}
          </span>

          {!record.paid && (
            <div className={ACTION_SLOT}>
              {isConfirmingPaid ? (
                <div className="flex gap-2">
                  <ActionButton
                    variant="confirm"
                    onClick={onConfirmPaid}
                    icon={<CheckIcon />}
                    label="Submit"
                  />
                  <ActionButton
                    variant="cancel"
                    onClick={onCancelPaid}
                    icon={<CloseIcon />}
                    label="Cancel"
                  />
                </div>
              ) : (
                <ActionButton
                  variant="subtle"
                  onClick={onStartConfirmPaid}
                  icon={<CheckIcon />}
                  label="Mark Paid"
                />
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
