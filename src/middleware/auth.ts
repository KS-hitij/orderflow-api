import { RequestHandler } from 'express';
import { Role } from '../domain';
import { ForbiddenError, UnauthorizedError } from '../lib/errors';
import { AuthService } from '../modules/auth/auth.service';

export const authenticate =
  (authService: AuthService): RequestHandler =>
  (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing bearer token');
    }

    try {
      req.auth = authService.verifyToken(header.slice('Bearer '.length));
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }

    next();
  };

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth) throw new UnauthorizedError();
    if (!roles.includes(req.auth.role)) throw new ForbiddenError('Insufficient permissions');
    next();
  };
