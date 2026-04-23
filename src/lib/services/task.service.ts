import type { Prisma, Task } from "@prisma/client";
import { AppError } from "@/lib/api/errors";
import type { TaskRepository, TaskWithSubtasks } from "@/lib/repositories/task.repository";
import { createTaskRepository } from "@/lib/repositories/task.repository";
import type { CreateTaskBody, ListTasksQuery, UpdateTaskBody } from "@/lib/validators/task.schemas";

/**
 * Task use-cases orchestrate repositories (and later other services).
 * Route handlers should call services only, not Prisma directly.
 */
export class TaskService {
  constructor(private readonly tasks: TaskRepository) {}

  async list(query: ListTasksQuery): Promise<{
    items: TaskWithSubtasks[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, status, priority, q, due } = query;
    const skip = (page - 1) * limit;
    const { items, total } = await this.tasks.findManyFiltered({
      status,
      priority,
      q,
      due,
      skip,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async getById(id: string): Promise<TaskWithSubtasks> {
    const task = await this.tasks.findByIdWithSubtasks(id);
    if (!task) {
      throw new AppError("NOT_FOUND", `Task not found: ${id}`);
    }
    return task;
  }

  async create(body: CreateTaskBody): Promise<Task> {
    return this.tasks.create(toCreateInput(body));
  }

  async update(id: string, body: UpdateTaskBody): Promise<Task> {
    const updated = await this.tasks.update(id, toUpdateInput(body));
    if (!updated) {
      throw new AppError("NOT_FOUND", `Task not found: ${id}`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.tasks.delete(id);
    if (!deleted) {
      throw new AppError("NOT_FOUND", `Task not found: ${id}`);
    }
  }

  async replaceSubtasks(taskId: string, items: { title: string }[]): Promise<TaskWithSubtasks> {
    const existing = await this.tasks.findById(taskId);
    if (!existing) {
      throw new AppError("NOT_FOUND", `Task not found: ${taskId}`);
    }
    const titles = items.map((i) => i.title.trim()).filter((t) => t.length > 0);
    if (titles.length === 0) {
      throw new AppError("BAD_REQUEST", "At least one subtask title is required");
    }
    await this.tasks.replaceSubtasks(taskId, titles);
    const full = await this.tasks.findByIdWithSubtasks(taskId);
    if (!full) {
      throw new AppError("NOT_FOUND", `Task not found: ${taskId}`);
    }
    return full;
  }
}

export function createTaskService(deps?: { tasks?: TaskRepository }): TaskService {
  return new TaskService(deps?.tasks ?? createTaskRepository());
}

function toCreateInput(body: CreateTaskBody): Prisma.TaskCreateInput {
  return {
    title: body.title,
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.priority !== undefined ? { priority: body.priority } : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
    ...(body.dueDate !== undefined
      ? { dueDate: body.dueDate === null ? null : new Date(body.dueDate) }
      : {}),
    ...(body.category !== undefined ? { category: body.category } : {}),
  };
}

function toUpdateInput(body: UpdateTaskBody): Prisma.TaskUpdateInput {
  const data: Prisma.TaskUpdateInput = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.status !== undefined) data.status = body.status;
  if (body.dueDate !== undefined) {
    data.dueDate = body.dueDate === null ? null : new Date(body.dueDate);
  }
  if (body.category !== undefined) data.category = body.category;
  return data;
}
