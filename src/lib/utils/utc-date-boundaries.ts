/**
 * UTC day boundaries for due-date filters (deterministic API semantics).
 */
export type UtcDayBoundaries = {
  startOfToday: Date;
  startOfTomorrow: Date;
  startTodayPlusDays: (days: number) => Date;
};

export function getUtcDayBoundaries(reference: Date = new Date()): UtcDayBoundaries {
  const y = reference.getUTCFullYear();
  const m = reference.getUTCMonth();
  const d = reference.getUTCDate();
  const startOfToday = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
  const startOfTomorrow = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0));

  return {
    startOfToday,
    startOfTomorrow,
    startTodayPlusDays(days: number) {
      const dt = new Date(startOfToday);
      dt.setUTCDate(dt.getUTCDate() + days);
      return dt;
    },
  };
}
