import { useMemo } from 'react';
import { buildPageNumbers } from './buildPageNumbers';

interface PaginationProps {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  isLoading,
  onPageChange,
}: PaginationProps) {
  const pageNumbers = useMemo(() => buildPageNumbers(page, totalPages), [page, totalPages]);

  if (totalPages === 0) {
    return null;
  }

  return (
    <nav className="pagination" aria-label="Transaction pages">
      <button
        type="button"
        className="pagination-button"
        disabled={!hasPreviousPage || isLoading}
        onClick={() => onPageChange(page - 1)}
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
              onClick={() => onPageChange(item)}
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
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
