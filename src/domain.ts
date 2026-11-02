export type Role = 'admin' | 'customer';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  priceCents: number;
  stock: number;
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'cancelled' | 'refunded';

export interface OrderItem {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
  createdAt: Date;
}

export interface AuthContext {
  userId: string;
  role: Role;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
