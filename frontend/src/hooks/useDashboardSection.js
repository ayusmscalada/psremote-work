import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { setQueryParam } from "../utils/urlQuery";

export function useDashboardSection(defaultSection, validSections) {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromUrl = searchParams.get("section");
  const section = validSections.includes(fromUrl) ? fromUrl : defaultSection;

  const setSection = useCallback(
    (next) => {
      setSearchParams(
        (prev) => {
          const current = prev.get("section") || defaultSection;
          const nextParams = new URLSearchParams();
          nextParams.set("section", next);
          if (current === next) {
            for (const [key, value] of prev.entries()) {
              if (key !== "section") {
                nextParams.set(key, value);
              }
            }
          }
          return nextParams;
        },
        { replace: true }
      );
    },
    [setSearchParams, defaultSection]
  );

  const getParam = useCallback(
    (name, fallback = "") => searchParams.get(name) ?? fallback,
    [searchParams]
  );

  const setParam = useCallback(
    (name, value, defaultValue = "") => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          setQueryParam(next, name, value, defaultValue);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  return { section, setSection, searchParams, setSearchParams, getParam, setParam };
}
