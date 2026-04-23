import type { TaskPriority, TaskStatus } from "@prisma/client";
import { getUtcDayBoundaries } from "@/lib/utils/utc-date-boundaries";

export type WorkloadTaskProjection = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
};

export type WorkloadMetrics = {
  overdueCount: number;
  dueThisWeekCount: number;
  highPriorityOpenCount: number;
};

function isOpen(status: TaskStatus): boolean {
  return status !== "DONE";
}

export function computeWorkloadMetrics(tasks: WorkloadTaskProjection[], asOf: Date = new Date()): WorkloadMetrics {
  const { startOfToday, startTodayPlusDays } = getUtcDayBoundaries(asOf);
  const weekEnd = startTodayPlusDays(7);

  let overdueCount = 0;
  let dueThisWeekCount = 0;
  let highPriorityOpenCount = 0;

  for (const t of tasks) {
    if (t.priority === "HIGH" && isOpen(t.status)) {
      highPriorityOpenCount += 1;
    }

    if (!isOpen(t.status) || !t.dueDate) continue;

    const due = t.dueDate;
    if (due < startOfToday) {
      overdueCount += 1;
    }
    if (due >= startOfToday && due < weekEnd) {
      dueThisWeekCount += 1;
    }
  }

  return { overdueCount, dueThisWeekCount, highPriorityOpenCount };
}

export function compactTasksForPrompt(tasks: WorkloadTaskProjection[], max = 80): unknown[] {
  return tasks.slice(0, max).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
  }));
}
