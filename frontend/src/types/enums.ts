export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  ILS = 'ILS',
}

export const currencies = Object.values(Currency);

export enum TransactionStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  Failed = 'Failed',
}

export const statuses = Object.values(TransactionStatus);

export enum StatusFilter {
  All = 'All',
  Pending = 'Pending',
  Completed = 'Completed',
  Failed = 'Failed',
}

export const statusFilters = Object.values(StatusFilter);
