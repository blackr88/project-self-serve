import { NextResponse } from 'next/server';

/**
 * Success response
 */
export function successResponse(data, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Error response
 */
export function errorResponse(message, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

/**
 * Unauthorized response
 */
export function unauthorizedResponse(message = 'Authentication required') {
  return errorResponse(message, 401);
}

/**
 * Forbidden response
 */
export function forbiddenResponse(message = 'Access denied') {
  return errorResponse(message, 403);
}

/**
 * Not found response
 */
export function notFoundResponse(message = 'Resource not found') {
  return errorResponse(message, 404);
}

/**
 * Rate limit response
 */
export function rateLimitResponse(message = 'Too many requests') {
  return errorResponse(message, 429);
}

/**
 * Server error response
 */
export function serverErrorResponse(message = 'Internal server error') {
  return errorResponse(message, 500);
}
