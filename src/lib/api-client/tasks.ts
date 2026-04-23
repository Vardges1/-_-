import type { CreateTaskBody, UpdateTaskBody } from "@/lib/validators/task.schemas";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/validators/task.schemas";
import { ApiClientError, parseApiResponse } from "./types";

const TASKS_PATH = "/api/v1/tasks";

export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];

export type ApiSubtask = {
  id: string;
  title: string;
  completed: boolean;
  taskId: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiTask = {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiTaskWithSubtasks = ApiTask & { subtasks: ApiSubtask[] };

export type PaginatedTasks = {
  items: ApiTaskWithSubtasks[];
  total: number;
  page: number;
  limit: number;
};

export type ListTasksParams = {
  q?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due?: "overdue" | "today" | "week" | "none";
  page?: number;
  limit?: number;
};

function isTaskStatus(value: string | null): value is TaskStatus {
  return value !== null && (TASK_STATUSES as readonly string[]).includes(value);
}

function isTaskPriority(value: string | null): value is TaskPriority {
  return value !== null && (TASK_PRIORITIES as readonly string[]).includes(value);
}

function isDueFilter(value: string | null): value is NonNullable<ListTasksParams["due"]> {
  return value === "overdue" || value === "today" || value === "week" || value === "none";
}

export function parseListTasksParams(searchParams: URLSearchParams): ListTasksParams {
  const qRaw = searchParams.get("q");
  const statusRaw = searchParams.get("status");
  const priorityRaw = searchParams.get("priority");
  const dueRaw = searchParams.get("due");
  const pageRaw = searchParams.get("page");
  const limitRaw = searchParams.get("limit");

  const params: ListTasksParams = {};
  if (qRaw) params.q = qRaw;
  if (isTaskStatus(statusRaw)) params.status = statusRaw;
  if (isTaskPriority(priorityRaw)) params.priority = priorityRaw;
  if (isDueFilter(dueRaw)) params.due = dueRaw;

  if (pageRaw) {
    const page = Number(pageRaw);
    if (Number.isInteger(page) && page >= 1) params.page = page;
  }
  if (limitRaw) {
    const limit = Number(limitRaw);
    if (Number.isInteger(limit) && limit >= 1 && limit <= 100) params.limit = limit;
  }

  return params;
}

export function listTasksParamsToSearchParams(params: ListTasksParams): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.status) sp.set("status", params.status);
  if (params.priority) sp.set("priority", params.priority);
  if (params.due) sp.set("due", params.due);
  if (params.page != null && params.page > 1) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  return sp;
}

function buildTasksListUrl(params: ListTasksParams): string {
  const sp = listTasksParamsToSearchParams(params);
  const qs = sp.toString();
  return qs ? `${TASKS_PATH}?${qs}` : TASKS_PATH;
}

async function readJson<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }
  return parseApiResponse<T>(response);
}

export async function listTasks(params: ListTasksParams): Promise<PaginatedTasks> {
  const response = await fetch(buildTasksListUrl(params), { cache: "no-store" });
  return readJson<PaginatedTasks>(response);
}

export async function getTask(id: string): Promise<ApiTaskWithSubtasks> {
  const response = await fetch(`${TASKS_PATH}/${encodeURIComponent(id)}`, { cache: "no-store" });
  return readJson<ApiTaskWithSubtasks>(response);
}

export async function createTask(body: CreateTaskBody): Promise<ApiTask> {
  const response = await fetch(TASKS_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return readJson<ApiTask>(response);
}

export async function updateTask(id: string, body: UpdateTaskBody): Promise<ApiTask> {
  const response = await fetch(`${TASKS_PATH}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return readJson<ApiTask>(response);
}

export async function deleteTask(id: string): Promise<{ id: string }> {
  const response = await fetch(`${TASKS_PATH}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return readJson<{ id: string }>(response);
}

export async function replaceTaskSubtasks(
  taskId: string,
  subtasks: { title: string }[],
): Promise<ApiTaskWithSubtasks> {
  const response = await fetch(`${TASKS_PATH}/${encodeURIComponent(taskId)}/subtasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subtasks }),
  });
  return readJson<ApiTaskWithSubtasks>(response);
}

function isIssuesDetails(details: unknown): details is { issues: Array<{ message: string }> } {
  if (!details || typeof details !== "object") return false;
  return (
    "issues" in details &&
    Array.isArray((details as { issues: unknown }).issues) &&
    (details as { issues: { message?: string }[] }).issues.every((i) => typeof i?.message === "string")
  );
}

export function getApiClientErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.error.code === "INTERNAL_ERROR" && isIssuesDetails(error.error.details)) {
      const first = error.error.details.issues[0]?.message;
      if (first) {
        return "The assistant returned data we could not read. Please try again.";
      }
    }
    if (error.error.code === "SERVICE_UNAVAILABLE") {
      return error.message || "This action needs an API key (LLM_API_KEY).";
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
