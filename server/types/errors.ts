import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import jwt from 'jsonwebtoken'; // For handling JWT specific errors

export class CustomError extends Error {
  public readonly status: number;
  public readonly errorCode?: string;
  public readonly isOperational: boolean;

  constructor(message: string, status: number = 500, errorCode?: string, isOperational: boolean = true) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Represents a "Not Found" error (HTTP 404).
 */
export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found', errorCode?: string) {
    super(message, 404, errorCode);
  }
}

/**
 * Represents a "Validation Error" (HTTP 400).
 */
export class ValidationError extends CustomError {
  constructor(message: string = 'Validation failed', errorCode?: string) {
    super(message, 400, errorCode);
  }
}

/**
 * Represents an "Unauthorized" error (HTTP 401).
 */
export class UnauthorizedError extends CustomError {
  constructor(message: string = 'Unauthorized', errorCode?: string) {
    super(message, 401, errorCode);
  }
}

/**
 * Represents a "Forbidden" error (HTTP 403).
 */
export class ForbiddenError extends CustomError {
  constructor(message: string = 'Forbidden', errorCode?: string) {
    super(message, 403, errorCode);
  }
}

export const globalErrorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  let statusCode: number = 500;
  let message: string = 'An unexpected internal server error occurred.';
  let errorCode: string | undefined = undefined;
  let isOperationalError: boolean = false;

  // In production, use a more robust logger (e.g., Winston, Pino)
  if (err instanceof CustomError && err.isOperational) {
    console.warn(
      `[OPERATIONAL_ERROR] Name: ${err.name}, Status: ${err.status}, Message: ${err.message}, Code: ${err.errorCode}, Path: ${req.path}`
    );
  } else {
    // For programmer errors or truly unexpected issues, log the full error.
    console.error('[UNHANDLED_ERROR] Error:', err, `Path: ${req.path}`);
  }

  if (err instanceof CustomError) {
    statusCode = err.status;
    message = err.message;
    errorCode = err.errorCode;
    isOperationalError = err.isOperational;
  } else if (err instanceof jwt.JsonWebTokenError) {
    statusCode = 401;
    isOperationalError = true;
    if (err.name === 'TokenExpiredError') {
      message = 'Session expired. Please log in again.';
      errorCode = 'TOKEN_EXPIRED';
    } else if (err.name === 'JsonWebTokenError') {
      message = 'Invalid token. Authentication failed.';
      errorCode = 'INVALID_TOKEN';
    } else {
      message = 'Token processing error. Authentication failed.';
      errorCode = 'TOKEN_PROCESSING_ERROR';
    }
  } else if (err instanceof Error) {
    if (process.env.NODE_ENV === 'production') {
      message = 'An internal server error occurred.';
    } else {
      message = err.message;
    }
  } else {
    message = 'An unknown error occurred.';
    if (typeof err === 'string' && err.trim() !== '') {
      message = err;
    }
  }

  if (process.env.NODE_ENV === 'production' && !isOperationalError && statusCode >= 500) {
    message = 'The server encountered an unexpected condition. Please try again later.';
    errorCode = 'INTERNAL_SERVER_ERROR';
  }

  if (res.headersSent) {
    return next(err);
  }

  res.status(statusCode).json({
    status: statusCode >= 400 && statusCode < 500 ? 'fail' : 'error',
    message,
    ...(errorCode && { errorCode }),
    ...(process.env.NODE_ENV !== 'production' && err instanceof Error && { stack: err.stack }),
  });
};
