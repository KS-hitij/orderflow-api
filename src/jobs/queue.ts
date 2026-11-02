import { randomUUID } from 'crypto';

export interface OrderEvent {
  type: 'order.created' | 'order.cancelled';
  orderId: string;
  userId: string;
}

export interface QueuedJob {
  id: string;
  event: OrderEvent;
  attempts: number;
  runAt: number;
}

export class JobQueue {
  private jobs: QueuedJob[] = [];

  enqueue(event: OrderEvent, delayMs = 0): QueuedJob {
    const job: QueuedJob = { id: randomUUID(), event, attempts: 0, runAt: Date.now() + delayMs };
    this.jobs.push(job);
    return job;
  }

  takeDue(now = Date.now()): QueuedJob | undefined {
    const index = this.jobs.findIndex((j) => j.runAt <= now);
    if (index === -1) return undefined;
    return this.jobs.splice(index, 1)[0];
  }

  requeue(job: QueuedJob, delayMs: number): void {
    job.runAt = Date.now() + delayMs;
    this.jobs.push(job);
  }

  size(): number {
    return this.jobs.length;
  }
}
