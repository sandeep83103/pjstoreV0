import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id: string) {
    super('NOT_FOUND', `${entity} with id '${id}' was not found.`, 404);
  }
}

export class OutOfStockError extends AppError {
  constructor(productName: string) {
    super('OUT_OF_STOCK', `Item '${productName}' is no longer available in the requested quantity.`, 409);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied: insufficient permissions.') {
    super('FORBIDDEN', message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed.', details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export function handleApiError(error: unknown) {
  console.error('[API Error]:', error);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input payload.',
          details: error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message,
      },
    },
    { status: 500 }
  );
}
