import type { Transaction } from '../../types/transaction';
import { formatAmount } from './formatAmount';

interface TransactionRowMainProps {
  transaction: Transaction;
}

export function TransactionRowMain({ transaction }: TransactionRowMainProps) {
  return (
    <div className="transaction-row-main">
      <span className="transaction-id">{transaction.transactionId.slice(0, 8)}</span>
      <strong>{formatAmount(transaction.amount, transaction.currency)}</strong>
    </div>
  );
}
