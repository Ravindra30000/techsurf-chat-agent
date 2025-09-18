import { Request, Response, NextFunction } from 'express';

export interface ErrorResponse {
  error: string;
  message: string;
  status: number;
  timestamp: string;
  path: string;
  details?: any;
}

export class AppError extends Error {
  public status: number;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, status: number = 500, details?: any) {
    super(message);
    this.status = status;
    this.isOperational = true;
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let status = 500;
  let message = 'Internal Server Error';
  let details = undefined;

  // Log the error
  console.error('❌ Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Handle different error types
  if (error instanceof AppError) {
    status = error.status;
    message = error.message;
    details = error.details;
  } else if (error.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
    details = error.message;
  } else if (error.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
  } else if (error.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid JWT token';
  } else if (error.name === 'TokenExpiredError') {
    status = 401;
    message = 'JWT token expired';
  } else if (error.name === 'CastError') {
    status = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    status = 500;
    message = 'Database error';
  } else if (error.message.includes('ECONNREFUSED')) {
    status = 503;
    message = 'Service unavailable';
    details = 'Unable to connect to external service';
  } else if (error.message.includes('timeout')) {
    status = 408;
    message = 'Request timeout';
  }

  // Create error response
  const errorResponse: ErrorResponse = {
    error: status >= 500 ? 'Internal Server Error' : message,
    message: status >= 500 ? 'Something went wrong on our end' : message,
    status,
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // Only include details in development or for client errors
  if (process.env.NODE_ENV === 'development' || status < 500) {
    if (details) {
      errorResponse.details = details;
    }
    
    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      (errorResponse as any).stack = error.stack;
    }
  }

  // Send error response
  res.status(status).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

export default errorHandler;