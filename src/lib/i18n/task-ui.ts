/**
 * Russian UI labels for domain enums and copy.
 * Backend/API values stay in English (LOW, TODO, …); only presentation changes here.
 */
import type { TaskPriority, TaskStatus } from "@/lib/api-client/tasks";

const PRIORITY_RU: Record<TaskPriority, string> = {
  LOW: "Низкий",
  MEDIUM: "Средний",
  HIGH: "Высокий",
};

const STATUS_RU: Record<TaskStatus, string> = {
  TODO: "Ожидает",
  IN_PROGRESS: "В работе",
  DONE: "Готово",
};

export function priorityLabelRu(p: TaskPriority): string {
  return PRIORITY_RU[p];
}

export function statusLabelRu(s: TaskStatus): string {
  return STATUS_RU[s];
}

/** Due filter query param → short Russian label for selects */
export const DUE_FILTER_LABELS_RU: Record<"overdue" | "today" | "week" | "none", string> = {
  overdue: "Просрочено",
  today: "Сегодня",
  week: "7 дней",
  none: "Без срока",
};

export function formatCreatedAtRu(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}
