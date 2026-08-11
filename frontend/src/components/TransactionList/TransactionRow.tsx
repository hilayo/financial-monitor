import type { Transaction } from '../../types/transaction';
import { TransactionRowMain } from './TransactionRowMain';
import { TransactionRowMeta } from './TransactionRowMeta';
import { statusClass } from './statusClass';

interface TransactionRowProps {
  transaction: Transaction;
  start: number;
}

export function TransactionRow({ transaction, start }: TransactionRowProps) {
  return (
    <article
      className={`transaction-row ${statusClass[transaction.status]}`}
      style={{
        transform: `translateY(${start}px)`,
      }}
    >
      <TransactionRowMain transaction={transaction} />
      <TransactionRowMeta transaction={transaction} />
    </article>
  );
}
