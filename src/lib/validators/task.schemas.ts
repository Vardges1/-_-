import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;

export const taskPrioritySchema = z.enum(TASK_PRIORITIES);
export const taskStatusSchema = z.enum(TASK_STATUSES);

export const taskIdParamSchema = z.string().cuid({ message: "Invalid task id" });

const optionalIsoDateTime = z.union([
  z.string().datetime({ offset: true }),
  z.string().datetime(),
]);

export const listTasksQuerySchema = z.object({
  status: z.preprocess(emptyToUndefined, taskStatusSchema.optional()),
  priority: z.preprocess(emptyToUndefined, taskPrioritySchema.optional()),
  q: z.preprocess(emptyToUndefined, z.string().max(200).optional()).transform((v) => {
    if (v === undefined) return undefined;
    const t = v.trim();
    return t.length === 0 ? undefined : t;
  }),
  due: z.preprocess(emptyToUndefined, z.enum(["overdue", "today", "week", "none"]).optional()),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).optional().default(1)),
  limit: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(100).optional().default(20)),
});

export const createTaskBodySchema = z
  .object({
    title: z.string().trim().min(1).max(500),
    description: z.union([z.string().max(10000), z.null()]).optional(),
    priority: taskPrioritySchema.optional(),
    status: taskStatusSchema.optional(),
    dueDate: z.union([optionalIsoDateTime, z.null()]).optional(),
    category: z.union([z.string().trim().max(200), z.null()]).optional(),
  })
  .strict();

export const updateTaskBodySchema = z
  .object({
    title: z.string().trim().min(1).max(500).optional(),
    description: z.union([z.string().max(10000), z.null()]).optional(),
    priority: taskPrioritySchema.optional(),
    status: taskStatusSchema.optional(),
    dueDate: z.union([optionalIsoDateTime, z.null()]).optional(),
    category: z.union([z.string().trim().max(200), z.null()]).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "At least one field is required for update",
        path: [],
      });
    }
  });

export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskBodySchema>;
