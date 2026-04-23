import { z } from "zod";

export const replaceSubtasksBodySchema = z
  .object({
    subtasks: z
      .array(
        z.object({
          title: z.string().trim().min(1).max(500),
        }),
      )
      .min(1)
      .max(50),
  })
  .strict();

export type ReplaceSubtasksBody = z.infer<typeof replaceSubtasksBodySchema>;
