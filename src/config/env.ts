import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),

  jwtSecret: process.env.JWT_SECRET ?? 'changeme',
  jwtExpiresInMinutes: Number(process.env.JWT_EXPIRES_IN_MINUTES ?? 60),
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 10),
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@orderflow.test',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin-password-123',

  dbLatencyMs: Number(process.env.DB_LATENCY_MS ?? 5),
  productCacheTtlMs: Number(process.env.PRODUCT_CACHE_TTL_MS ?? 60_000),

  emailFailureRate: Number(process.env.EMAIL_FAILURE_RATE ?? 0.2),
  warehouseEmail: process.env.WAREHOUSE_EMAIL ?? 'warehouse@orderflow.test',

  taxRate: 0.0825,
  flatShippingCents: 500,
  freeShippingThresholdCents: 5000,
};
