import { useMemo, useState } from 'react';
import { TransactionList } from '../TransactionList/TransactionList';
import { StatusFilter, statusFilters } from '../../types/enums';
import { useTransactionHub } from '../../hooks/useTransactionHub';
import './MonitorDashboard.css';

function pageRange(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

/** e.g. total=10 → [1,2,3,4,'…',10] | [1,'…',4,5,6,'…',10] | [1,'…',7,8,9,10] */
function buildPageNumbers(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) {
    return pageRange(1, total);
  }

  // Near the start: keep the first four pages visible.
  if (current <= 3) {
    return [...pageRange(1, 4), 'ellipsis', total];
  }

  // Near the end: keep the last four pages visible.
  if (current >= total - 2) {
    return [1, 'ellipsis', ...pageRange(total - 3, total)];
  }

  // In the middle: show a 3-page window around the current page.
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(StatusFilter.All);

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
