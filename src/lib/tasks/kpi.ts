import type { ApiTaskWithSubtasks } from "@/lib/api-client/tasks";
import { getUtcDayBoundaries } from "@/lib/utils/utc-date-boundaries";

export type TaskKpiSnapshot = {
  /** Total tasks matching current filters (from API). */
  totalFiltered: number;
  /** Counts derived from the currently loaded page of items only. */
  overdueOnPage: number;
  inProgressOnPage: number;
  doneOnPage: number;
  /** True when KPI breakdown may not cover the full filtered set. */
  isPaginated: boolean;
};

export function computeTaskKpis(
  items: ApiTaskWithSubtasks[],
  totalFiltered: number,
  limit: number,
  asOf: Date = new Date(),
): TaskKpiSnapshot {
  const { startOfToday } = getUtcDayBoundaries(asOf);
  let overdueOnPage = 0;
  let inProgressOnPage = 0;
  let doneOnPage = 0;

  for (const t of items) {
    if (t.status === "IN_PROGRESS") inProgressOnPage += 1;
    if (t.status === "DONE") doneOnPage += 1;
    if (t.status !== "DONE" && t.dueDate) {
      const due = new Date(t.dueDate);
      if (!Number.isNaN(due.getTime()) && due < startOfToday) overdueOnPage += 1;
    }
  }

  const isPaginated = totalFiltered > items.length || totalFiltered > limit;

  return {
    totalFiltered,
    overdueOnPage,
    inProgressOnPage,
    doneOnPage,
    isPaginated,
  };
}

/** Same overdue rule as KPI row highlighting (UTC day boundary). */
export function isTaskOverdue(
  task: Pick<ApiTaskWithSubtasks, "status" | "dueDate">,
  asOf: Date = new Date(),
): boolean {
  const { startOfToday } = getUtcDayBoundaries(asOf);
  if (task.status === "DONE" || !task.dueDate) return false;
  const due = new Date(task.dueDate);
  return !Number.isNaN(due.getTime()) && due < startOfToday;
}

