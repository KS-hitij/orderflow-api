import { RequestHandler, Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/asyncHandler';
import { requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { ProductService } from './product.service';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

const createProductSchema = z.object({
  sku: z.string().min(3),
  name: z.string().min(1),
  priceCents: z.number().int().positive(),
  stock: z.number().int().min(0),
});

const adjustStockSchema = z.object({
  delta: z.number().int(),
});

export function createProductRouter(
  productService: ProductService,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.get(
    '/',
    validate(listQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
      const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
      res.json(await productService.list(page, pageSize));
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      res.json(await productService.getById(req.params.id));
    }),
  );

  router.post(
    '/',
    authenticate,
    requireRole('admin'),
    validate(createProductSchema),
    asyncHandler(async (req, res) => {
      res.status(201).json(await productService.create(req.body));
    }),
  );

  router.patch(
    '/:id/stock',
    authenticate,
    requireRole('admin'),
    validate(adjustStockSchema),
    asyncHandler(async (req, res) => {
      res.json(await productService.adjustStock(req.params.id, req.body.delta));
    }),
  );

  return router;
}
