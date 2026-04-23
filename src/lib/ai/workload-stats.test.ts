import { describe, expect, it } from "vitest";
import { computeWorkloadMetrics, type WorkloadTaskProjection } from "./workload-stats";

describe("computeWorkloadMetrics", () => {
  const asOf = new Date(Date.UTC(2026, 3, 22, 12, 0, 0)); // 22 Apr 2026 noon UTC
  const start = new Date(Date.UTC(2026, 3, 22, 0, 0, 0));
  const prev = new Date(Date.UTC(2026, 3, 20, 0, 0, 0));
  const midWeek = new Date(Date.UTC(2026, 3, 24, 0, 0, 0));

  function task(partial: Partial<WorkloadTaskProjection> & Pick<WorkloadTaskProjection, "id">): WorkloadTaskProjection {
    return {
      title: "t",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: null,
      ...partial,
    };
  }

  it("counts overdue open tasks with dueDate before start of today (UTC)", () => {
    const tasks: WorkloadTaskProjection[] = [
      task({ id: "1", status: "TODO", dueDate: prev }),
      task({ id: "2", status: "DONE", dueDate: prev }),
    ];
    const m = computeWorkloadMetrics(tasks, asOf);
    expect(m.overdueCount).toBe(1);
  });

  it("counts due-this-week open tasks in [today, today+7d)", () => {
    const tasks: WorkloadTaskProjection[] = [
      task({ id: "1", status: "TODO", dueDate: start }),
      task({ id: "2", status: "TODO", dueDate: midWeek }),
      task({ id: "3", status: "DONE", dueDate: midWeek }),
    ];
    const m = computeWorkloadMetrics(tasks, asOf);
    expect(m.dueThisWeekCount).toBe(2);
  });

  it("counts high-priority open tasks regardless of due date", () => {
    const tasks: WorkloadTaskProjection[] = [
      task({ id: "1", status: "TODO", priority: "HIGH", dueDate: null }),
      task({ id: "2", status: "IN_PROGRESS", priority: "HIGH", dueDate: prev }),
      task({ id: "3", status: "DONE", priority: "HIGH", dueDate: null }),
    ];
    const m = computeWorkloadMetrics(tasks, asOf);
    expect(m.highPriorityOpenCount).toBe(2);
  });
});
