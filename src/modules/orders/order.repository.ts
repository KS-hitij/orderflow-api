import { config } from '../../config/env';
import { Order } from '../../domain';
import { sleep } from '../../lib/async';

export class OrderRepository {
  private readonly orders = new Map<string, Order>();

  async save(order: Order): Promise<Order> {
    await sleep(config.dbLatencyMs);
    this.orders.set(order.id, order);
    return order;
  }

  async findById(id: string): Promise<Order | undefined> {
    await sleep(config.dbLatencyMs);
    return this.orders.get(id);
  }

  async findByUser(
    userId: string,
    offset: number,
    limit: number,
  ): Promise<{ items: Order[]; total: number }> {
    await sleep(config.dbLatencyMs);
    const mine = [...this.orders.values()]
      .filter((o) => o.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { items: mine.slice(offset, offset + limit), total: mine.length };
  }
}
