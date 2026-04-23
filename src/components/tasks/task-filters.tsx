"use client";

import type { ListTasksParams, TaskPriority, TaskStatus } from "@/lib/api-client/tasks";
import { MaterialIcon } from "@/components/ui/material-icon";
import { DUE_FILTER_LABELS_RU, priorityLabelRu, statusLabelRu } from "@/lib/i18n/task-ui";

type TaskFiltersProps = {
  className?: string;
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

const inputControl =
  "h-11 min-w-0 rounded-2xl border border-outline-soft bg-surface-raised px-3 text-[13px] font-medium text-on-surface shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

/** Fixed height + line-height match keeps selected labels (e.g. «В работе») centered on one line. */
const selectControl =
  "h-[2.75rem] w-full min-w-0 cursor-pointer appearance-none rounded-2xl border border-outline-soft bg-surface-raised py-0 pl-3 pr-10 text-left text-[13px] font-medium leading-[2.75rem] text-on-surface whitespace-nowrap shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

/** Equal width (~188px): fits «Все приоритеты» + chevron, leaves room for «Создать задачу» on one row. */
const selectWrap =
  "relative flex h-[2.75rem] w-full min-w-0 shrink-0 xl:w-[11.75rem] xl:max-w-[11.75rem] xl:flex-none";

export function TaskFilters({
  className,
  qDraft,
  onQChange,
  status,
  priority,
  due,
  onStatusChange,
  onPriorityChange,
  onDueChange,
  onNewTask,
}: TaskFiltersProps) {
  return (
    <div
      className={`flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:gap-3 ${className ?? ""}`}
    >
      <div className="relative min-w-0 w-full flex-1 lg:min-w-[12rem]">
        <MaterialIcon
          name="search"
          className="pointer-events-none absolute left-3 top-1/2 !text-[20px] -translate-y-1/2 text-outline"
        />
        <input
          id="task-filters-search"
          type="search"
          value={qDraft}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Поиск по названию, описанию…"
          className={`w-full pl-10 pr-3 ${inputControl}`}
        />
      </div>

      <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-none xl:flex xl:w-auto xl:shrink-0 xl:flex-none xl:flex-nowrap xl:items-center xl:gap-3">
        <label htmlFor="task-filters-status" className="sr-only">
          Статус
        </label>
        <div className={selectWrap}>
          <select
            id="task-filters-status"
            value={status ?? ""}
            onChange={(e) => onStatusChange((e.target.value || "") as TaskStatus | "")}
            className={selectControl}
          >
            <option value="">Все статусы</option>
            <option value="TODO">{statusLabelRu("TODO")}</option>
            <option value="IN_PROGRESS">{statusLabelRu("IN_PROGRESS")}</option>
            <option value="DONE">{statusLabelRu("DONE")}</option>
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-outline">
            <MaterialIcon name="expand_more" className="!text-[22px]" />
          </span>
        </div>

        <label htmlFor="task-filters-priority" className="sr-only">
          Приоритет
        </label>
        <div className={selectWrap}>
          <select
            id="task-filters-priority"
            value={priority ?? ""}
            onChange={(e) => onPriorityChange((e.target.value || "") as TaskPriority | "")}
            className={selectControl}
          >
            <option value="">Все приоритеты</option>
            <option value="LOW">{priorityLabelRu("LOW")}</option>
            <option value="MEDIUM">{priorityLabelRu("MEDIUM")}</option>
            <option value="HIGH">{priorityLabelRu("HIGH")}</option>
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-outline">
            <MaterialIcon name="expand_more" className="!text-[22px]" />
          </span>
        </div>

        <label htmlFor="task-filters-due" className="sr-only">
          Срок
        </label>
        <div className={selectWrap}>
          <select
            id="task-filters-due"
            value={due ?? ""}
            onChange={(e) =>
              onDueChange((e.target.value || "") as NonNullable<ListTasksParams["due"]> | "")
            }
            className={selectControl}
          >
            <option value="">Любой срок</option>
            <option value="overdue">{DUE_FILTER_LABELS_RU.overdue}</option>
            <option value="today">{DUE_FILTER_LABELS_RU.today}</option>
            <option value="week">{DUE_FILTER_LABELS_RU.week}</option>
            <option value="none">{DUE_FILTER_LABELS_RU.none}</option>
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-outline">
            <MaterialIcon name="expand_more" className="!text-[22px]" />
          </span>
        </div>

        <button
          type="button"
          onClick={onNewTask}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-gradient-to-r from-primary to-secondary px-5 text-sm font-semibold text-primary-foreground shadow-cta transition hover:opacity-[0.96] active:scale-[0.99] sm:col-span-2 xl:col-span-1 xl:px-5"
        >
          <MaterialIcon name="add" className="!text-[20px] text-primary-foreground" />
          Создать задачу
        </button>
      </div>
    </div>
  );
}
