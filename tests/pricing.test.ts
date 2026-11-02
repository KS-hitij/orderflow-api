import { describe, expect, it } from 'vitest';
import { calculateTotals } from '../src/modules/orders/pricing';

describe('calculateTotals', () => {
  it('charges flat shipping and tax on a small order', () => {
    // 2 x $20.00 = $40.00 subtotal, 8.25% tax = $3.30, $5.00 shipping
    const totals = calculateTotals([{ unitPriceCents: 2000, quantity: 2 }]);
    expect(totals.subtotalCents).toBe(4000);
    expect(totals.taxCents).toBe(330);
    expect(totals.shippingCents).toBe(500);
    expect(totals.totalCents).toBe(4830);
  });

  it('applies the discount before tax', () => {
    // $100.00 - 10% = $90.00, tax 8.25% = $7.425 -> 743 cents, free shipping
    const totals = calculateTotals([{ unitPriceCents: 10000, quantity: 1 }], 'SAVE10');
    expect(totals.discountCents).toBe(1000);
    expect(totals.taxCents).toBe(743);
    expect(totals.totalCents).toBe(9743);
  });

  it('always produces whole-cent amounts', () => {
    const totals = calculateTotals([{ unitPriceCents: 1299, quantity: 3 }]);
    expect(Number.isInteger(totals.taxCents)).toBe(true);
    expect(Number.isInteger(totals.totalCents)).toBe(true);
  });

  it('gives free shipping at exactly $50.00', () => {
    const totals = calculateTotals([{ unitPriceCents: 5000, quantity: 1 }]);
    expect(totals.shippingCents).toBe(0);
  });

  it('ignores unknown discount codes', () => {
    const totals = calculateTotals([{ unitPriceCents: 1000, quantity: 1 }], 'NOPE');
    expect(totals.discountCents).toBe(0);
  });
});
