'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getTransactions, UnauthorizedError } from '@/lib/api';
import type { SpendTransaction, TransactionFilters } from '@/lib/types';

const PAGE_SIZE = 50;

/**
 * Pages through transactions as the user scrolls.
 *
 * Changing a filter resets to page zero and discards what was loaded, so
 * results can never be a mix of two different filter sets. A request counter
 * guards that: a slow response from an earlier filter is dropped rather than
 * appended to results for the current one.
 */
export function useInfiniteTransactions(filters: TransactionFilters, reloadToken = 0) {
  const [transactions, setTransactions] = useState<SpendTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [hasError, setHasError] = useState(false);

  const pageRef = useRef(0);
  const requestIdRef = useRef(0);
  // Read inside loadMore without making it a dependency, which would otherwise
  // rebuild the callback on every page and retrigger the observer.
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  const load = useCallback(
    async (page: number, replace: boolean) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setIsLoading(true);
      setHasError(false);

      const requestId = ++requestIdRef.current;
      try {
        const batch = await getTransactions(filters, page, PAGE_SIZE);
        // A newer request started while this one was in flight — discard it.
        if (requestId !== requestIdRef.current) return;

        setTransactions((current) => (replace ? batch : [...current, ...batch]));
        // The API returns a bare array, so a short page means the end.
        const more = batch.length === PAGE_SIZE;
        hasMoreRef.current = more;
        setHasMore(more);
        pageRef.current = page;
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        // On 401 the login modal takes over; don't also show a load error.
        if (!(error instanceof UnauthorizedError)) {
          console.error('Failed to fetch transactions:', error);
          setHasError(true);
        }
        hasMoreRef.current = false;
        setHasMore(false);
      } finally {
        if (requestId === requestIdRef.current) {
          isLoadingRef.current = false;
          setIsLoading(false);
        }
      }
    },
    // reloadToken is not read here; it is in the dependency list so that
    // importing a statement rebuilds this callback and refetches from page one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, reloadToken],
  );

  // Refetch from the top whenever the filters change. `filters` is memoised by
  // the caller, so this fires on real changes rather than on every render.
  useEffect(() => {
    pageRef.current = 0;
    // Refs, not state: these gate loadMore and must be correct immediately,
    // and load() publishes the real hasMore once the first page comes back.
    hasMoreRef.current = true;
    isLoadingRef.current = false;
    // The effect is the fetch trigger here, not a place deriving state from
    // props; load() flips its loading flag on the way in, which is what the
    // rule sees. Same pattern as the fetch-on-open modals.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(0, true);
  }, [load]);

  const loadMore = useCallback(() => {
    if (isLoadingRef.current || !hasMoreRef.current) return;
    void load(pageRef.current + 1, false);
  }, [load]);

  return { transactions, isLoading, hasMore, hasError, loadMore };
}
