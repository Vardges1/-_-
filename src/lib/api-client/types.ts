import type { ApiFailure, ApiResponse } from "@/lib/api/types";

export type { ApiFailure, ApiResponse } from "@/lib/api/types";

export class ApiClientError extends Error {
  readonly status: number;
  readonly error: ApiFailure["error"];

  constructor(status: number, error: ApiFailure["error"]) {
    super(error.message);
    this.name = "ApiClientError";
    this.status = status;
    this.error = error;
  }
}

export async function parseApiResponse<T>(response: Response): Promise<T> {
  let json: ApiResponse<T>;
  try {
    json = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError(response.status || 500, {
      code: "BAD_RESPONSE",
      message: "The server returned an invalid response",
    });
  }

  if (!json.success) {
    throw new ApiClientError(response.status, json.error);
  }

  return json.data;
}
