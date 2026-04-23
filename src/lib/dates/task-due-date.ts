/**
 * Treat task due dates as calendar dates in UTC to avoid local timezone shifting
 * the displayed day when the API stores midnight UTC for a chosen calendar date.
 */

export function dueDateToInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dueDateToDisplayLabel(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/** Convert `<input type="date">` value (YYYY-MM-DD) to an ISO instant at UTC midnight. */
export function inputDateToDueIso(dateStr: string): string | null {
  const trimmed = dateStr.trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return `${trimmed}T00:00:00.000Z`;
}
