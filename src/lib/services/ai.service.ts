import { z, ZodError } from "zod";
import { completeChatJson } from "@/lib/ai/client";
import {
  JSON_RETRY_USER,
  JSON_SYSTEM_PROMPT,
  buildCategoryUserPrompt,
  buildDecomposeUserPrompt,
  buildPriorityUserPrompt,
  buildWorkloadUserPrompt,
} from "@/lib/ai/prompts";
import {
  llmCategorySuggestionSchema,
  llmDecomposeSchema,
  llmPrioritySuggestionSchema,
  llmWorkloadSummarySchema,
  parseModelJsonObject,
} from "@/lib/ai/schemas";
import { compactTasksForPrompt, computeWorkloadMetrics, type WorkloadTaskProjection } from "@/lib/ai/workload-stats";
import { AppError } from "@/lib/api/errors";
import type { TaskRepository } from "@/lib/repositories/task.repository";
import { createTaskRepository } from "@/lib/repositories/task.repository";

export type CategorySuggestionResponse = {
  category: string;
  confidence: number;
  reason: string;
};

export type PrioritySuggestionResponse = {
  priority: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
};

export type DecomposeSuggestionResponse = {
  subtasks: { title: string }[];
};

export type WorkloadSummaryResponse = {
  summary: string;
  overdueCount: number;
  dueThisWeekCount: number;
  highPriorityOpenCount: number;
};

export class AiService {
  constructor(private readonly tasks: TaskRepository) {}

  async suggestCategory(taskId: string): Promise<CategorySuggestionResponse> {
    const task = await this.tasks.findById(taskId);
    if (!task) throw new AppError("NOT_FOUND", `Task not found: ${taskId}`);

    const user = buildCategoryUserPrompt({ title: task.title, description: task.description });
    return this.runJsonCompletion(llmCategorySuggestionSchema, [
      { role: "system", content: JSON_SYSTEM_PROMPT },
      { role: "user", content: user },
    ]);
  }

  async suggestPriority(taskId: string): Promise<PrioritySuggestionResponse> {
    const task = await this.tasks.findById(taskId);
    if (!task) throw new AppError("NOT_FOUND", `Task not found: ${taskId}`);

    const user = buildPriorityUserPrompt({
      title: task.title,
      description: task.description,
      dueDateIso: task.dueDate ? task.dueDate.toISOString() : null,
    });
    return this.runJsonCompletion(llmPrioritySuggestionSchema, [
      { role: "system", content: JSON_SYSTEM_PROMPT },
      { role: "user", content: user },
    ]);
  }

  async decomposeTask(taskId: string): Promise<DecomposeSuggestionResponse> {
    const task = await this.tasks.findById(taskId);
    if (!task) throw new AppError("NOT_FOUND", `Task not found: ${taskId}`);

    const user = buildDecomposeUserPrompt({ title: task.title, description: task.description });
    return this.runJsonCompletion(llmDecomposeSchema, [
      { role: "system", content: JSON_SYSTEM_PROMPT },
      { role: "user", content: user },
    ]);
  }

  async workloadSummary(): Promise<WorkloadSummaryResponse> {
    const rows = await this.tasks.findAllWorkloadProjection();
    const metrics = computeWorkloadMetrics(rows);
    const metricsJson = JSON.stringify(metrics);
    const tasksJson = JSON.stringify(compactTasksForPrompt(rows));

    const user = buildWorkloadUserPrompt({ metricsJson, tasksJson });
    const parsed = await this.runJsonCompletion(llmWorkloadSummarySchema, [
      { role: "system", content: JSON_SYSTEM_PROMPT },
      { role: "user", content: user },
    ]);

    return {
      summary: parsed.summary,
      overdueCount: metrics.overdueCount,
      dueThisWeekCount: metrics.dueThisWeekCount,
      highPriorityOpenCount: metrics.highPriorityOpenCount,
    };
  }

  private async runJsonCompletion<TSchema extends z.ZodTypeAny>(
    schema: TSchema,
    messages: Parameters<typeof completeChatJson>[0]["messages"],
  ): Promise<z.infer<TSchema>> {
    const first = await completeChatJson({ messages });
    const firstParsed = this.tryValidate(schema, first);
    if (firstParsed.success) return firstParsed.data;

    const retryMessages = [
      ...messages,
      { role: "assistant" as const, content: first },
      { role: "user" as const, content: JSON_RETRY_USER },
    ];
    const second = await completeChatJson({ messages: retryMessages });
    const secondParsed = this.tryValidate(schema, second);
    if (secondParsed.success) return secondParsed.data;

    throw new AppError("INTERNAL_ERROR", "AI returned output that could not be validated", {
      details: {
        issues: [...firstParsed.error.issues, ...secondParsed.error.issues],
      },
    });
  }

  private tryValidate<TSchema extends z.ZodTypeAny>(
    schema: TSchema,
    raw: string,
  ): { success: true; data: z.infer<TSchema> } | { success: false; error: z.ZodError } {
    try {
      const obj = parseModelJsonObject(raw);
      const parsed = schema.safeParse(obj);
      if (parsed.success) return { success: true, data: parsed.data };
      return { success: false, error: parsed.error };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Invalid JSON";
      return {
        success: false,
        error: new ZodError([
          {
            code: "custom",
            path: [],
            message,
          },
        ]),
      };
    }
  }
}

export function createAiService(deps?: { tasks?: TaskRepository }): AiService {
  return new AiService(deps?.tasks ?? createTaskRepository());
}
