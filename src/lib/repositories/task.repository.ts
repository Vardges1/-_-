import { Prisma, type Task, type TaskPriority, type TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { WorkloadTaskProjection } from "@/lib/ai/workload-stats";
import { getUtcDayBoundaries } from "@/lib/utils/utc-date-boundaries";

export type TaskWithSubtasks = Prisma.TaskGetPayload<{ include: { subtasks: true } }>;

export type TaskDueFilter = "overdue" | "today" | "week" | "none";

export type TaskListParams = {
  status?: TaskStatus;
  priority?: TaskPriority;
  q?: string;
  due?: TaskDueFilter;
  skip: number;
  take: number;
  asOf?: Date;
};

function isRecordNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

/**
 * Data access for Task (and nested subtasks when needed).
 * No HTTP or validation — persistence only.
 */
export class TaskRepository {
  async findById(id: string): Promise<Task | null> {
    return prisma.task.findUnique({ where: { id } });
  }

  async findByIdWithSubtasks(id: string): Promise<TaskWithSubtasks | null> {
    return prisma.task.findUnique({
      where: { id },
      include: { subtasks: true },
    });
  }

  async findManyFiltered(params: TaskListParams): Promise<{ items: TaskWithSubtasks[]; total: number }> {
    const q = params.q?.trim();
    if (q) {
      return this.findManyFilteredWithFts({ ...params, q });
    }

    const where = this.buildWhere({ ...params, q: undefined });
    const [items, total] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: params.skip,
        take: params.take,
        include: { subtasks: true },
      }),
      prisma.task.count({ where }),
    ]);
    return { items, total };
  }

  /**
   * When `q` is set, list uses PostgreSQL full-text search (`to_tsvector` / `plainto_tsquery`, `simple` config)
   * on title + description, combined with the same status / priority / due filters as Prisma `findMany`.
   */
  private async findManyFilteredWithFts(
    params: TaskListParams & { q: string },
  ): Promise<{ items: TaskWithSubtasks[]; total: number }> {
    const conditions = this.buildFtsWhereConditions(params);
    const whereSql = Prisma.join(conditions, " AND ");

    const [countRows, idRows] = await prisma.$transaction([
      prisma.$queryRaw<[{ count: bigint }]>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count
        FROM "Task" t
        WHERE ${whereSql}
      `),
      prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT t.id
        FROM "Task" t
        WHERE ${whereSql}
        ORDER BY t."updatedAt" DESC
        OFFSET ${params.skip}
        LIMIT ${params.take}
      `),
    ]);

    const total = Number(countRows[0]?.count ?? 0);
    const ids = idRows.map((r) => r.id);
    if (ids.length === 0) {
      return { items: [], total };
    }

    const items = await prisma.task.findMany({
      where: { id: { in: ids } },
      include: { subtasks: true },
    });
    const order = new Map(ids.map((id, i) => [id, i] as const));
    items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return { items, total };
  }

  private buildFtsWhereConditions(params: TaskListParams & { q: string }): Prisma.Sql[] {
    const { status, priority, q, due, asOf } = params;
    const conditions: Prisma.Sql[] = [
      Prisma.sql`
        to_tsvector('simple', coalesce(t."title", '') || ' ' || coalesce(t."description", ''))
        @@ plainto_tsquery('simple', ${q})
      `,
    ];
    if (status) {
      conditions.push(Prisma.sql`t."status" = ${status}::"TaskStatus"`);
    }
    if (priority) {
      conditions.push(Prisma.sql`t."priority" = ${priority}::"TaskPriority"`);
    }
    const dueSql = due ? this.buildDueSqlFragment(due, asOf ?? new Date()) : null;
    if (dueSql) conditions.push(dueSql);
    return conditions;
  }

  private buildDueSqlFragment(due: TaskDueFilter, asOf: Date): Prisma.Sql | null {
    const { startOfToday, startOfTomorrow, startTodayPlusDays } = getUtcDayBoundaries(asOf);

    switch (due) {
      case "none":
        return Prisma.sql`t."dueDate" IS NULL`;
      case "overdue":
        return Prisma.sql`t."dueDate" IS NOT NULL AND t."dueDate" < ${startOfToday}`;
      case "today":
        return Prisma.sql`t."dueDate" IS NOT NULL AND t."dueDate" >= ${startOfToday} AND t."dueDate" < ${startOfTomorrow}`;
      case "week":
        return Prisma.sql`t."dueDate" IS NOT NULL AND t."dueDate" >= ${startOfToday} AND t."dueDate" < ${startTodayPlusDays(7)}`;
      default:
        return null;
    }
  }

  async findAllWorkloadProjection(): Promise<WorkloadTaskProjection[]> {
    return prisma.task.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async replaceSubtasks(taskId: string, titles: string[]): Promise<void> {
    await prisma.$transaction([
      prisma.subtask.deleteMany({ where: { taskId } }),
      prisma.subtask.createMany({
        data: titles.map((title) => ({ taskId, title })),
      }),
    ]);
  }

  async create(data: Prisma.TaskCreateInput): Promise<Task> {
    return prisma.task.create({ data });
  }

  async update(id: string, data: Prisma.TaskUpdateInput): Promise<Task | null> {
    try {
      return await prisma.task.update({ where: { id }, data });
    } catch (error) {
      if (isRecordNotFound(error)) return null;
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.task.delete({ where: { id } });
      return true;
    } catch (error) {
      if (isRecordNotFound(error)) return false;
      throw error;
    }
  }

  private buildWhere(params: TaskListParams): Prisma.TaskWhereInput {
    const and: Prisma.TaskWhereInput[] = [];
    const { status, priority, q, due, asOf } = params;

    if (status) and.push({ status });
    if (priority) and.push({ priority });

    if (q) {
      and.push({
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    if (due) {
      const dueClause = this.buildDueWhere(due, asOf ?? new Date());
      if (dueClause) and.push(dueClause);
    }

    if (and.length === 0) return {};
    return { AND: and };
  }

  private buildDueWhere(due: TaskDueFilter, asOf: Date): Prisma.TaskWhereInput | null {
    const { startOfToday, startOfTomorrow, startTodayPlusDays } = getUtcDayBoundaries(asOf);

    switch (due) {
      case "none":
        return { dueDate: null };
      case "overdue":
        return {
          AND: [{ dueDate: { not: null } }, { dueDate: { lt: startOfToday } }],
        };
      case "today":
        return {
          AND: [
            { dueDate: { not: null } },
            { dueDate: { gte: startOfToday } },
            { dueDate: { lt: startOfTomorrow } },
          ],
        };
      case "week":
        return {
          AND: [
            { dueDate: { not: null } },
            { dueDate: { gte: startOfToday } },
            { dueDate: { lt: startTodayPlusDays(7) } },
          ],
        };
      default:
        return null;
    }
  }
}

export function createTaskRepository(): TaskRepository {
  return new TaskRepository();
}
