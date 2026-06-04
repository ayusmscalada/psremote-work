import { useState } from "react";
import { hasActiveFilters } from "../utils/tableUtils";

const baseDefaults = {
  search: "",
  bidStatus: "all",
  screenshot: "all",
  registeredFrom: "",
  registeredTo: "",
};

export function useJobApplicationFilterState({ includeWorker = false } = {}) {
  const defaults = includeWorker ? { ...baseDefaults, worker: "all" } : baseDefaults;
  const [filters, setFilters] = useState(defaults);

  function setFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilters(defaults);
  }

  return {
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters: hasActiveFilters(filters, defaults),
    defaults,
  };
}
