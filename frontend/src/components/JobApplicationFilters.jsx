import { BID_STATUSES } from "../constants";
import { FilterField, TableFilters } from "./TableFilters";

export default function JobApplicationFilters({
  filters,
  setFilter,
  clearFilters,
  hasActiveFilters,
  resultCount,
  totalCount,
  workerOptions = [],
  workerFilterLabel = "Registered by",
  bidStatusFilterLabel = "Assignee bid status",
}) {
  return (
    <TableFilters
      resultCount={resultCount}
      totalCount={totalCount}
      onClear={clearFilters}
      hasActiveFilters={hasActiveFilters}
    >
      <FilterField label="Search" className="filter-field--grow">
        <input
          type="search"
          placeholder="Title, company, link, worker…"
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
        />
      </FilterField>
      <FilterField label={bidStatusFilterLabel}>
        <select
          value={filters.bidStatus}
          onChange={(e) => setFilter("bidStatus", e.target.value)}
        >
          <option value="all">All</option>
          {BID_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </FilterField>
      <FilterField label="Screenshot">
        <select
          value={filters.screenshot}
          onChange={(e) => setFilter("screenshot", e.target.value)}
        >
          <option value="all">All</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </FilterField>
      {workerOptions.length > 0 && (
        <FilterField label={workerFilterLabel}>
          <select
            value={filters.worker}
            onChange={(e) => setFilter("worker", e.target.value)}
          >
            <option value="all">All</option>
            {workerOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </FilterField>
      )}
      <FilterField label="Registered from">
        <input
          type="date"
          value={filters.registeredFrom}
          onChange={(e) => setFilter("registeredFrom", e.target.value)}
        />
      </FilterField>
      <FilterField label="Registered to">
        <input
          type="date"
          value={filters.registeredTo}
          onChange={(e) => setFilter("registeredTo", e.target.value)}
        />
      </FilterField>
    </TableFilters>
  );
}
