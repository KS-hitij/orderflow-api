import { RequestHandler } from 'express';
import { logger } from '../lib/logger';

export const requestLogger: RequestHandler = (req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    logger.info('request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
      headers: req.headers,
      body: req.method === 'GET' ? undefined : req.body,
    });
  });

  next();
};
