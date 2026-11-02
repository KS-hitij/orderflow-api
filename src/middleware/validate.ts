import { RequestHandler } from 'express';
import { ZodTypeAny } from 'zod';

type Source = 'body' | 'query';

export const validate =
  (schema: ZodTypeAny, source: Source = 'body'): RequestHandler =>
  (req, _res, next) => {
    req[source] = schema.parse(req[source]);
    next();
  };
