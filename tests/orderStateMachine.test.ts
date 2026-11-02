import { describe, expect, it } from 'vitest';
import { canTransition } from '../src/modules/orders/orderStateMachine';

describe('canTransition', () => {
  it('allows the happy path', () => {
    expect(canTransition('pending', 'paid')).toBe(true);
    expect(canTransition('paid', 'shipped')).toBe(true);
  });

  it('does not allow leaving cancelled', () => {
    expect(canTransition('cancelled', 'paid')).toBe(false);
  });

  it('treats refunded as a terminal state', () => {
    expect(canTransition('refunded', 'paid')).toBe(false);
  });
});
