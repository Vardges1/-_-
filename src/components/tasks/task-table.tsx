"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import type { ApiTaskWithSubtasks } from "@/lib/api-client/tasks";
import { MaterialIcon } from "@/components/ui/material-icon";
import { formatCreatedAtRu, priorityLabelRu, statusLabelRu } from "@/lib/i18n/task-ui";
import { dueDateToDisplayLabel } from "@/lib/dates/task-due-date";
import { isTaskOverdue } from "@/lib/tasks/kpi";

function priorityPill(p: ApiTaskWithSubtasks["priority"]) {
  switch (p) {
    case "LOW":
      return "bg-outline-soft text-outline ring-1 ring-outline/20";
    case "MEDIUM":
      return "bg-warn-soft text-warn ring-1 ring-warn/20";
    case "HIGH":
      return "bg-error-soft text-error ring-1 ring-error/25";
    default:
      return "bg-outline-soft text-outline ring-1 ring-outline/20";
  }
}

function StatusPill({ status }: { status: ApiTaskWithSubtasks["status"] }) {
  const cfg =
    status === "TODO"
      ? { dot: "bg-outline", text: "text-outline", bg: "bg-surface-subtle" }
      : status === "IN_PROGRESS"
        ? { dot: "bg-secondary", text: "text-secondary", bg: "bg-primary-soft/50" }
        : { dot: "bg-success", text: "text-success", bg: "bg-success-soft" };
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none ring-1 ring-black/5 ${cfg.bg} ${cfg.text}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} aria-hidden />
      {statusLabelRu(status)}
    </span>
  );
}

function ListSectionChrome({ filterHint, children }: { filterHint: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-outline-soft bg-surface-raised shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-soft px-5 py-4">
        <div>
          <h2 className="font-display text-[15px] font-semibold text-on-surface">Список задач</h2>
          <p className="mt-0.5 text-[12px] text-outline">Нажмите строку, чтобы связать её с ИИ-панелью</p>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-outline">
          <MaterialIcon name="filter_alt" className="!text-[18px]" />
          <span>{filterHint}</span>
        </div>
      </div>
      {children}
    </section>
  );
}

type TaskTableProps = {
  tasks: ApiTaskWithSubtasks[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  filterHint: string;
  selectedTaskId: string | null;
  expandedTaskIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelectTask: (id: string) => void;
  onOpenAiForTask?: (id: string) => void;
  onEdit: (task: ApiTaskWithSubtasks) => void;
  onDelete: (task: ApiTaskWithSubtasks) => void;
  onRetry: () => void;
};

export function TaskTable({
  tasks,
  loading,
  error,
  hasActiveFilters,
  filterHint,
  selectedTaskId,
  expandedTaskIds,
  onToggleExpand,
  onSelectTask,
  onOpenAiForTask,
  onEdit,
  onDelete,
  onRetry,
}: TaskTableProps) {
  if (error) {
    return (
      <ListSectionChrome filterHint={filterHint}>
        <div className="p-6">
          <p className="text-sm font-semibold text-error">Не удалось загрузить задачи</p>
          <p className="mt-1 text-sm text-on-surface-muted">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-5 text-sm font-semibold text-primary-foreground shadow-cta hover:opacity-[0.96]"
          >
            Повторить
          </button>
        </div>
      </ListSectionChrome>
    );
  }

  if (loading) {
    return (
      <ListSectionChrome filterHint={filterHint}>
        <div className="space-y-2 p-5" aria-busy="true" aria-label="Загрузка задач">
          <p className="sr-only">Загрузка задач…</p>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-subtle" />
          ))}
        </div>
      </ListSectionChrome>
    );
  }

  if (tasks.length === 0) {
    return (
      <ListSectionChrome filterHint={filterHint}>
        <div className="px-6 py-16 text-center">
          <MaterialIcon name="inbox" className="!text-[40px] text-outline/50" />
          <p className="mt-3 font-display font-semibold text-on-surface">
            {hasActiveFilters ? "Нет задач по фильтрам" : "Задач пока нет"}
          </p>
          <p className="mt-1 text-sm text-outline">
            {hasActiveFilters
              ? "Измените поиск или сбросьте фильтры — список вернётся на первую страницу."
              : "Создайте задачу кнопкой «Создать задачу» или выполните сидирование БД."}
          </p>
        </div>
      </ListSectionChrome>
    );
  }

  return (
    <ListSectionChrome filterHint={filterHint}>
      <div className="space-y-3 lg:hidden">
        {tasks.map((task) => (
          <MobileTaskCard
            key={task.id}
            task={task}
            selected={selectedTaskId === task.id}
            expanded={expandedTaskIds.has(task.id)}
            onSelect={() => onSelectTask(task.id)}
            onToggleExpand={() => onToggleExpand(task.id)}
            onOpenAi={onOpenAiForTask ? () => onOpenAiForTask(task.id) : undefined}
            onEdit={() => onEdit(task)}
            onDelete={() => onDelete(task)}
          />
        ))}
      </div>

      <div className="scrollbar-thin hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-outline-soft bg-surface-subtle text-[11px] font-semibold uppercase tracking-wider text-outline">
              <th className="w-[32%] px-5 py-3">Задача</th>
              <th className="px-3 py-3">Приоритет</th>
              <th className="w-[1%] whitespace-nowrap px-3 py-3 text-left">Статус</th>
              <th className="px-3 py-3">Срок</th>
              <th className="px-3 py-3">Создано</th>
              <th className="px-3 py-3">Категория</th>
              <th className="w-[88px] px-5 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-soft text-on-surface">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                selected={selectedTaskId === task.id}
                expanded={expandedTaskIds.has(task.id)}
                onRowClick={() => onSelectTask(task.id)}
                onToggleExpand={() => onToggleExpand(task.id)}
                onOpenAi={onOpenAiForTask ? () => onOpenAiForTask(task.id) : undefined}
                onEdit={() => onEdit(task)}
                onDelete={() => onDelete(task)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </ListSectionChrome>
  );
}

