"use client";

import type { ListTasksParams, TaskPriority, TaskStatus } from "@/lib/api-client/tasks";
import { TaskFilters } from "./task-filters";

type TaskPageHeaderProps = {
  qDraft: string;
  onQChange: (value: string) => void;
  status?: TaskStatus;
  priority?: TaskPriority;
  due?: ListTasksParams["due"];
  onStatusChange: (value: TaskStatus | "") => void;
  onPriorityChange: (value: TaskPriority | "") => void;
  onDueChange: (value: NonNullable<ListTasksParams["due"]> | "") => void;
  onNewTask: () => void;
};

export function TaskPageHeader(props: TaskPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4">
      {/* Row 1: title (left) + search / filters / create (right) */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <h1 className="shrink-0 font-display text-[28px] font-bold tracking-tight text-on-surface lg:text-[32px]">
          Задачи
        </h1>
        <div className="min-w-0 w-full flex-1 lg:flex lg:justify-end">
          <TaskFilters {...props} className="w-full max-w-full lg:max-w-none" />
        </div>
      </div>

      {/* Row 2: full-width supporting copy */}
      <p className="w-full max-w-full text-sm leading-relaxed text-on-surface-muted sm:text-[15px]">
        Управляйте backlog с прозрачностью: поиск, фильтры и AI-подсказки всегда под рукой — без автоматического
        применения изменений.
      </p>
    </header>
  );
}
