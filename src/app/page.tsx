'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import packageJson from '../../package.json';

const BASE_URL = 'https://joint.hxwang.xyz';
// const BASE_URL = 'http://localhost:8080';
interface Record {
  id: number;
  acctName: string;
  date: string;
  amount: number | null;
  paid: boolean;
}

interface RecordWithBalance extends Record {
  balanceAfter: number | null;
}

interface Balance {
  id: number;
  amount: number;
  delta: number;
  date: string;
  comment: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, comment: string) => void;
  title: string;
  type: 'deposit' | 'withdraw';
}

const Modal = ({ isOpen, onClose, onSubmit, title, type }: ModalProps) => {
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = type === 'withdraw' ? -Math.abs(Number(amount)) : Math.abs(Number(amount));
    onSubmit(value, comment);
    setAmount('');
    setComment('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-xl">
        <h2 className="text-xl font-bold mb-6">{title}</h2>
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
            onChange={(e) => setComment(e.target.value.slice(0, 100))}
            placeholder="Enter comment (max 100 chars)"
            className="w-full p-3 border rounded-lg mb-6 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={100}
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
      </div>
    </div>
  );
};

async function getBalance() {
  const res = await fetch(`${BASE_URL}/api/v1/balance`, {
    cache: 'no-store'
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch balance');
  }
  
  const data: Balance = await res.json();
  return data.amount;
}

async function getRecords() {
  const res = await fetch(`${BASE_URL}/api/v1/records`, {
    cache: 'no-store'
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch records');
  }
  
  return res.json();
}

async function updateRecordAmount(id: number, amount: number) {
  const res = await fetch(`${BASE_URL}/api/v1/records/${id}/amount`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: amount.toString(),
  });

  if (!res.ok) {
    throw new Error('Failed to update amount');
  }
}

async function markRecordAsPaid(id: number) {
  const res = await fetch(`${BASE_URL}/api/v1/records/${id}/paid`, {
    method: 'PUT',
  });

  if (!res.ok) {
    throw new Error('Failed to mark record as paid');
  }
}

export default function Home() {
  const router = useRouter();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [records, setRecords] = useState<Record[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [editingAmount, setEditingAmount] = useState<number | null>(null);
  const [tempAmount, setTempAmount] = useState<string>('');
  const [confirmingPaid, setConfirmingPaid] = useState<number | null>(null);

  // Add new state for history modal and data
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [history, setHistory] = useState<Balance[]>([]);
  const [historyLimit, setHistoryLimit] = useState(10);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch history function
  const fetchHistory = async (limit: number) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/v1/balance/history?limit=${limit}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch history');
      const data: Balance[] = await res.json();
      setHistory(data);
    } catch (e) {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Prevent background scroll when history modal is open
  useEffect(() => {
    if (!isHistoryModalOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isHistoryModalOpen]);

  // Open modal and fetch history
  const handleOpenHistory = () => {
    setIsHistoryModalOpen(true);
    fetchHistory(historyLimit);
  };

  // When limit changes, refetch
  useEffect(() => {
    if (isHistoryModalOpen) fetchHistory(historyLimit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyLimit]);

  // Initial data fetch
  useEffect(() => {
    Promise.all([getRecords(), getBalance()]).then(([recordsData, balanceData]) => {
      setRecords(recordsData);
      setCurrentBalance(balanceData);
    });
  }, []);

  const handleTransaction = async (amount: number, comment: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offset: amount, comment }),
      });

      if (!res.ok) {
        throw new Error('Failed to update balance');
      }

      // Refresh the data
      const [newRecords, newBalance] = await Promise.all([getRecords(), getBalance()]);
      setRecords(newRecords);
      setCurrentBalance(newBalance);
      router.refresh();
    } catch (error) {
      console.error('Error updating balance:', error);
      alert('Failed to update balance. Please try again.');
    }
  };

  const handleAmountEdit = async (record: RecordWithBalance) => {
    if (editingAmount === record.id) {
      try {
        const newAmount = Number(tempAmount);
        if (isNaN(newAmount)) {
          throw new Error('Invalid amount');
        }

        await updateRecordAmount(record.id, newAmount);
        
        // Refresh the data
        const [newRecords, newBalance] = await Promise.all([getRecords(), getBalance()]);
        setRecords(newRecords);
        setCurrentBalance(newBalance);
        setEditingAmount(null);
        setTempAmount('');
      } catch (error) {
        console.error('Error updating amount:', error);
        alert('Failed to update amount. Please try again.');
      }
    } else {
      setEditingAmount(record.id);
      setTempAmount(record.amount?.toString() || '');
    }
  };

  const handleCancelEdit = () => {
    setEditingAmount(null);
    setTempAmount('');
  };
  
  const handleMarkPaid = async (record: RecordWithBalance) => {
    if (confirmingPaid === record.id) {
      try {
        await markRecordAsPaid(record.id);
        
        // Refresh the data
        const [newRecords, newBalance] = await Promise.all([getRecords(), getBalance()]);
        setRecords(newRecords);
        setCurrentBalance(newBalance);
        setConfirmingPaid(null);
      } catch (error) {
        console.error('Error marking record as paid:', error);
        alert('Failed to mark record as paid. Please try again.');
      }
    } else {
      setConfirmingPaid(record.id);
    }
  };
  
  const handleCancelPaid = () => {
    setConfirmingPaid(null);
  };
  
  // Calculate running balance for unpaid records
  let runningBalance = currentBalance;
  const recordsWithBalance = records.map((record: Record) => {
    if (!record.paid && record.amount !== null) {
      const balanceAfter = runningBalance - record.amount;
      runningBalance = balanceAfter;
      return { ...record, balanceAfter };
    }
    return { ...record, balanceAfter: null };
  });
  
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Joint Account Manager</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">v{packageJson.version}</span>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex flex-col gap-4">
          {/* Row 1: Current Balance text and History button */}
          <div className="flex justify-start items-center gap-4">
            <h2 className="text-lg text-gray-600">Current Balance</h2>
            <button
              onClick={handleOpenHistory}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              History
            </button>
          </div>
          
          {/* Row 2: Balance amount and action buttons */}
          <div className="flex justify-between items-center">
            <p className="text-3xl font-bold">${currentBalance.toFixed(2)}</p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsDepositModalOpen(true)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Add Deposit
              </button>
              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Add Withdraw
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onSubmit={handleTransaction}
        title="Add Deposit"
        type="deposit"
      />

      <Modal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        onSubmit={handleTransaction}
        title="Add Withdraw"
        type="withdraw"
      />
      
      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsHistoryModalOpen(false)} />
          {/* Modal */}
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-w-full bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-xl flex flex-col max-h-[80vh]">
            <h2 className="text-xl font-bold mb-6">View Transaction History</h2>
            <div className="flex-1 overflow-y-auto mb-4">
              {historyLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No history found.</div>
              ) : (
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left p-2 font-semibold">Date</th>
                      <th className="text-left p-2 font-semibold">Delta</th>
                      <th className="text-left p-2 font-semibold">Amount</th>
                    
                      <th className="text-left p-2 font-semibold">Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-2 whitespace-nowrap">{item.date}</td>
                        <td className="p-2 whitespace-nowrap">
                          {item.delta != null ? (
                            <span style={{ color: item.delta < 0 ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
                              {item.delta > 0 ? '+' : ''}{item.delta.toFixed(2)}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-2 whitespace-nowrap">${item.amount.toFixed(2)}</td>
                        <td className="p-2">{item.comment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {[10, 20, 50].map((limit) => (
                  <button
                    key={limit}
                    onClick={() => setHistoryLimit(limit)}
                    className={`px-3 py-1 rounded ${historyLimit === limit ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {limit}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
            {recordsWithBalance.map((record: RecordWithBalance) => (
              <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-4">{record.date}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${record.acctName.startsWith('K') ? 'bg-orange-500' : 'bg-blue-800'}`}></div>
                    {record.acctName}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {editingAmount === record.id ? (
                      <>
                        <input
                          type="number"
                          step="0.01"
                          value={tempAmount}
                          onChange={(e) => setTempAmount(e.target.value)}
                          className="w-28 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          autoFocus
                        />
                        <div className="flex gap-2 w-[180px] sm:w-[180px] w-auto">
                          <button
                            onClick={() => handleAmountEdit(record)}
                            className="px-2 sm:px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-sm hover:shadow transition-all duration-200 flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span className="hidden sm:inline">Save</span>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-2 sm:px-3 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 shadow-sm hover:shadow transition-all duration-200 flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                            <span className="hidden sm:inline">Cancel</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className={`inline-block w-28 ${record.amount === null ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                          {record.amount !== null ? `$${record.amount.toFixed(2)}` : 'N/A'}
                        </span>
                        {!record.paid && (
                          <div className="w-[180px] sm:w-[180px] w-auto">
                            <button
                              onClick={() => handleAmountEdit(record)}
                              className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all duration-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                              </svg>
                              <span className="hidden sm:inline">Edit Amount</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  {record.balanceAfter !== null ? (
                    <span style={{ 
                      color: record.balanceAfter < 0 ? '#dc2626' : 'inherit',
                      fontWeight: record.balanceAfter < 0 ? 'bold' : 'normal'
                    }}>
                      ${record.balanceAfter.toFixed(2)}
                    </span>
                  ) : '-'}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <span className={`inline-block w-20 text-center px-2 py-1 rounded-full text-sm ${
                      record.paid 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.paid ? 'Paid' : 'Unpaid'}
                    </span>
                    {!record.paid && (
                      <div className="w-[180px] sm:w-[180px] w-auto">
                        {confirmingPaid === record.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleMarkPaid(record)}
                              className="px-2 sm:px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-sm hover:shadow transition-all duration-200 flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                              <span className="hidden sm:inline">Submit</span>
                            </button>
                            <button
                              onClick={handleCancelPaid}
                              className="px-2 sm:px-3 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 shadow-sm hover:shadow transition-all duration-200 flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                              <span className="hidden sm:inline">Cancel</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleMarkPaid(record)}
                            className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span className="hidden sm:inline">Mark Paid</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
