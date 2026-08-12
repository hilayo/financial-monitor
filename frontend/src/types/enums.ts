export const ROUTES = {
  HOME: '/',
  ADD: '/add',
  MONITOR: '/monitor',
} as const;

export const Currency = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  ILS: 'ILS',
} as const;

export type Currency = (typeof Currency)[keyof typeof Currency];

export const currencies = Object.values(Currency);

export const TransactionStatus = {
  Pending: 'Pending',
  Completed: 'Completed',
  Failed: 'Failed',
} as const;

export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

export const statuses = Object.values(TransactionStatus);

export const StatusFilter = {
  All: 'All',
  Pending: 'Pending',
  Completed: 'Completed',
  Failed: 'Failed',
} as const;

export type StatusFilter = (typeof StatusFilter)[keyof typeof StatusFilter];

export const statusFilters = Object.values(StatusFilter);
