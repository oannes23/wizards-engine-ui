import { describe, it, expect } from "vitest";
import { ApiError, parseApiError } from "./errors";

describe("ApiError", () => {
  it("creates an error with all fields", () => {
    const err = new ApiError(
      "validation_error",
      "Invalid input",
      { fields: { name: "Required" } },
      422
    );
    expect(err.code).toBe("validation_error");
    expect(err.message).toBe("Invalid input");
    expect(err.status).toBe(422);
    expect(err.details?.fields?.name).toBe("Required");
    expect(err.name).toBe("ApiError");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("parseApiError", () => {
  it("parses standard error envelope", () => {
    const body = {
      error: {
        code: "not_found",
        message: "Character not found",
        details: null,
      },
    };
    const err = parseApiError(404, body);
    expect(err.code).toBe("not_found");
    expect(err.message).toBe("Character not found");
    expect(err.status).toBe(404);
    expect(err.details).toBeNull();
  });

  it("parses error with field details", () => {
    const body = {
      error: {
        code: "validation_error",
        message: "Validation failed",
        details: {
          fields: {
            display_name: "Too short",
            character_name: "Already taken",
          },
        },
      },
    };
    const err = parseApiError(422, body);
    expect(err.code).toBe("validation_error");
    expect(err.details?.fields?.display_name).toBe("Too short");
    expect(err.details?.fields?.character_name).toBe("Already taken");
  });

  it("handles non-standard error body", () => {
    const err = parseApiError(500, "Internal Server Error");
    expect(err.code).toBe("unknown_error");
    expect(err.message).toBe("Internal Server Error");
    expect(err.status).toBe(500);
  });

  it("handles null body", () => {
    const err = parseApiError(500, null);
    expect(err.code).toBe("unknown_error");
    expect(err.status).toBe(500);
  });

  it("handles body without error property", () => {
    const err = parseApiError(400, { message: "Bad request" });
    expect(err.code).toBe("unknown_error");
  });
});
