/** A scheduled payment against the joint account. */
export interface PaymentRecord {
  id: number;
  acctName: string;
  date: string;
  amount: number | null;
  paid: boolean;
}

/** A payment record annotated with the projected balance once it clears. */
export interface PaymentRecordWithBalance extends PaymentRecord {
  balanceAfter: number | null;
}

/** A point in the account's balance history. */
export interface Balance {
  id: number;
  amount: number;
  delta: number;
  date: string;
  comment: string;
}

export type TransactionType = 'deposit' | 'withdraw';
