import { randomUUID } from 'crypto';
import { RequestHandler } from 'express';

export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.header('x-request-id');
  req.requestId = incoming || randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
};
