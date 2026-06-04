export function TableFilters({ children, resultCount, totalCount, onClear, hasActiveFilters }) {
  return (
    <div className="table-filters">
      <div className="table-filters-row">{children}</div>
      <div className="table-filters-meta">
        <span>
          {resultCount} matching{totalCount !== resultCount ? ` of ${totalCount} total` : ""}
        </span>
        {hasActiveFilters && onClear && (
          <button type="button" className="table-filters-clear" onClick={onClear}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

export function FilterField({ label, children, className = "" }) {
  return (
    <label className={`filter-field ${className}`.trim()}>
      <span className="filter-label">{label}</span>
      {children}
    </label>
  );
}
