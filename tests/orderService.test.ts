import { beforeEach, describe, expect, it } from 'vitest';
import { JobQueue } from '../src/jobs/queue';
import { OrderRepository } from '../src/modules/orders/order.repository';
import { OrderService } from '../src/modules/orders/order.service';
import { ProductRepository } from '../src/modules/products/product.repository';
import { ProductService } from '../src/modules/products/product.service';

async function setup(stockA: number, stockB = 10) {
  const products = new ProductRepository(false);
  const a = await products.save({ id: crypto.randomUUID(), sku: 'A-001', name: 'A', priceCents: 1000, stock: stockA });
  const b = await products.save({ id: crypto.randomUUID(), sku: 'B-001', name: 'B', priceCents: 2000, stock: stockB });
  const productService = new ProductService(products);
  const service = new OrderService(new OrderRepository(), products, productService, new JobQueue());
  return { products, service, a, b };
}

describe('OrderService.create', () => {
  let ctx: Awaited<ReturnType<typeof setup>>;

  describe('with plenty of stock', () => {
    beforeEach(async () => {
      ctx = await setup(10);
    });

    it('creates a pending order and decrements stock', async () => {
      const order = await ctx.service.create('user-1', { items: [{ productId: ctx.a.id, quantity: 2 }] });
      expect(order.status).toBe('pending');
      expect((await ctx.products.findById(ctx.a.id))?.stock).toBe(8);
    });

    it('rejects orders larger than available stock', async () => {
      await expect(
        ctx.service.create('user-1', { items: [{ productId: ctx.a.id, quantity: 11 }] }),
      ).rejects.toThrow(/Insufficient stock/);
    });
  });

  it('never oversells under concurrent requests', async () => {
    ctx = await setup(5);
    const attempt = () =>
      ctx.service.create('user-1', { items: [{ productId: ctx.a.id, quantity: 3 }] }).then(
        () => 'ok',
        () => 'rejected',
      );
    const results = await Promise.all([attempt(), attempt()]);
    expect(results.filter((r) => r === 'ok')).toHaveLength(1);
    expect((await ctx.products.findById(ctx.a.id))?.stock).toBeGreaterThanOrEqual(0);
  });

  it('releases reserved stock when a later line item fails', async () => {
    ctx = await setup(10, 1);
    await expect(
      ctx.service.create('user-1', {
        items: [
          { productId: ctx.a.id, quantity: 4 },
          { productId: ctx.b.id, quantity: 5 },
        ],
      }),
    ).rejects.toThrow();
    expect((await ctx.products.findById(ctx.a.id))?.stock).toBe(10);
  });

  it('returns the same order for a repeated idempotency key from the same user', async () => {
    ctx = await setup(10);
    const input = { items: [{ productId: ctx.a.id, quantity: 1 }] };
    const first = await ctx.service.create('user-1', input, 'key-1');
    const second = await ctx.service.create('user-1', input, 'key-1');
    expect(second.id).toBe(first.id);
  });
});
