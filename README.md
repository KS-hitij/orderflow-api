# OrderFlow API

A small orders & inventory backend built with Node.js, Express and TypeScript.
Data is held in memory (repositories simulate DB latency), so there is nothing to install besides Node.

> **Heads up:** this repository is a test fixture and is known to be unhealthy. It does not
> type-check cleanly, some tests fail, and CI is expected to be red. Do not deploy it.

## Features

- **Auth**: register / login with JWT bearer tokens, `customer` and `admin` roles
- **Products & inventory**: paginated catalogue, admin-only create and stock adjustment, TTL read cache
- **Orders**: create (with discount codes and idempotency keys), view, list, cancel, admin status changes
- **Notifications**: background worker that emails customers and the warehouse about order events, with retries

## Getting started

```bash
cp .env.example .env
npm install
npm run dev          # tsx watch, listens on :3000
npm run typecheck    # tsc --noEmit
npm test             # vitest
npm run build && npm start
```

A seeded admin account is created on boot from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
See `requests.http` for a ready-made request collection (VS Code REST Client / JetBrains HTTP client).

## Project layout

```
src/
  index.ts              process bootstrap, graceful shutdown
  app.ts                express app + route wiring
  container.ts          manual dependency wiring
  config/env.ts         environment configuration
  domain.ts             shared domain types
  lib/                  errors, logger, TTL cache, helpers
  middleware/           auth, validation, request id/logging, error handler
  modules/
    auth/ users/ products/ orders/    routes -> service -> repository
  jobs/                 in-memory queue, mailer, notification worker
tests/                  vitest suites
```

## API

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/health` | none | liveness + queue depth |
| POST | `/api/auth/register` | none | `{ email, password }` |
| POST | `/api/auth/login` | none | `{ email, password }` |
| GET | `/api/products?page=&pageSize=` | none | 1-indexed pages |
| GET | `/api/products/:id` | none | |
| POST | `/api/products` | admin | `{ sku, name, priceCents, stock }` |
| PATCH | `/api/products/:id/stock` | admin | `{ delta }` |
| POST | `/api/orders` | user | `{ items: [{ productId, quantity }], discountCode? }`, optional `Idempotency-Key` header |
| GET | `/api/orders?page=&pageSize=` | user | the caller's orders |
| GET | `/api/orders/:id` | user | |
| POST | `/api/orders/:id/cancel` | user | restocks the items |
| PATCH | `/api/orders/:id/status` | admin | `{ status }` |

## Intended behaviour

These are the rules the service is supposed to follow.

**Money**
- All amounts are integer cents.
- Discount codes `SAVE10` and `SAVE20` take 10% / 20% off the subtotal (case-insensitive, unknown codes are ignored).
- Tax is 8.25% of the **discounted** subtotal, rounded to the nearest cent.
- Shipping is a flat $5.00, free when the discounted subtotal is **$50.00 or more**.

**Inventory**
- Stock must never go negative, and two concurrent orders must not be able to sell the same unit.
- An order that fails part-way must leave stock exactly as it found it.
- Stock reads must reflect recent changes.

**Orders**
- Lifecycle: `pending -> paid -> shipped`, `pending/paid -> cancelled`, `paid/shipped -> refunded`. `cancelled` and `refunded` are terminal.
- A customer can only see and cancel their own orders; admins can access any order.
- Only `pending` or `paid` orders can be cancelled. Cancelling restocks once.
- `Idempotency-Key` is scoped to the calling user. Replaying a key returns the original order.

**Auth & errors**
- Emails are unique case-insensitively.
- Access tokens last `JWT_EXPIRES_IN_MINUTES` minutes.
- Invalid input returns `400`, wrong credentials (including unknown email) return `401`.
- Internal error details and stack traces are never returned to clients in production.
- Secrets and credentials must not appear in logs.
- The server must refuse to start in production without a real `JWT_SECRET`.

**Background work**
- Failed notifications are retried with exponential backoff (max 5 attempts).
- A failing email must never crash the process.
- Shutdown should finish in-flight requests before exiting.
