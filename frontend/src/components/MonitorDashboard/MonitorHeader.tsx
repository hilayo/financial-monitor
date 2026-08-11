import { StatusFilter, statusFilters } from '../../types/enums';

interface MonitorHeaderProps {
  connectionState: string;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  totalCount: number;
  rangeStart: number;
  rangeEnd: number;
}

export function MonitorHeader({
  connectionState,
  statusFilter,
  onStatusFilterChange,
  totalCount,
  rangeStart,
  rangeEnd,
}: MonitorHeaderProps) {
  return (
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
            onChange={(event) => onStatusFilterChange(event.target.value as StatusFilter)}
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
  );
}
