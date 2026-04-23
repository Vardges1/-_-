import { jsonFromCaughtError, successJson } from "@/lib/api/response";
import { readJsonBody } from "@/lib/api/request-json";
import { failureFromZod } from "@/lib/api/zod-response";
import { createTaskService } from "@/lib/services/task.service";
import { createTaskBodySchema, listTasksQuerySchema } from "@/lib/validators/task.schemas";

export async function GET(request: Request) {
  try {
    const qs = Object.fromEntries(new URL(request.url).searchParams.entries());
    const parsed = listTasksQuerySchema.safeParse(qs);
    if (!parsed.success) return failureFromZod(parsed.error);

    const data = await createTaskService().list(parsed.data);
    return successJson(data);
  } catch (error) {
    return jsonFromCaughtError(error);
  }
}

export async function POST(request: Request) {
  try {
    const raw = await readJsonBody(request);
    const parsed = createTaskBodySchema.safeParse(raw);
    if (!parsed.success) return failureFromZod(parsed.error);

    const created = await createTaskService().create(parsed.data);
    return successJson(created, { status: 201 });
  } catch (error) {
    return jsonFromCaughtError(error);
  }
}
