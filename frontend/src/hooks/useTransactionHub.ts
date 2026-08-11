import { useCallback, useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { API_BASE_URL, HUB_URL } from '../types/transaction';
import type { PagedResult, Transaction } from '../types/transaction';

const PAGE_SIZE = 50;
const BATCH_INTERVAL_MS = 100;

function mergeTransactions(existing: Transaction[], incoming: Transaction[]): Transaction[] {
  const merged = [...incoming, ...existing];
  const seen = new Set<string>();
  const deduped: Transaction[] = [];

  for (const item of merged) {
    if (seen.has(item.transactionId)) {
      continue;
    }
    seen.add(item.transactionId);
    deduped.push(item);
  }

  return deduped;
}

export function useTransactionHub() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [connectionState, setConnectionState] = useState<string>('Connecting');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const pendingRef = useRef<Transaction[]>([]);
  const flushScheduledRef = useRef(false);
  const loadingRef = useRef(false);
  const pageRef = useRef(1);

  const applyPageResult = useCallback((result: PagedResult<Transaction>) => {
    setTransactions(result.items);
    setPage(result.page);
    pageRef.current = result.page;
    setTotalPages(result.totalPages);
    setHasNextPage(result.hasNextPage);
    setHasPreviousPage(result.hasPreviousPage);
    setTotalCount(result.totalCount);
  }, []);

  const flushPending = useCallback(() => {
    flushScheduledRef.current = false;
    const batch = pendingRef.current;
    if (batch.length === 0) {
      return;
    }

    pendingRef.current = [];

    // Live updates only belong on the newest page.
    if (pageRef.current !== 1) {
      setTotalCount((total) => total + batch.length);
      return;
    }

    setTransactions((current) => {
      const existingIds = new Set(current.map((item) => item.transactionId));
      const uniqueNew = batch.filter((item) => !existingIds.has(item.transactionId));
      if (uniqueNew.length > 0) {
        queueMicrotask(() => setTotalCount((total) => total + uniqueNew.length));
      }
      return mergeTransactions(current, batch).slice(0, PAGE_SIZE);
    });
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushScheduledRef.current) {
      return;
    }

    flushScheduledRef.current = true;
    window.setTimeout(flushPending, BATCH_INTERVAL_MS);
  }, [flushPending]);

  const enqueueTransactions = useCallback(
    (items: Transaction[]) => {
      pendingRef.current.push(...items);
      scheduleFlush();
    },
    [scheduleFlush],
  );

  const goToPage = useCallback(
    async (nextPage: number) => {
      if (nextPage < 1 || loadingRef.current) {
        return;
      }

      if (totalPages > 0 && nextPage > totalPages) {
        return;
      }

      loadingRef.current = true;
      setIsLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/transactions?page=${nextPage}&pageSize=${PAGE_SIZE}`,
        );
        if (!response.ok) {
          throw new Error(`Failed to load transactions: ${response.status}`);
        }

        const result = (await response.json()) as PagedResult<Transaction>;
        applyPageResult(result);
      } catch {
        // Keep the current page visible on failure.
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
      }
    },
    [applyPageResult, totalPages],
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/transactions?page=1&pageSize=${PAGE_SIZE}`,
        );
        if (response.ok) {
          const result = (await response.json()) as PagedResult<Transaction>;
          if (!cancelled) {
            applyPageResult(result);
          }
        } else if (!cancelled) {
          setConnectionState('SnapshotFailed');
        }
      } catch {
        if (!cancelled) {
          setConnectionState('SnapshotFailed');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL)
        .withAutomaticReconnect()
        .build();

      connection.on('InitialSnapshot', (snapshot: Transaction[]) => {
        if (!cancelled && pageRef.current === 1) {
          setTransactions((current) =>
            current.length === 0 ? snapshot : mergeTransactions(current, snapshot).slice(0, PAGE_SIZE),
          );
        }
      });

      connection.on('TransactionReceived', (transaction: Transaction) => {
        enqueueTransactions([transaction]);
      });

      connection.onreconnecting(() => setConnectionState('Reconnecting'));
      connection.onreconnected(() => setConnectionState('Connected'));
      connection.onclose(() => setConnectionState('Disconnected'));

      try {
        await connection.start();
        if (!cancelled) {
          setConnectionState('Connected');
          await connection.invoke('JoinDashboard');
        }
      } catch {
        if (!cancelled) {
          setConnectionState('Disconnected');
        }
      }

      return connection;
    }

    const connectionPromise = bootstrap();

    return () => {
      cancelled = true;
      connectionPromise.then((connection) => connection?.stop());
    };
  }, [applyPageResult, enqueueTransactions]);

  return {
    transactions,
    connectionState,
    page,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    totalCount,
    isLoading,
    goToPage,
    pageSize: PAGE_SIZE,
  };
}
