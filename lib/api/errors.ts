import { NextResponse } from 'next/server';

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
  };
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function errorResponse(code: string, message: string, status: number): NextResponse<ApiErrorPayload> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

export function fromError(error: unknown): NextResponse<ApiErrorPayload> {
  if (error instanceof ApiError) {
    return errorResponse(error.code, error.message, error.status);
  }

  if (error instanceof Error) {
    console.error('Unhandled API error:', error);
    return errorResponse('INTERNAL_ERROR', 'Unexpected server error.', 500);
  }

  return errorResponse('INTERNAL_ERROR', 'Unexpected server error.', 500);
}
