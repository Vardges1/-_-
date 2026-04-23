import { z } from "zod";
import { TASK_PRIORITIES } from "@/lib/validators/task.schemas";

export const llmCategorySuggestionSchema = z.object({
  category: z.string().trim().min(1).max(200),
  confidence: z.preprocess((v) => {
    if (typeof v === "string") return Number(v);
    return v;
  }, z.number())
    .transform((n) => (Number.isFinite(n) && n > 1 ? Math.min(1, n / 100) : n))
    .pipe(z.number().min(0).max(1)),
  reason: z.string().trim().min(1).max(2000),
});

export const llmPrioritySuggestionSchema = z.object({
  priority: z.enum(TASK_PRIORITIES),
  reason: z.string().trim().min(1).max(2000),
});

export const llmDecomposeSchema = z.object({
  subtasks: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(500),
      }),
    )
    .min(3)
    .max(7),
});

export const llmWorkloadSummarySchema = z.object({
  summary: z.string().trim().min(1).max(8000),
});

export type LlmCategorySuggestion = z.infer<typeof llmCategorySuggestionSchema>;
export type LlmPrioritySuggestion = z.infer<typeof llmPrioritySuggestionSchema>;
export type LlmDecomposeResult = z.infer<typeof llmDecomposeSchema>;
export type LlmWorkloadSummaryText = z.infer<typeof llmWorkloadSummarySchema>;

export function stripMarkdownFences(text: string): string {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  return t;
}

export function parseModelJsonObject(raw: string): unknown {
  const cleaned = stripMarkdownFences(raw);
  return JSON.parse(cleaned) as unknown;
}
