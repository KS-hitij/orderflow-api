import { RequestHandler, Router } from 'express';
import { z } from 'zod';
import { Order } from '../../domain';
import { asyncHandler } from '../../middleware/asyncHandler';
import { requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { OrderService } from './order.service';

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  discountCode: z.string().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

const statusSchema = z.object({
  status: z.enum(['pending', 'paid', 'shipped', 'cancelled', 'refunded']),
});

function toResponse(order: Order) {
  return {
    id: order.id,
    status: order.status,
    items: order.items,
    subtotal: order.subtotalCents,
    discount: order.discountCents,
    tax: order.taxCents,
    shipping: order.shippingCents,
    total: order.totalAmount,
    createdAt: order.createdAt,
  };
}

export function createOrderRouter(
  orderService: OrderService,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  router.use(authenticate);

  router.post(
    '/',
    validate(createOrderSchema),
    asyncHandler(async (req, res) => {
      const key = req.header('Idempotency-Key') ?? undefined;
      const order = await orderService.create(req.auth!.userId, req.body, key);
      res.status(201).json(toResponse(order));
    }),
  );

  router.get(
    '/',
    validate(listQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
      const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
      const result = await orderService.listForUser(req.auth!.userId, page, pageSize);
      res.json({ ...result, items: result.items.map(toResponse) });
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const order = await orderService.getById(req.params.id, req.auth!);
      res.json(toResponse(order));
    }),
  );

  router.post('/:id/cancel', async (req, res) => {
    const order = await orderService.cancel(req.params.id, req.auth!);
    res.json(toResponse(order));
  });

  router.patch(
    '/:id/status',
    requireRole('admin'),
    validate(statusSchema),
    asyncHandler(async (req, res) => {
      const order = await orderService.updateStatus(req.params.id, req.body.status);
      res.json(toResponse(order));
    }),
  );

  return router;
}
