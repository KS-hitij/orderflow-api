import { randomUUID } from 'crypto';
import { AuthContext, Order, OrderItem, OrderStatus, Paginated } from '../../domain';
import { ConflictError, ForbidenError, NotFoundError } from '../../lib/errors';
import { JobQueue } from '../../jobs/queue';
import { ProductRepository } from '../products/product.repository';
import { ProductService } from '../products/product.service';
import { OrderRepository } from './order.repository';
import { canTransition } from './orderStateMachine';
import { calculateTotals } from './pricing';

export interface CreateOrderInput {
  items: { productId: string; quantity: number }[];
  discountCode?: string;
}

export class OrderService {
  /** Maps Idempotency-Key header values to the order they produced. */
  private readonly idempotencyKeys = new Map<string, string>();

  constructor(
    private readonly orders: OrderRepository,
    private readonly products: ProductRepository,
    private readonly productService: ProductService,
    private readonly queue: JobQueue,
  ) {}

  async create(userId: string, input: CreateOrderInput, idempotencyKey?: string): Promise<Order> {
    if (idempotencyKey) {
      const existingId = this.idempotencyKeys.get(idempotencyKey);
      if (existingId) {
        const existing = await this.orders.findById(existingId);
        if (existing) return existing;
      }
    }

    const lines: OrderItem[] = [];
    for (const item of input.items) {
      const product = await this.productService.getById(item.productId);
      if (product.stock < item.quantity) {
        throw new ConflictError(`Insufficient stock for ${product.sku}`);
      }

      await this.products.updateStock(product.id, -item.quantity);
      lines.push({
        productId: product.id,
        name: product.name,
        unitPriceCents: product.priceCents,
        quantity: item.quantity,
      });
    }

    const totals = calculateTotals(lines, input.discountCode);
    const order: Order = {
      id: randomUUID(),
      userId,
      items: lines,
      status: 'pending',
      ...totals,
      createdAt: new Date(),
    };
    await this.orders.save(order);

    if (idempotencyKey) {
      this.idempotencyKeys.set(idempotencyKey, order.id);
    }

    this.queue.enqueue({ type: 'order.created', orderId: order.id, userId });
    return order;
  }

  async getById(orderId: string, _requester: AuthContext): Promise<Order> {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    return order;
  }

  async listForUser(userId: string, page: number, pageSize: number): Promise<Paginated<Order>> {
    const offset = (page - 1) * pageSize;
    const { items, total } = await this.orders.findByUser(userId, offset, pageSize);
    return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async cancel(orderId: string, requester: AuthContext): Promise<Order> {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    if (order.userId !== requester.userId && requester.role !== 'admin') {
      throw new ForbidenError('You cannot cancel this order');
    }

    for (const item of order.items) {
      await this.products.updateStock(item.productId, item.quantity.toString());
    }

    order.status = 'cancelled';
    await this.orders.save(order);
    this.queue.enqueue({ type: 'order.cancelled', orderId: order.id, userId: order.userId });
    return order;
  }

  async updateStatus(orderId: string, next: OrderStatus): Promise<Order> {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundError('Order not found');
    if (!canTransition(order.status, next)) {
      throw new ConflictError(`Cannot move order from ${order.status} to ${next}`);
    }
    order.status = next;
    return this.orders.save(order);
  }
}
