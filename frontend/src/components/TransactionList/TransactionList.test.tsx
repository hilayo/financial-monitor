import { render, screen } from '@testing-library/react';
import { TransactionList } from './TransactionList';
import type { Transaction } from '../../types/transaction';

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 72,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: index,
        start: index * 72,
        size: 72,
        end: (index + 1) * 72,
      })),
  }),
}));

const transactions: Transaction[] = [
  {
    transactionId: 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
    amount: 100,
    currency: 'USD',
    status: 'Pending',
    timestamp: '2026-08-11T10:00:00.000Z',
  },
  {
    transactionId: 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb',
    amount: 250.5,
    currency: 'EUR',
    status: 'Completed',
    timestamp: '2026-08-11T11:00:00.000Z',
  },
  {
    transactionId: 'cccccccc-3333-4333-8333-cccccccccccc',
    amount: 75,
    currency: 'GBP',
    status: 'Failed',
    timestamp: '2026-08-11T12:00:00.000Z',
  },
];

describe('TransactionList', () => {
  it('shows an empty message when there are no transactions', () => {
    render(
      <TransactionList transactions={[]} statusFilter="All" isLoading={false} />,
    );

    expect(screen.getByText('No transactions to display.')).toBeInTheDocument();
  });

  it('shows a loading message while empty and loading', () => {
    render(<TransactionList transactions={[]} statusFilter="All" isLoading />);

    expect(screen.getByText('Loading transactions…')).toBeInTheDocument();
  });

  it('renders all transactions when filter is All', () => {
    render(
      <TransactionList transactions={transactions} statusFilter="All" />,
    );

    expect(screen.getByText('aaaaaaaa')).toBeInTheDocument();
    expect(screen.getByText('bbbbbbbb')).toBeInTheDocument();
    expect(screen.getByText('cccccccc')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('filters transactions by status', () => {
    render(
      <TransactionList transactions={transactions} statusFilter="Completed" />,
    );

    expect(screen.getByText('bbbbbbbb')).toBeInTheDocument();
    expect(screen.queryByText('aaaaaaaa')).not.toBeInTheDocument();
    expect(screen.queryByText('cccccccc')).not.toBeInTheDocument();
  });
});
