import type { TaskPriority } from "@/lib/api-client/tasks";
import { ApiClientError, parseApiResponse } from "./types";

export type CategorySuggestion = {
  category: string;
  confidence: number;
  reason: string;
};

export type PrioritySuggestion = {
  priority: TaskPriority;
  reason: string;
};

export type DecomposeSuggestion = {
  subtasks: { title: string }[];
};

export type WorkloadSummary = {
  summary: string;
  overdueCount: number;
  dueThisWeekCount: number;
  highPriorityOpenCount: number;
};

async function readJson<T>(response: Response): Promise<T> {
  return parseApiResponse<T>(response);
}

export async function suggestTaskCategory(taskId: string): Promise<CategorySuggestion> {
  const response = await fetch(`/api/v1/tasks/${encodeURIComponent(taskId)}/ai/category`, {
    method: "POST",
  });
  return readJson<CategorySuggestion>(response);
}

export async function suggestTaskPriority(taskId: string): Promise<PrioritySuggestion> {
  const response = await fetch(`/api/v1/tasks/${encodeURIComponent(taskId)}/ai/priority`, {
    method: "POST",
  });
  return readJson<PrioritySuggestion>(response);
}

export async function suggestTaskDecomposition(taskId: string): Promise<DecomposeSuggestion> {
  const response = await fetch(`/api/v1/tasks/${encodeURIComponent(taskId)}/ai/decompose`, {
    method: "POST",
  });
  return readJson<DecomposeSuggestion>(response);
}

export async function fetchWorkloadSummary(): Promise<WorkloadSummary> {
  const response = await fetch("/api/v1/ai/workload-summary", { method: "POST" });
  return readJson<WorkloadSummary>(response);
}

export function isAiNotConfigured(error: unknown): boolean {
  return error instanceof ApiClientError && error.error.code === "SERVICE_UNAVAILABLE";
}
