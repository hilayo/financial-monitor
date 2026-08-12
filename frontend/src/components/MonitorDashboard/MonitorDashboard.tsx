import { useEffect, useState, useSyncExternalStore } from 'react';
import { TransactionList } from '../TransactionList/TransactionList';
import { StatusFilter } from '../../types/enums';
import { TransactionHub } from '../../helpers/transactionHub';
import { MonitorHeader } from './MonitorHeader';
import { Pagination } from './Pagination';
import './MonitorDashboard.css';

export function MonitorDashboard() {
  const [hub] = useState(() => new TransactionHub());
  const {
    transactions,
    connectionState,
    page,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    totalCount,
    isLoading,
    pageSize,
  } = useSyncExternalStore(hub.subscribe, hub.getSnapshot);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(StatusFilter.All);

  useEffect(() => {
    void hub.start();
    return () => {
      void hub.stop();
    };
  }, [hub]);

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
        onPageChange={hub.goToPage}
      />
    </section>
  );
}
