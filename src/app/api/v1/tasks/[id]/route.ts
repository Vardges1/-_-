import { jsonFromCaughtError, successJson } from "@/lib/api/response";
import { readJsonBody } from "@/lib/api/request-json";
import { failureFromZod } from "@/lib/api/zod-response";
import { createTaskService } from "@/lib/services/task.service";
import { taskIdParamSchema, updateTaskBodySchema } from "@/lib/validators/task.schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const parsedId = taskIdParamSchema.safeParse(id);
    if (!parsedId.success) return failureFromZod(parsedId.error);

    const task = await createTaskService().getById(parsedId.data);
    return successJson(task);
  } catch (error) {
    return jsonFromCaughtError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const parsedId = taskIdParamSchema.safeParse(id);
    if (!parsedId.success) return failureFromZod(parsedId.error);

    const raw = await readJsonBody(request);
    const parsed = updateTaskBodySchema.safeParse(raw);
    if (!parsed.success) return failureFromZod(parsed.error);

    const updated = await createTaskService().update(parsedId.data, parsed.data);
    return successJson(updated);
  } catch (error) {
    return jsonFromCaughtError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const parsedId = taskIdParamSchema.safeParse(id);
    if (!parsedId.success) return failureFromZod(parsedId.error);

    await createTaskService().delete(parsedId.data);
    return successJson({ id: parsedId.data });
  } catch (error) {
    return jsonFromCaughtError(error);
  }
}
