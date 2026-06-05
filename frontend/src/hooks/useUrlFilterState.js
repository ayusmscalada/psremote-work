import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { hasActiveFilters } from "../utils/tableUtils";
import { getStringParam, setQueryParam, updateSearchParams } from "../utils/urlQuery";

function readFilters(searchParams, defaults) {
  const result = { ...defaults };
  for (const key of Object.keys(defaults)) {
    result[key] = getStringParam(searchParams, key, defaults[key]);
  }
  return result;
}

export function useUrlFilterState(defaults, { pageKey = "page" } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => readFilters(searchParams, defaults));

  useEffect(() => {
    setFilters(readFilters(searchParams, defaults));
  }, [searchParams, defaults]);

  const setFilter = useCallback(
    (key, value) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      updateSearchParams(setSearchParams, (params) => {
        setQueryParam(params, key, value, defaults[key]);
        if (pageKey && params.has(pageKey)) {
          params.delete(pageKey);
        }
      });
    },
    [setSearchParams, defaults, pageKey]
  );

  const clearFilters = useCallback(() => {
    setFilters(defaults);
    updateSearchParams(setSearchParams, (params) => {
      for (const key of Object.keys(defaults)) {
        setQueryParam(params, key, defaults[key], defaults[key]);
      }
      if (pageKey) {
        params.delete(pageKey);
      }
    });
  }, [setSearchParams, defaults, pageKey]);

  return {
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters: hasActiveFilters(filters, defaults),
    defaults,
  };
}
