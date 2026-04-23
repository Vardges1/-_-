import { jsonFromCaughtError, successJson } from "@/lib/api/response";
import { failureFromZod } from "@/lib/api/zod-response";
import { createAiService } from "@/lib/services/ai.service";
import { taskIdParamSchema } from "@/lib/validators/task.schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const parsedId = taskIdParamSchema.safeParse(id);
    if (!parsedId.success) return failureFromZod(parsedId.error);

    const suggestion = await createAiService().suggestPriority(parsedId.data);
    return successJson(suggestion);
  } catch (error) {
    return jsonFromCaughtError(error);
  }
}
