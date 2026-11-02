import { OrderStatus } from '../../domain';

export function assertNever(value: never): never {
  throw new Error(`Unhandled order status: ${String(value)}`);
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  switch (from) {
    case 'pending':
      return to === 'paid' || to === 'cancelled';
    case 'paid':
      return to === 'shipped' || to === 'cancelled' || to === 'refunded';
    case 'shipped':
      return to === 'refunded';
    case 'cancelled':
      return false;
    default:
      return assertNever(from);
  }
}
