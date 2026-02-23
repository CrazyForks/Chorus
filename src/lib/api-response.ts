// src/lib/api-response.ts
// API Response Format Standard (ARCHITECTURE.md §5.1)

import { NextResponse } from "next/server";

// Success response
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

// Error response
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Success response utility function
export function success<T>(
  data: T,
  meta?: ApiSuccessResponse<T>["meta"]
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data, meta });
}

// Paginated success response
export function paginated<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): NextResponse<ApiSuccessResponse<T[]>> {
  return NextResponse.json({
    success: true,
    data,
    meta: { page, pageSize, total },
  });
}

// Error code definitions
export const ErrorCode = {
  // Common errors (4xx)
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  VALIDATION_ERROR: "VALIDATION_ERROR",

  // Business errors
  ALREADY_CLAIMED: "ALREADY_CLAIMED",
  NOT_CLAIMED: "NOT_CLAIMED",
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
  PERMISSION_DENIED: "PERMISSION_DENIED",

  // Server errors (5xx)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// HTTP status code mapping
const statusCodeMap: Record<ErrorCodeType, number> = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.VALIDATION_ERROR]: 422,
  [ErrorCode.ALREADY_CLAIMED]: 409,
  [ErrorCode.NOT_CLAIMED]: 400,
  [ErrorCode.INVALID_STATUS_TRANSITION]: 400,
  [ErrorCode.PERMISSION_DENIED]: 403,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
};

// Error response utility function
export function error(
  code: ErrorCodeType,
  message: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const status = statusCodeMap[code] || 500;
  return NextResponse.json(
    {
      success: false,
      error: { code, message, details },
    },
    { status }
  );
}

// Common error shortcut methods
export const errors = {
  badRequest: (message: string, details?: unknown) =>
    error(ErrorCode.BAD_REQUEST, message, details),

  unauthorized: (message = "Authentication required") =>
    error(ErrorCode.UNAUTHORIZED, message),

  forbidden: (message = "Access denied") =>
    error(ErrorCode.FORBIDDEN, message),

  notFound: (resource = "Resource") =>
    error(ErrorCode.NOT_FOUND, `${resource} not found`),

  conflict: (message: string) => error(ErrorCode.CONFLICT, message),

  validationError: (details: unknown) =>
    error(ErrorCode.VALIDATION_ERROR, "Validation failed", details),

  alreadyClaimed: () =>
    error(ErrorCode.ALREADY_CLAIMED, "Resource is already claimed"),

  notClaimed: () =>
    error(ErrorCode.NOT_CLAIMED, "Resource is not claimed"),

  invalidStatusTransition: (from: string, to: string) =>
    error(
      ErrorCode.INVALID_STATUS_TRANSITION,
      `Invalid status transition from ${from} to ${to}`
    ),

  permissionDenied: (action: string) =>
    error(ErrorCode.PERMISSION_DENIED, `Permission denied: ${action}`),

  internal: (message = "Internal server error") =>
    error(ErrorCode.INTERNAL_ERROR, message),

  database: (message = "Database error") =>
    error(ErrorCode.DATABASE_ERROR, message),
};
