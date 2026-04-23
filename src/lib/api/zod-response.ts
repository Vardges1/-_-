import type { ZodError } from "zod";
import { failureJson } from "./response";
import { zodErrorToDetails } from "@/lib/validators/zod-error-details";

export function failureFromZod(error: ZodError) {
  return failureJson(
    {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: zodErrorToDetails(error),
    },
    422,
  );
}
