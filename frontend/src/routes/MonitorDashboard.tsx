import { useState } from 'react';
import { TransactionList } from '../components/TransactionList';
import type { StatusFilter } from '../components/TransactionList';
import { useTransactionHub } from '../hooks/useTransactionHub';
import './MonitorDashboard.css';

const statusFilters: StatusFilter[] = ['All', 'Pending', 'Completed', 'Failed'];

export function MonitorDashboard() {
  const { transactions, connectionState } = useTransactionHub();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

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
          <span className="transaction-count">{transactions.length} loaded</span>
        </div>
      </header>

      <TransactionList transactions={transactions} statusFilter={statusFilter} />
    </section>
  );
}