function TaskRow({
  task,
  selected,
  expanded,
  onRowClick,
  onToggleExpand,
  onOpenAi,
  onEdit,
  onDelete,
}: {
  task: ApiTaskWithSubtasks;
  selected: boolean;
  expanded: boolean;
  onRowClick: () => void;
  onToggleExpand: () => void;
  onOpenAi?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const subtasks = useMemo(() => task.subtasks ?? [], [task.subtasks]);
  const overdue = isTaskOverdue(task);
  return (
    <>
      <tr
        className={`group cursor-pointer transition-colors ${
          overdue
            ? "bg-error-soft/40"
            : selected
              ? "bg-primary-soft/50 ring-1 ring-inset ring-primary/15"
              : "hover:bg-surface-subtle"
        }`}
        onClick={onRowClick}
      >
        <td className="max-w-xs px-5 py-4 align-top">
          <div className="flex gap-3">
            <button
              type="button"
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft/80 text-primary"
              aria-expanded={expanded}
              aria-label={expanded ? "Свернуть подзадачи" : "Развернуть подзадачи"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
            >
              <MaterialIcon name="task_alt" className="!text-[22px]" />
            </button>
            <div className="min-w-0">
              <p
                className={`font-display text-[14px] font-semibold leading-snug text-on-surface ${
                  task.status === "DONE" ? "line-through opacity-55" : ""
                }`}
              >
                {task.title}
              </p>
              {task.description ? (
                <p className="mt-1 line-clamp-2 text-[13px] text-outline">{task.description}</p>
              ) : null}
            </div>
          </div>
        </td>
        <td className="px-3 py-4 align-middle">
          <span
            className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${priorityPill(task.priority)}`}
          >
            {priorityLabelRu(task.priority)}
          </span>
        </td>
        <td className="w-[1%] whitespace-nowrap px-3 py-4 align-middle text-left">
          <StatusPill status={task.status} />
        </td>
        <td className="whitespace-nowrap px-3 py-4">
          <span className={`text-[13px] ${overdue ? "font-semibold text-error" : "text-on-surface-muted"}`}>
            {dueDateToDisplayLabel(task.dueDate)}
          </span>
          {overdue ? (
            <span className="ml-1 text-[10px] font-bold uppercase text-error">просрочено</span>
          ) : null}
        </td>
        <td className="whitespace-nowrap px-3 py-4 text-[13px] text-outline">{formatCreatedAtRu(task.createdAt)}</td>
        <td className="px-3 py-4">
          <span className="inline-flex rounded-lg bg-surface-subtle px-2 py-1 text-[12px] font-medium text-on-surface-muted ring-1 ring-outline-soft">
            {task.category ?? "—"}
          </span>
        </td>
        <td className="px-5 py-4 text-right">
          <div className="inline-flex gap-0.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
            {onOpenAi ? (
              <button
                type="button"
                className="rounded-lg p-2 text-outline hover:bg-primary-soft/60 hover:text-primary"
                aria-label="ИИ для задачи"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAi();
                }}
              >
                <MaterialIcon name="psychology" className="!text-[20px]" />
              </button>
            ) : null}
            <button
              type="button"
              className="rounded-lg p-2 text-outline hover:bg-primary-soft/60 hover:text-primary"
              aria-label="Изменить"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <MaterialIcon name="edit" className="!text-[20px]" />
            </button>
            <button
              type="button"
              className="rounded-lg p-2 text-outline hover:bg-error-soft hover:text-error"
              aria-label="Удалить"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <MaterialIcon name="delete" className="!text-[20px]" />
            </button>
          </div>
        </td>
      </tr>
      {expanded && subtasks.length > 0 ? (
        <tr className="bg-surface-subtle/80">
          <td colSpan={7} className="px-5 py-3 pl-[4.5rem] text-xs text-on-surface-muted">
            <p className="mb-2 font-semibold text-on-surface">Подзадачи</p>
            <ul className="list-disc space-y-1 pl-4">
              {subtasks.map((s) => (
                <li key={s.id} className={s.completed ? "line-through opacity-60" : ""}>
                  {s.title}
                </li>
              ))}
            </ul>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function MobileTaskCard({
  task,
  selected,
  expanded,
  onSelect,
  onToggleExpand,
  onOpenAi,
  onEdit,
  onDelete,
}: {
  task: ApiTaskWithSubtasks;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onOpenAi?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const subtasks = useMemo(() => task.subtasks ?? [], [task.subtasks]);
  const overdue = isTaskOverdue(task);
  return (
    <article
      className={`rounded-2xl border p-4 shadow-card ${
        selected ? "border-primary/30 bg-primary-soft/40 ring-1 ring-primary/15" : "border-outline-soft bg-surface-raised"
      } ${overdue ? "border-error/25 bg-error-soft/30" : ""}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft/80 text-primary">
            <MaterialIcon name="task_alt" className="!text-[22px]" />
          </div>
          <div className="min-w-0">
            <p
              className={`font-display text-[14px] font-semibold text-on-surface ${
                task.status === "DONE" ? "line-through opacity-55" : ""
              }`}
            >
              {task.title}
            </p>
            {task.description ? (
              <p className="mt-1 line-clamp-2 text-[13px] text-outline">{task.description}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${priorityPill(task.priority)}`}
              >
                {priorityLabelRu(task.priority)}
              </span>
              <StatusPill status={task.status} />
            </div>
            <p className={`mt-2 text-xs ${overdue ? "font-semibold text-error" : "text-on-surface-muted"}`}>
              Срок: {dueDateToDisplayLabel(task.dueDate)}
              {overdue ? " · просрочено" : ""}
            </p>
            <p className="mt-1 text-xs text-outline">Создано: {formatCreatedAtRu(task.createdAt)}</p>
            {task.category ? (
              <p className="mt-1 text-xs text-outline">Категория: {task.category}</p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg border border-outline-soft p-2 text-outline"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          aria-expanded={expanded}
          aria-label={expanded ? "Свернуть подзадачи" : "Развернуть подзадачи"}
        >
          <MaterialIcon name={expanded ? "expand_less" : "expand_more"} className="!text-[22px]" />
        </button>
      </div>
      {expanded && subtasks.length > 0 ? (
        <ul className="mt-3 list-disc border-t border-outline-soft pl-5 text-xs text-on-surface-muted">
          {subtasks.map((s) => (
            <li key={s.id}>{s.title}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-outline-soft pt-3" onClick={(e) => e.stopPropagation()}>
        {onOpenAi ? (
          <button
            type="button"
            className="flex min-h-10 min-w-[3rem] flex-1 items-center justify-center rounded-xl border border-primary/25 bg-primary-soft/80 text-primary"
            onClick={onOpenAi}
            aria-label="ИИ"
          >
            <MaterialIcon name="psychology" className="!text-[20px]" />
          </button>
        ) : null}
        <button
          type="button"
          className="flex min-h-10 min-w-[3rem] flex-1 items-center justify-center rounded-xl border border-outline-soft bg-surface-raised text-outline"
          onClick={onEdit}
          aria-label="Изменить"
        >
          <MaterialIcon name="edit" className="!text-[20px]" />
        </button>
        <button
          type="button"
          className="flex min-h-10 min-w-[3rem] flex-1 items-center justify-center rounded-xl border border-error/25 bg-error-soft text-error"
          onClick={onDelete}
          aria-label="Удалить"
        >
          <MaterialIcon name="delete" className="!text-[20px]" />
        </button>
      </div>
    </article>
  );
}
