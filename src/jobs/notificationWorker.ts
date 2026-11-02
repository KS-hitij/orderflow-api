import { config } from '../config/env';
import { logger } from '../lib/logger';
import { OrderRepository } from '../modules/orders/order.repository';
import { UserRepository } from '../modules/users/user.repository';
import { Mailer } from './mailer';
import { JobQueue, QueuedJob } from './queue';

const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 1000;
const POLL_INTERVAL_MS = 500;

export class NotificationWorker {
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly queue: JobQueue,
    private readonly mailer: Mailer,
    private readonly users: UserRepository,
    private readonly orders: OrderRepository,
  ) {}

  start(): void {
    this.timer = setInterval(() => this.tick(), POLL_INTERVAL_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async tick(): Promise<void> {
    const job = this.queue.takeDue();
    if (!job) return;

    try {
      await this.handle(job);
    } catch (err) {
      job.attempts += 1;
      logger.warn('notification job failed', { jobId: job.id, attempts: job.attempts, error: err.message });

      if (job.attempts >= MAX_ATTEMPTS) {
        logger.error('notification job dropped', { jobId: job.id, event: job.event });
        return;
      }
      this.queue.requeue(job, BASE_BACKOFF_MS * 2 ** job.attempts);
    }
  }

  private async handle(job: QueuedJob): Promise<void> {
    const { type, orderId, userId } = job.event;
    const [user, order] = await Promise.all([
      this.users.findById(userId),
      this.orders.findById(orderId),
    ]);
    if (!user || !order) {
      throw new Error(`Missing user or order for job ${job.id}`);
    }

    const verb = type === 'order.created' ? 'confirmed' : 'cancelled';
    await this.mailer.send({
      to: user.email,
      subject: `Your order ${order.id} was ${verb}`,
      body: `Order ${order.id} is ${order.status}. Total: ${order.totalCents} cents.`,
    });

    if (type === 'order.created') {
      this.mailer.send({
        to: config.warehouseEmail,
        subject: `New order ${order.id}`,
        body: `${order.items.length} line item(s) to pick and pack.`,
      });
    }
  }
}
