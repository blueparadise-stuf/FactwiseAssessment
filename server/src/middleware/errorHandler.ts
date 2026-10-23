import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: Record<string, any>;
  errors?: Record<string, any>;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected internal server error occurred';

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000 && err.keyValue) {
    statusCode = 409;
    const key = Object.keys(err.keyValue)[0];
    const value = err.keyValue[key];
    message = `Duplicate record: A record with ${key} '${value}' already exists.`;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    const errorDetails = Object.values(err.errors).map((e: any) => e.message);
    message = `Validation Error: ${errorDetails.join(', ')}`;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier format provided.';
  }

  if (statusCode === 500) {
    console.error('Unhandled Server Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(ENV.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
