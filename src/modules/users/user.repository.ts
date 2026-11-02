import { randomUUID } from 'crypto';
import { config } from '../../config/env';
import { User } from '../../domain';
import { sleep } from '../../lib/async';

export class UserRepository {
  private readonly users = new Map<string, User>();

  async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    await sleep(config.dbLatencyMs);
    const user: User = { ...data, id: randomUUID(), createdAt: new Date() };
    this.users.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<User | undefined> {
    await sleep(config.dbLatencyMs);
    return this.users.get(id);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    await sleep(config.dbLatencyMs);
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return undefined;
  }
}
