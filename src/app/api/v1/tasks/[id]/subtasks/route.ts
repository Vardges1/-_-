import { jsonFromCaughtError, successJson } from "@/lib/api/response";
import { readJsonBody } from "@/lib/api/request-json";
import { failureFromZod } from "@/lib/api/zod-response";
import { createTaskService } from "@/lib/services/task.service";
import { replaceSubtasksBodySchema } from "@/lib/validators/subtask.schemas";
import { taskIdParamSchema } from "@/lib/validators/task.schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const parsedId = taskIdParamSchema.safeParse(id);
    if (!parsedId.success) return failureFromZod(parsedId.error);

    const raw = await readJsonBody(request);
    const parsed = replaceSubtasksBodySchema.safeParse(raw);
    if (!parsed.success) return failureFromZod(parsed.error);

    const task = await createTaskService().replaceSubtasks(parsedId.data, parsed.data.subtasks);
    return successJson(task);
  } catch (error) {
    return jsonFromCaughtError(error);
  }
}
