import { useMemo, useState } from "react";
import {
  hasActiveFilters,
  matchesAnyText,
  matchesDateRange,
  matchesSelect,
} from "../utils/tableUtils";

const baseDefaults = {
  search: "",
  bidStatus: "all",
  screenshot: "all",
  registeredFrom: "",
  registeredTo: "",
};

export function useJobApplicationFilters(applications, { includeWorker = false } = {}) {
  const defaults = includeWorker
    ? { ...baseDefaults, worker: "all" }
    : baseDefaults;

  const [filters, setFilters] = useState(defaults);

  const workerOptions = useMemo(() => {
    if (!includeWorker) return [];
    const names = new Set(
      applications.map((app) => app.workerUsername).filter(Boolean)
    );
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [applications, includeWorker]);

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      if (
        !matchesAnyText(
          [
            app.jobTitle,
            app.companyName,
            app.jobLink,
            app.workerUsername,
            app.customerUsername,
          ],
          filters.search
        )
      ) {
        return false;
      }
      if (!matchesSelect(app.bidStatus, filters.bidStatus)) return false;
      if (filters.screenshot === "yes" && !app.screenshotLink) return false;
      if (filters.screenshot === "no" && app.screenshotLink) return false;
      if (
        includeWorker &&
        filters.worker !== "all" &&
        app.workerUsername !== filters.worker
      ) {
        return false;
      }
      if (!matchesDateRange(app.createdAt, filters.registeredFrom, filters.registeredTo)) {
        return false;
      }
      return true;
    });
  }, [applications, filters, includeWorker]);

  function setFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilters(defaults);
  }

  return {
    filtered,
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters: hasActiveFilters(filters, defaults),
    workerOptions,
  };
}
