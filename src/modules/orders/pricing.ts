import { config } from '../../config/env';

const DISCOUNT_CODES: Record<string, number> = {
  SAVE10: 0.1,
  SAVE20: 0.2,
};

export interface PricedLine {
  unitPriceCents: number;
  quantity: number;
}

export interface Totals {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
}

export function calculateTotals(lines: PricedLine[], discountCode?: string): Totals {
  const subtotalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);

  const rate = discountCode ? (DISCOUNT_CODES[discountCode.toUpperCase()] ?? 0) : 0;
  const discountCents = Math.round(subtotalCents * rate);
  const discountedSubtotal = subtotalCents - discountCents;

  const taxCents = subtotalCents * config.taxRate;

  const shippingCents =
    discountedSubtotal > config.freeShippingThresholdCents ? 0 : config.flatShippingCents;

  const totalCents = discountedSubtotal + taxCents + shippingCents;

  return { subtotalCents, discountCents, taxCents, shippingCents, totalCents };
}
