import { ConsoleMailer } from './jobs/mailer';
import { NotificationWorker } from './jobs/notificationWorker';
import { JobQueue } from './jobs/queue';
import { AuthService } from './modules/auth/auth.service';
import { OrderRepository } from './modules/orders/order.repository';
import { OrderService } from './modules/orders/order.service';
import { ProductRepository } from './modules/products/product.repository';
import { ProductService } from './modules/products/product.service';
import { UserRepository } from './modules/users/user.repository';

export function createContainer() {
  const users = new UserRepository();
  const products = new ProductRepository();
  const orders = new OrderRepository();
  const queue = new JobQueue();
  const mailer = new ConsoleMailer();

  const authService = new AuthService(users);
  const productService = new ProductService(products);
  const orderService = new OrderService(orders, products, productService, queue);
  const worker = new NotificationWorker(queue, mailer, users, orders);

  return { users, products, orders, queue, authService, productService, orderService, worker };
}

export type Container = ReturnType<typeof createContainer>;
