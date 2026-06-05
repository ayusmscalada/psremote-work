import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { hasActiveFilters } from "../utils/tableUtils";
import {
  parseApplicationFiltersFromUrl,
  setQueryParam,
  updateSearchParams,
  writeApplicationFiltersToParams,
} from "../utils/urlQuery";

const baseDefaults = {
  search: "",
  bidStatus: "all",
  screenshot: "all",
  registeredFrom: "",
  registeredTo: "",
};

function readApplicationFilters(searchParams, includeWorker, defaults) {
  if (!searchParams) return defaults;
  return parseApplicationFiltersFromUrl(searchParams, { includeWorker });
}

export function useJobApplicationFilterState({ includeWorker = false, syncToUrl = false } = {}) {
  const defaults = useMemo(
    () => (includeWorker ? { ...baseDefaults, worker: "all" } : baseDefaults),
    [includeWorker]
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() =>
    syncToUrl ? readApplicationFilters(searchParams, includeWorker, defaults) : defaults
  );

  useEffect(() => {
    if (!syncToUrl) return;
    setFilters(readApplicationFilters(searchParams, includeWorker, defaults));
  }, [searchParams, syncToUrl, includeWorker, defaults]);

  const setFilter = useCallback(
    (key, value) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      if (!syncToUrl) return;
      updateSearchParams(setSearchParams, (params) => {
        setQueryParam(params, key, value, defaults[key]);
        params.delete("page");
      });
    },
    [syncToUrl, setSearchParams, defaults]
  );

  const clearFilters = useCallback(() => {
    setFilters(defaults);
    if (!syncToUrl) return;
    updateSearchParams(setSearchParams, (params) => {
      writeApplicationFiltersToParams(params, defaults, defaults);
      params.delete("page");
    });
  }, [syncToUrl, setSearchParams, defaults]);

  return {
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters: hasActiveFilters(filters, defaults),
    defaults,
  };
}
