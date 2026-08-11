import { TransactionStatus } from '../../types/enums';

export const statusClass: Record<TransactionStatus, string> = {
  [TransactionStatus.Pending]: 'status-pending',
  [TransactionStatus.Completed]: 'status-completed',
  [TransactionStatus.Failed]: 'status-failed',
};
