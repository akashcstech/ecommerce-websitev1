// Hand-written mirrors of backend/models/shop.py — keep in sync with the Pydantic models.

export type OrderStatus = "Placed" | "Shipped" | "Delivered" | "Cancelled";
export type PaymentMethod = "cod" | "card";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  product_count: number;
}

export interface Product {
  id: string;
  category_id: string;
  category_name: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  created_at: string;
}

export interface ProductInput {
  category_id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
}

export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  pages: number;
}

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: Product;
  line_total: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  count: number;
}

export interface OrderItem {
  id: string;
  product_id: string;
  name: string;
  image_url: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: "pending" | "paid" | "refunded";
  card_last4: string | null;
  delivery_address: string;
  created_at: string;
}

export interface CardInput {
  holder: string;
  number: string;
  expiry: string;
  cvv: string;
}

export interface CheckoutInput {
  delivery_address: string;
  payment_method: PaymentMethod;
  card: CardInput | null;
}

export interface AdminStats {
  orders: number;
  products: number;
  customers: number;
  categories: number;
  revenue: number;
  placed_orders: number;
  out_of_stock: number;
}

export const ORDER_STATUSES: OrderStatus[] = ["Placed", "Shipped", "Delivered", "Cancelled"];
