export const JSON_SYSTEM_PROMPT = `You are a precise assistant for a task manager API.
You MUST respond with a single JSON object only.
Do not wrap the JSON in markdown fences.
Do not include any keys other than those requested.
Do not include commentary outside JSON.`;

export const JSON_RETRY_USER = `Your previous reply was not valid JSON or did not match the schema.
Respond again with a single minified JSON object only. No markdown, no prose.`;

export function buildCategoryUserPrompt(input: { title: string; description: string | null }) {
  return [
    "Suggest a short category label for this task.",
    "Return JSON with keys: category (string, max ~40 chars), confidence (number 0-1), reason (string).",
    "",
    "Task:",
    `title: ${input.title}`,
    `description: ${input.description ?? ""}`,
  ].join("\n");
}

export function buildPriorityUserPrompt(input: {
  title: string;
  description: string | null;
  dueDateIso: string | null;
}) {
  return [
    "Suggest a priority for this task: LOW, MEDIUM, or HIGH.",
    "Return JSON with keys: priority (one of LOW|MEDIUM|HIGH), reason (string).",
    "",
    "Task:",
    `title: ${input.title}`,
    `description: ${input.description ?? ""}`,
    `dueDate (ISO or empty): ${input.dueDateIso ?? ""}`,
  ].join("\n");
}

export function buildDecomposeUserPrompt(input: { title: string; description: string | null }) {
  return [
    "Break this task into 3 to 7 concrete subtasks (actionable titles).",
    "Return JSON: { \"subtasks\": [ { \"title\": \"...\" }, ... ] }",
    "",
    "Task:",
    `title: ${input.title}`,
    `description: ${input.description ?? ""}`,
  ].join("\n");
}

export function buildWorkloadUserPrompt(input: {
  metricsJson: string;
  tasksJson: string;
}) {
  return [
    "You are summarizing workload for a user.",
    "You will receive server-computed metrics (authoritative) and a compact list of tasks.",
    "Write a concise natural-language summary (2-6 sentences) referencing the situation.",
    "Return JSON with a single key: summary (string).",
    "",
    "METRICS_JSON:",
    input.metricsJson,
    "",
    "TASKS_JSON:",
    input.tasksJson,
  ].join("\n");
}
