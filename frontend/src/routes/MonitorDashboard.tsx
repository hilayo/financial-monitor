import { useMemo, useState } from 'react';
import { TransactionList } from '../components/TransactionList';
import type { StatusFilter } from '../components/TransactionList';
import { useTransactionHub } from '../hooks/useTransactionHub';
import './MonitorDashboard.css';

const statusFilters: StatusFilter[] = ['All', 'Pending', 'Completed', 'Failed'];

function buildPageNumbers(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }

  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const result: Array<number | 'ellipsis'> = [];

  for (const page of sorted) {
    const previous = result[result.length - 1];
    if (typeof previous === 'number' && page - previous > 1) {
      result.push('ellipsis');
    }
    result.push(page);
  }

  return result;
}

export function MonitorDashboard() {
  const {
    transactions,
    connectionState,
    page,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    totalCount,
    isLoading,
    goToPage,
    pageSize,
  } = useTransactionHub();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  const pageNumbers = useMemo(() => buildPageNumbers(page, totalPages), [page, totalPages]);
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  return (
    <section className="monitor-page">
      <header className="monitor-header">
        <div>
          <h1>Live Dashboard</h1>
          <p>Real-time transaction feed for support agents.</p>
        </div>
        <div className="monitor-controls">
          <span className={`connection-pill connection-${connectionState.toLowerCase()}`}>
            {connectionState}
          </span>
          <label className="status-filter">
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            >
              {statusFilters.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <span className="transaction-count">
            {totalCount === 0 ? '0 transactions' : `${rangeStart}–${rangeEnd} of ${totalCount}`}
          </span>
        </div>
      </header>

      <TransactionList
        transactions={transactions}
        statusFilter={statusFilter}
        isLoading={isLoading}
      />

      {totalPages > 0 && (
        <nav className="pagination" aria-label="Transaction pages">
          <button
            type="button"
            className="pagination-button"
            disabled={!hasPreviousPage || isLoading}
            onClick={() => goToPage(page - 1)}
          >
            Previous
          </button>

          <div className="pagination-pages">
            {pageNumbers.map((item, index) =>
              item === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={`pagination-page${item === page ? ' is-active' : ''}`}
                  disabled={isLoading || item === page}
                  onClick={() => goToPage(item)}
                  aria-current={item === page ? 'page' : undefined}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            className="pagination-button"
            disabled={!hasNextPage || isLoading}
            onClick={() => goToPage(page + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </section>
  );
}
