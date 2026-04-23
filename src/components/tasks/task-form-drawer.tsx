"use client";

import { useEffect, useState } from "react";
import type { ApiTask } from "@/lib/api-client/tasks";
import { createTask, getApiClientErrorMessage, updateTask } from "@/lib/api-client/tasks";
import { dueDateToInputValue, inputDateToDueIso } from "@/lib/dates/task-due-date";
import { priorityLabelRu, statusLabelRu } from "@/lib/i18n/task-ui";
import type { CreateTaskBody, UpdateTaskBody } from "@/lib/validators/task.schemas";
import type { TaskPriority, TaskStatus } from "@/lib/api-client/tasks";
import { MaterialIcon } from "@/components/ui/material-icon";

type TaskFormDrawerProps = {
  open: boolean;
  mode: "create" | "edit";
  task: ApiTask | null;
  onClose: () => void;
  onSaved: () => void;
  onNotify: (payload: { variant: "success" | "error"; message: string }) => void;
  onRequestDelete?: () => void;
};

const defaultPriority: TaskPriority = "MEDIUM";
const defaultStatus: TaskStatus = "TODO";

const labelCls =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline";
const fieldCls =
  "w-full rounded-xl border border-outline-soft bg-surface-raised px-3 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

export function TaskFormDrawer({
  open,
  mode,
  task,
  onClose,
  onSaved,
  onNotify,
  onRequestDelete,
}: TaskFormDrawerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(defaultPriority);
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitleError(null);
    setSubmitting(false);
    if (mode === "edit" && task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(dueDateToInputValue(task.dueDate));
      setCategory(task.category ?? "");
    } else {
      setTitle("");
      setDescription("");
      setPriority(defaultPriority);
      setStatus(defaultStatus);
      setDueDate("");
      setCategory("");
    }
  }, [open, mode, task]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError("Укажите название");
      return;
    }
    setTitleError(null);
    setSubmitting(true);
    try {
      if (mode === "create") {
        const body: CreateTaskBody = {
          title: trimmed,
          priority,
          status,
        };
        const desc = description.trim();
        if (desc) body.description = desc;
        const dueIso = inputDateToDueIso(dueDate);
        if (dueIso) body.dueDate = dueIso;
        const cat = category.trim();
        if (cat) body.category = cat;
        await createTask(body);
        onNotify({ variant: "success", message: "Задача создана" });
      } else if (task) {
        const body: UpdateTaskBody = {
          title: trimmed,
          description: description.trim() ? description.trim() : null,
          priority,
          status,
          dueDate: inputDateToDueIso(dueDate),
          category: category.trim() ? category.trim() : null,
        };
        await updateTask(task.id, body);
        onNotify({ variant: "success", message: "Задача обновлена" });
      }
      onSaved();
      onClose();
    } catch (err) {
      onNotify({ variant: "error", message: getApiClientErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-on-surface/25 backdrop-blur-[2px]"
        aria-label="Закрыть панель"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-drawer-title"
        className="relative flex h-full w-full max-w-md flex-col border-l border-outline-soft bg-surface-raised shadow-2xl"
      >
        <div className="flex shrink-0 items-start justify-between border-b border-outline-soft px-6 py-5">
          <div>
            <h2 id="task-drawer-title" className="font-display text-lg font-bold text-on-surface">
              {mode === "create" ? "Новая задача" : "Редактировать задачу"}
            </h2>
            <p className="mt-0.5 text-[12px] text-outline">Поля обязательны для ясного backlog</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-outline hover:bg-surface hover:text-on-surface"
            aria-label="Закрыть"
          >
            <MaterialIcon name="close" className="!text-[22px]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div>
              <label htmlFor="task-drawer-title-input" className={labelCls}>
                Название <span className="text-error">*</span>
              </label>
              <input
                id="task-drawer-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`h-11 ${fieldCls}`}
                autoComplete="off"
              />
              {titleError ? <p className="mt-1 text-sm text-error">{titleError}</p> : null}
            </div>

            <div>
              <label htmlFor="task-drawer-desc" className={labelCls}>
                Описание
              </label>
              <textarea
                id="task-drawer-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={`resize-y py-2.5 ${fieldCls}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="task-drawer-priority" className={labelCls}>
                  Приоритет
                </label>
                <select
                  id="task-drawer-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className={`h-11 ${fieldCls}`}
                >
                  <option value="LOW">{priorityLabelRu("LOW")}</option>
                  <option value="MEDIUM">{priorityLabelRu("MEDIUM")}</option>
                  <option value="HIGH">{priorityLabelRu("HIGH")}</option>
                </select>
              </div>
              <div>
                <label htmlFor="task-drawer-status" className={labelCls}>
                  Статус
                </label>
                <select
                  id="task-drawer-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className={`h-11 ${fieldCls}`}
                >
                  <option value="TODO">{statusLabelRu("TODO")}</option>
                  <option value="IN_PROGRESS">{statusLabelRu("IN_PROGRESS")}</option>
                  <option value="DONE">{statusLabelRu("DONE")}</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="task-drawer-due" className={labelCls}>
                Срок выполнения
              </label>
              <input
                id="task-drawer-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`h-11 ${fieldCls}`}
              />
              <p className="mt-1 text-[11px] text-outline">Календарная дата в UTC (полночь).</p>
            </div>

            <div>
              <label htmlFor="task-drawer-category" className={labelCls}>
                Тег / категория
              </label>
              <input
                id="task-drawer-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Например, Backend"
                className={`h-11 ${fieldCls} placeholder:text-outline/70`}
              />
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 border-t border-outline-soft bg-surface-subtle px-6 py-4">
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="h-11 flex-1 rounded-xl bg-gradient-to-r from-primary to-secondary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:opacity-[0.96] disabled:opacity-50"
              >
                {submitting ? "Сохранение…" : mode === "create" ? "Создать" : "Сохранить"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="h-11 shrink-0 rounded-xl border border-outline-soft bg-surface-raised px-4 text-sm font-semibold text-on-surface hover:bg-surface disabled:opacity-50"
              >
                Отмена
              </button>
            </div>
            {mode === "edit" && onRequestDelete ? (
              <button
                type="button"
                onClick={onRequestDelete}
                disabled={submitting}
                className="h-10 w-full rounded-xl border border-error/25 bg-error-soft text-sm font-semibold text-error hover:bg-error-soft/90 disabled:opacity-50"
              >
                Удалить задачу
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
