import { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Express 4 does not catch rejected promises from async handlers, so forward them to next(). */
export const asyncHandler =
  (fn: AsyncRoute): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
