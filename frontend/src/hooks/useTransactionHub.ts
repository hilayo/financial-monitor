import { useCallback, useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { API_BASE_URL, HUB_URL } from '../types/transaction';
import type { Transaction } from '../types/transaction';

const MAX_TRANSACTIONS = 500;
const BATCH_INTERVAL_MS = 100;

export function useTransactionHub() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [connectionState, setConnectionState] = useState<string>('Connecting');
  const pendingRef = useRef<Transaction[]>([]);
  const flushScheduledRef = useRef(false);

  const flushPending = useCallback(() => {
    flushScheduledRef.current = false;
    const batch = pendingRef.current;
    if (batch.length === 0) {
      return;
    }

    pendingRef.current = [];
    setTransactions((current) => {
      const merged = [...batch, ...current];
      const seen = new Set<string>();
      const deduped: Transaction[] = [];

      for (const item of merged) {
        if (seen.has(item.transactionId)) {
          continue;
        }
        seen.add(item.transactionId);
        deduped.push(item);
      }

      return deduped.slice(0, MAX_TRANSACTIONS);
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

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/transactions?limit=50`);
        if (response.ok) {
          const snapshot = (await response.json()) as Transaction[];
          if (!cancelled) {
            setTransactions(snapshot.slice(0, MAX_TRANSACTIONS));
          }
        }
      } catch {
        if (!cancelled) {
          setConnectionState('SnapshotFailed');
        }
      }

      const connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL)
        .withAutomaticReconnect()
        .build();

      connection.on('InitialSnapshot', (snapshot: Transaction[]) => {
        if (!cancelled) {
          setTransactions(snapshot.slice(0, MAX_TRANSACTIONS));
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
  }, [enqueueTransactions]);

  return { transactions, connectionState };
}
