/**
 * Typed API error class.
 * Matches the backend error envelope: { error: { code, message, details } }
 */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details: { fields?: Record<string, string> } | null,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Parse an error response body into an ApiError.
 * Falls back to generic error if parsing fails.
 */
export function parseApiError(
  status: number,
  body: unknown
): ApiError {
  if (
    body &&
    typeof body === "object" &&
    "error" in body &&
    typeof (body as Record<string, unknown>).error === "object"
  ) {
    const err = (body as { error: Record<string, unknown> }).error;
    return new ApiError(
      (err.code as string) ?? "unknown_error",
      (err.message as string) ?? "An error occurred",
      (err.details as { fields?: Record<string, string> }) ?? null,
      status
    );
  }

  return new ApiError(
    "unknown_error",
    typeof body === "string" ? body : "An unexpected error occurred",
    null,
    status
  );
}
