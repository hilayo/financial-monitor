import type { Transaction } from '../../types/transaction';
import { statusClass } from './statusClass';

interface TransactionRowMetaProps {
  transaction: Transaction;
}

export function TransactionRowMeta({ transaction }: TransactionRowMetaProps) {
  return (
    <div className="transaction-row-meta">
      <span className={`status-badge ${statusClass[transaction.status]}`}>
        {transaction.status}
      </span>
      <time dateTime={transaction.timestamp}>
        {new Date(transaction.timestamp).toLocaleString()}
      </time>
    </div>
  );
}
