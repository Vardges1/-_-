import { NextResponse } from "next/server";
import { AppError, isAppError, toUnknownErrorMessage } from "./errors";
import type { ApiFailure, ApiResponse, ApiSuccess } from "./types";

export function successJson<T>(data: T, init?: ResponseInit): NextResponse<ApiSuccess<T>> {
  const body: ApiSuccess<T> = { success: true, data };
  return NextResponse.json(body, { status: init?.status ?? 200, ...init });
}

export function failureJson(
  error: ApiFailure["error"],
  status: number,
  init?: ResponseInit,
): NextResponse<ApiFailure> {
  const body: ApiFailure = { success: false, error };
  return NextResponse.json(body, { status, ...init });
}

/**
 * Map a thrown value to a consistent JSON error response.
 * Use in route catch blocks; keep business rules out of handlers.
 */
export function jsonFromCaughtError(error: unknown): NextResponse<ApiFailure> {
  if (isAppError(error)) {
    return failureJson(error.toApiErrorBody(), error.statusCode);
  }

  const message = toUnknownErrorMessage(error);
  return failureJson(
    {
      code: "INTERNAL_ERROR",
      message: process.env.NODE_ENV === "production" ? "Internal server error" : message,
    },
    500,
  );
}

export function assertApiSuccess<T>(response: ApiResponse<T>): asserts response is ApiSuccess<T> {
  if (!response.success) throw new AppError("INTERNAL_ERROR", "Expected success response");
}
