import * as signalR from '@microsoft/signalr';
import { API_BASE_URL, HUB_URL } from '../types/transaction';
import type { PagedResult, Transaction } from '../types/transaction';

const PAGE_SIZE = 50;
const BATCH_INTERVAL_MS = 100;

export interface TransactionHubState {
  transactions: Transaction[];
  connectionState: string;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalCount: number;
  isLoading: boolean;
  pageSize: number;
}

type Listener = () => void;

const initialState: TransactionHubState = {
  transactions: [],
  connectionState: 'Connecting',
  page: 1,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
  totalCount: 0,
  isLoading: false,
  pageSize: PAGE_SIZE,
};

function mergeById(existing: Transaction[], incoming: Transaction[]): Transaction[] {
  const seen = new Set<string>();
  const result: Transaction[] = [];

  for (const item of [...incoming, ...existing]) {
    if (seen.has(item.transactionId)) continue;
    seen.add(item.transactionId);
    result.push(item);
  }

  return result;
}

async function fetchTransactionsPage(page: number): Promise<PagedResult<Transaction>> {
  const response = await fetch(
    `${API_BASE_URL}/api/transactions?page=${page}&pageSize=${PAGE_SIZE}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to load transactions: ${response.status}`);
  }
  return (await response.json()) as PagedResult<Transaction>;
}

export class TransactionHub {
  private state: TransactionHubState = { ...initialState };
  private listeners = new Set<Listener>();
  private pending: Transaction[] = [];
  private flushTimer: number | null = null;
  private connection: signalR.HubConnection | null = null;
  private stopped = true;

  getSnapshot = (): TransactionHubState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  async start(): Promise<void> {
    this.stopped = false;
    this.setState({ isLoading: true });

    try {
      this.applyPage(await fetchTransactionsPage(1));
    } catch {
      if (!this.stopped) this.setState({ connectionState: 'SnapshotFailed' });
    } finally {
      if (!this.stopped) this.setState({ isLoading: false });
    }

    if (!this.stopped) {
      await this.connectHub();
    }
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.flushTimer !== null) {
      window.clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const connection = this.connection;
    this.connection = null;
    await connection?.stop();
  }

  goToPage = async (nextPage: number): Promise<void> => {
    const { page, totalPages, isLoading } = this.state;
    if (isLoading || nextPage < 1 || nextPage === page) return;
    if (totalPages > 0 && nextPage > totalPages) return;

    this.setState({ isLoading: true });
    try {
      this.applyPage(await fetchTransactionsPage(nextPage));
    } catch {
      // Keep the current page visible on failure.
    } finally {
      this.setState({ isLoading: false });
    }
  };

  private async connectHub(): Promise<void> {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .build();

    this.connection = connection;

    connection.on('InitialSnapshot', (snapshot: Transaction[]) => {
      if (this.stopped || this.state.page !== 1) return;

      const { transactions } = this.state;
      this.setState({
        transactions:
          transactions.length === 0
            ? snapshot
            : mergeById(transactions, snapshot).slice(0, PAGE_SIZE),
      });
    });

    connection.on('TransactionReceived', (transaction: Transaction) => {
      this.pending.push(transaction);
      this.scheduleFlush();
    });

    connection.onreconnecting(() => this.setState({ connectionState: 'Reconnecting' }));
    connection.onreconnected(() => this.setState({ connectionState: 'Connected' }));
    connection.onclose(() => this.setState({ connectionState: 'Disconnected' }));

    try {
      await connection.start();
      if (this.stopped) return;

      this.setState({ connectionState: 'Connected' });
      await connection.invoke('JoinDashboard');
    } catch {
      if (!this.stopped) this.setState({ connectionState: 'Disconnected' });
    }
  }

  private applyPage(result: PagedResult<Transaction>): void {
    this.setState({
      transactions: result.items,
      page: result.page,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
      totalCount: result.totalCount,
    });
  }

  private scheduleFlush(): void {
    if (this.flushTimer !== null) return;

    this.flushTimer = window.setTimeout(() => {
      this.flushTimer = null;
      this.flushPending();
    }, BATCH_INTERVAL_MS);
  }

  private flushPending(): void {
    const batch = this.pending;
    if (batch.length === 0) return;
    this.pending = [];

    // Live rows only update page 1; elsewhere just bump the total.
    if (this.state.page !== 1) {
      this.setState({ totalCount: this.state.totalCount + batch.length });
      return;
    }

    const existingIds = new Set(this.state.transactions.map((t) => t.transactionId));
    const added = batch.filter((t) => !existingIds.has(t.transactionId)).length;

    this.setState({
      transactions: mergeById(this.state.transactions, batch).slice(0, PAGE_SIZE),
      totalCount: this.state.totalCount + added,
    });
  }

  private setState(partial: Partial<TransactionHubState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => listener());
  }
}
