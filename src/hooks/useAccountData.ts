import { useCallback, useEffect, useRef, useState } from 'react';

import { getBalance, getRecords, UnauthorizedError } from '@/lib/api';
import type { PaymentRecord } from '@/lib/types';

/** The window the page opens on, and how much each "load earlier" adds. */
const WINDOW_STEP_DAYS = 7;

/**
 * Owns the records + balance pair. They are always fetched together because
 * every mutation on either side can change the other.
 *
 * Loading earlier records widens the window and refetches the whole list rather
 * than appending a page to it. That is deliberate: the projected balance is
 * computed by walking the records in order, so a partial list would produce
 * wrong numbers, and the volume here is a handful of rows per week.
 */
export function useAccountData() {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [hasEarlier, setHasEarlier] = useState(true);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);

  // The window currently on screen. A ref because refresh() has to read it
  // without being rebuilt every time it grows — rebuilding would retrigger the
  // mount effect and refetch on every widening.
  const daysRef = useRef(WINDOW_STEP_DAYS);
  // Guards against an older response overwriting a newer one: a mutation's
  // refresh and a widening can be in flight at the same time.
  const requestIdRef = useRef(0);

  const load = useCallback(async (days: number) => {
    const requestId = ++requestIdRef.current;
    const [nextRecords, nextBalance] = await Promise.all([getRecords(days), getBalance()]);

    // A newer request started while this one was in flight — discard it.
    if (requestId !== requestIdRef.current) return null;

    daysRef.current = days;
    setRecords(nextRecords);
    setCurrentBalance(nextBalance);
    return nextRecords;
  }, []);

  const refresh = useCallback(async () => {
    await load(daysRef.current);
  }, [load]);

  const loadEarlier = useCallback(async () => {
    if (isLoadingEarlier) return;
    setIsLoadingEarlier(true);

    const before = records.length;
    try {
      const widened = await load(daysRef.current + WINDOW_STEP_DAYS);
      // Superseded by a newer request, which settles the list itself.
      if (widened === null) return;
      // A wider window that found nothing extra means there is nothing extra to
      // find: the history starts inside the window we already had.
      setHasEarlier(widened.length > before);
    } catch (error) {
      // On 401 the app re-locks and shows the login modal; not an error to log.
      if (!(error instanceof UnauthorizedError)) {
        console.error('Failed to load earlier records:', error);
      }
    } finally {
      setIsLoadingEarlier(false);
    }
  }, [isLoadingEarlier, load, records.length]);

  useEffect(() => {
    // This app is a static export with no server rendering, so the initial load
    // genuinely has to happen client-side on mount. The setState calls happen in
    // load()'s async continuation, not synchronously during the effect.
    refresh().catch((error) => {
      // On 401 the app re-locks and shows the login modal; not an error to log.
      if (error instanceof UnauthorizedError) return;
      console.error('Failed to load account data:', error);
    });
  }, [refresh]);

  return { records, currentBalance, refresh, loadEarlier, hasEarlier, isLoadingEarlier };
}
