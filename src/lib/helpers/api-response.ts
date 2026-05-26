import { NextResponse } from "next/server";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function unauthorizedResponse(message = "Unauthorized") {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message = "Forbidden") {
  return errorResponse(message, 403);
}

export function notFoundResponse(message = "Not found") {
  return errorResponse(message, 404);
}

export function serverErrorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Internal server error";
  return errorResponse(message, 500);
}
