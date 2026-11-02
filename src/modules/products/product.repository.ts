import { randomUUID } from 'crypto';
import { config } from '../../config/env';
import { Product } from '../../domain';
import { sleep } from '../../lib/async';
import { NotFoundError } from '../../lib/errors';

const SEED_PRODUCTS: Omit<Product, 'id'>[] = [
  { sku: 'KB-001', name: 'Mechanical Keyboard', priceCents: 8999, stock: 25 },
  { sku: 'MS-002', name: 'Wireless Mouse', priceCents: 3499, stock: 40 },
  { sku: 'MN-003', name: '27" Monitor', priceCents: 22999, stock: 10 },
  { sku: 'HS-004', name: 'Noise-Cancelling Headset', priceCents: 15999, stock: 15 },
  { sku: 'WC-005', name: '1080p Webcam', priceCents: 5999, stock: 30 },
  { sku: 'DK-006', name: 'USB-C Docking Station', priceCents: 12999, stock: 12 },
  { sku: 'CB-007', name: 'USB-C Cable (2m)', priceCents: 1299, stock: 200 },
  { sku: 'LS-008', name: 'Laptop Stand', priceCents: 4599, stock: 35 },
  { sku: 'SP-009', name: 'Desk Speakers', priceCents: 6999, stock: 18 },
  { sku: 'MP-010', name: 'XL Desk Mat', priceCents: 2499, stock: 60 },
  { sku: 'SS-011', name: '1TB Portable SSD', priceCents: 10999, stock: 8 },
  { sku: 'HB-012', name: '7-Port USB Hub', priceCents: 2999, stock: 45 },
];

export class ProductRepository {
  private readonly products = new Map<string, Product>();

  constructor(seed = true) {
    if (seed) {
      for (const data of SEED_PRODUCTS) {
        const product: Product = { ...data, id: randomUUID() };
        this.products.set(product.id, product);
      }
    }
  }

  async findAll(offset: number, limit: number): Promise<{ items: Product[]; total: number }> {
    await sleep(config.dbLatencyMs);
    const all = [...this.products.values()].sort((a, b) => a.sku.localeCompare(b.sku));
    return {
      items: all.slice(offset, offset + limit).map((p) => ({ ...p })),
      total: all.length,
    };
  }

  async findById(id: string): Promise<Product | undefined> {
    await sleep(config.dbLatencyMs);
    const product = this.products.get(id);
    return product ? { ...product } : undefined;
  }

  async findBySku(sku: string): Promise<Product | undefined> {
    await sleep(config.dbLatencyMs);
    for (const product of this.products.values()) {
      if (product.sku === sku) return { ...product };
    }
    return undefined;
  }

  async save(product: Product): Promise<Product> {
    await sleep(config.dbLatencyMs);
    this.products.set(product.id, { ...product });
    return { ...product };
  }

  /** Applies a relative stock change. */
  async updateStock(id: string, delta: number): Promise<Product> {
    await sleep(config.dbLatencyMs);
    const product = this.products.get(id);
    if (!product) throw new NotFoundError(`Product ${id} not found`);
    product.stock += delta;
    return { ...product };
  }
}
