import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { StatusFilter, TransactionStatus } from '../../types/enums';
import type { Transaction } from '../../types/transaction';
import './TransactionList.css';

export type { StatusFilter };

interface TransactionListProps {
  transactions: Transaction[];
  statusFilter: StatusFilter;
  isLoading?: boolean;
}

const statusClass: Record<TransactionStatus, string> = {
  [TransactionStatus.Pending]: 'status-pending',
  [TransactionStatus.Completed]: 'status-completed',
  [TransactionStatus.Failed]: 'status-failed',
};

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function TransactionList({
  transactions,
  statusFilter,
  isLoading = false,
}: TransactionListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const filtered =
    statusFilter === StatusFilter.All
      ? transactions
      : transactions.filter((transaction) => transaction.status === statusFilter);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 8,
  });

  if (filtered.length === 0) {
    return (
      <div className="transaction-list empty">
        <p>{isLoading ? 'Loading transactions…' : 'No transactions to display.'}</p>
      </div>
    );
  }

  return (
    <div ref={parentRef} className={`transaction-list${isLoading ? ' is-loading' : ''}`}>
      <div
        className="transaction-list-inner"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const transaction = filtered[virtualRow.index];
          return (
            <article
              key={transaction.transactionId}
              className={`transaction-row ${statusClass[transaction.status]}`}
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="transaction-row-main">
                <span className="transaction-id">{transaction.transactionId.slice(0, 8)}</span>
                <strong>{formatAmount(transaction.amount, transaction.currency)}</strong>
              </div>
              <div className="transaction-row-meta">
                <span className={`status-badge ${statusClass[transaction.status]}`}>
                  {transaction.status}
                </span>
                <time dateTime={transaction.timestamp}>
                  {new Date(transaction.timestamp).toLocaleString()}
                </time>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
