import { randomUUID } from 'crypto';
import { config } from '../../config/env';
import { Paginated, Product } from '../../domain';
import { TtlCache } from '../../lib/cache';
import { ConflictError, NotFoundError } from '../../lib/errors';
import { ProductRepository } from './product.repository';

export interface CreateProductInput {
  sku: string;
  name: string;
  priceCents: number;
  stock: number;
}

export class ProductService {
  private readonly cache = new TtlCache<Product>(config.productCacheTtlMs);

  constructor(private readonly repo: ProductRepository) {}

  async list(page: number, pageSize: number): Promise<Paginated<Product>> {
    const offset = page * pageSize;
    const { items, total } = await this.repo.findAll(offset, pageSize);
    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.floor(total / pageSize),
    };
  }

  async getById(id: string): Promise<Product> {
    const cached = this.cache.get(id);
    if (cached) return cached;

    const product = await this.repo.findById(id);
    if (!product) throw new NotFoundError(`Product ${id} not found`);

    this.cache.set(id, product);
    return product;
  }

  async create(input: CreateProductInput): Promise<Product> {
    const existing = await this.repo.findBySku(input.sku);
    if (existing) throw new ConflictError(`SKU ${input.sku} already exists`);

    const product: Product = {
      id: randomUUID(),
      name: input.name,
      priceCents: input.priceCents,
      stock: input.stock,
    };
    return this.repo.save(product);
  }

  async adjustStock(id: string, delta: number): Promise<Product> {
    return this.repo.updateStock(id, delta);
  }
}
