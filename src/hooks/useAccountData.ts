import { useCallback, useEffect, useState } from 'react';

import { getBalance, getRecords, UnauthorizedError } from '@/lib/api';
import type { PaymentRecord } from '@/lib/types';

/**
 * Owns the records + balance pair. They are always fetched together because
 * every mutation on either side can change the other.
 */
export function useAccountData() {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);

  const refresh = useCallback(async () => {
    const [nextRecords, nextBalance] = await Promise.all([getRecords(), getBalance()]);
    setRecords(nextRecords);
    setCurrentBalance(nextBalance);
  }, []);

  useEffect(() => {
    // This app is a static export with no server rendering, so the initial load
    // genuinely has to happen client-side on mount. The setState calls happen in
    // refresh()'s async continuation, not synchronously during the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh().catch((error) => {
      // On 401 the app re-locks and shows the login modal; not an error to log.
      if (error instanceof UnauthorizedError) return;
      console.error('Failed to load account data:', error);
    });
  }, [refresh]);

  return { records, currentBalance, refresh };
}
