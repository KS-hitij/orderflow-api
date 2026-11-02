import express, { Express } from 'express';
import { Container } from './container';
import { NotFoundError } from './lib/errors';
import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { requestId } from './middleware/requestId';
import { requestLogger } from './middleware/requestLogger';
import { createAuthRouter } from './modules/auth/auth.routes';
import { createOrderRouter } from './modules/orders/order.routes';
import { createProductRouter } from './modules/products/product.routes';

export function createApp(container: Container): Express {
  const app = express();

  app.use(requestId);
  app.use(express.json());
  app.use(requestLogger);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', queueDepth: container.queue.size(), uptimeSeconds: process.uptime() });
  });

  const requireAuth = authenticate(container.authService);
  app.use('/api/auth', createAuthRouter(container.authService));
  app.use('/api/products', createProductRouter(container.productService, requireAuth));
  app.use('/api/orders', createOrderRouter(container.orderService, requireAuth));

  app.use((_req, _res, next) => next(new NotFoundError('Route not found')));
  app.use(errorHandler);

  return app;
}
