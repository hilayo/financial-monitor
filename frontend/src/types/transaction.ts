export { TransactionStatus } from './enums';
import type { TransactionStatus } from './enums';

export interface Transaction {
  transactionId: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  timestamp: string;
}

export interface TransactionRequest {
  transactionId: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  timestamp: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5289';
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';
export const HUB_URL = `${API_BASE_URL}/hubs/transactions`;
