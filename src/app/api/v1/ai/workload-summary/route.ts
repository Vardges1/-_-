import { jsonFromCaughtError, successJson } from "@/lib/api/response";
import { createAiService } from "@/lib/services/ai.service";

export async function POST(_request: Request) {
  try {
    const summary = await createAiService().workloadSummary();
    return successJson(summary);
  } catch (error) {
    return jsonFromCaughtError(error);
  }
}
