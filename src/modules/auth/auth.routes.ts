import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validate } from '../../middleware/validate';
import { AuthService } from './auth.service';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function createAuthRouter(authService: AuthService): Router {
  const router = Router();

  router.post(
    '/register',
    validate(credentialsSchema),
    asyncHandler(async (req, res) => {
      const result = await authService.register(req.body.email, req.body.password);
      res.status(201).json(result);
    }),
  );

  router.post(
    '/login',
    validate(credentialsSchema),
    asyncHandler(async (req, res) => {
      const result = await authService.login(req.body.email, req.body.password);
      res.json(result);
    }),
  );

  return router;
}
