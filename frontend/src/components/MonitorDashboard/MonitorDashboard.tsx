import { useState } from 'react';
import { TransactionList } from '../TransactionList/TransactionList';
import { StatusFilter } from '../../types/enums';
import { useTransactionHub } from '../../hooks/useTransactionHub';
import { MonitorHeader } from './MonitorHeader';
import { Pagination } from './Pagination';
import './MonitorDashboard.css';

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

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  return (
    <section className="monitor-page">
      <MonitorHeader
        connectionState={connectionState}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        totalCount={totalCount}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
      />

      <TransactionList
        transactions={transactions}
        statusFilter={statusFilter}
        isLoading={isLoading}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        isLoading={isLoading}
        onPageChange={goToPage}
      />
    </section>
  );
}
