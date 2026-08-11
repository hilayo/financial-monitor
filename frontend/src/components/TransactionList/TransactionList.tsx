import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { StatusFilter } from '../../types/enums';
import type { Transaction } from '../../types/transaction';
import { TransactionRow } from './TransactionRow';
import './TransactionList.css';

export type { StatusFilter };

interface TransactionListProps {
  transactions: Transaction[];
  statusFilter: StatusFilter;
  isLoading?: boolean;
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
            <TransactionRow
              key={transaction.transactionId}
              transaction={transaction}
              start={virtualRow.start}
            />
          );
        })}
      </div>
    </div>
  );
}
