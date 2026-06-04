export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function matchesText(value, query) {
  if (!query?.trim()) return true;
  return String(value ?? "")
    .toLowerCase()
    .includes(query.trim().toLowerCase());
}

export function matchesAnyText(values, query) {
  if (!query?.trim()) return true;
  const q = query.trim().toLowerCase();
  return values.some((v) => String(v ?? "").toLowerCase().includes(q));
}

export function matchesSelect(value, selected) {
  if (!selected || selected === "all") return true;
  return value === selected;
}

export function matchesDateRange(iso, from, to) {
  if (!from && !to) return true;
  if (!iso) return false;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return false;

  if (from) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    if (time < start.getTime()) return false;
  }

  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (time > end.getTime()) return false;
  }

  return true;
}

export function hasActiveFilters(filters, defaults) {
  return Object.keys(defaults).some((key) => filters[key] !== defaults[key]);
}
