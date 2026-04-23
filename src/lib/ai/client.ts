import { AppError } from "@/lib/api/errors";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

function requireApiKey(): string {
  const key = process.env.LLM_API_KEY?.trim();
  if (!key) {
    throw new AppError("SERVICE_UNAVAILABLE", "AI assistant is not configured");
  }
  return key;
}

export async function completeChatJson(params: {
  messages: ChatMessage[];
  temperature?: number;
}): Promise<string> {
  const apiKey = requireApiKey();
  const baseUrl = (process.env.LLM_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.LLM_MODEL?.trim() || "gpt-4o-mini";
  const url = `${baseUrl}/chat/completions`;

  const body: Record<string, unknown> = {
    model,
    temperature: params.temperature ?? 0.2,
    messages: params.messages,
  };

  // OpenAI-compatible JSON mode (ignored by some providers)
  body.response_format = { type: "json_object" };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let json: ChatCompletionResponse;
  try {
    json = JSON.parse(text) as ChatCompletionResponse;
  } catch {
    throw new AppError("INTERNAL_ERROR", "LLM provider returned non-JSON", {
      statusCode: response.status >= 400 ? response.status : 502,
    });
  }

  if (!response.ok) {
    const msg = json.error?.message || text.slice(0, 200) || "LLM request failed";
    throw new AppError("INTERNAL_ERROR", msg, { statusCode: response.status, details: json.error });
  }

  const content = json.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new AppError("INTERNAL_ERROR", "LLM response missing message content");
  }
  return content;
}
