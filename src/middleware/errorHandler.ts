import { ErrorRequestHandler } from 'express';
import { config } from '../config/env';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details, requestId: req.requestId },
    });
    return;
  }

  logger.error('unhandled error', {
    requestId: req.requestId,
    message: err?.message,
    stack: err?.stack,
  });

  res.status(500).json({
    error: {
      code: 'INTERNAL',
      message: err?.message ?? 'Internal server error',
      stack: config.env !== 'development' ? err?.stack : undefined,
      requestId: req.requestId,
    },
  });
};
