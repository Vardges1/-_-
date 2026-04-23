import type { ZodError } from "zod";

export type ZodIssueDetail = {
  path: string[];
  message: string;
  code: string;
};

export function zodErrorToDetails(error: ZodError): { issues: ZodIssueDetail[] } {
  return {
    issues: error.issues.map((issue) => ({
      path: issue.path.map(String),
      message: issue.message,
      code: issue.code,
    })),
  };
}
