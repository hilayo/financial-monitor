export type TransactionStatus = 'Pending' | 'Completed' | 'Failed';

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

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5289';

export const HUB_URL = `${API_BASE_URL}/hubs/transactions`;
