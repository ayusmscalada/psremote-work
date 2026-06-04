import { PAGE_SIZE_OPTIONS } from "../hooks/usePagination";

export default function TablePagination({
  page,
  totalPages,
  totalItems,
  rangeStart,
  rangeEnd,
  pageSize,
  onPageChange,
  onPageSizeChange,
  hasPrev,
  hasNext,
}) {
  if (totalItems === 0) {
    return null;
  }

  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="table-pagination">
      <div className="table-pagination-info">
        Showing {rangeStart}–{rangeEnd} of {totalItems}
      </div>
      <div className="table-pagination-controls">
        <label className="table-pagination-size">
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(e.target.value)}
            aria-label="Rows per page"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="table-pagination-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          aria-label="Previous page"
        >
          Previous
        </button>
        <div className="table-pagination-pages" role="navigation" aria-label="Pagination">
          {pageNumbers.map((num, index) =>
            num === "…" ? (
              <span key={`ellipsis-${index}`} className="table-pagination-ellipsis">
                …
              </span>
            ) : (
              <button
                key={num}
                type="button"
                className={`table-pagination-page${num === page ? " is-active" : ""}`}
                onClick={() => onPageChange(num)}
                aria-label={`Page ${num}`}
                aria-current={num === page ? "page" : undefined}
              >
                {num}
              </button>
            )
          )}
        </div>
        <button
          type="button"
          className="table-pagination-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function getPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push("…");
    }
    result.push(sorted[i]);
  }
  return result;
}
