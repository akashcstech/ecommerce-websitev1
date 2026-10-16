"""Pydantic v2 models for the shop. Mirrored by hand in frontend/src/lib/types.ts."""

import uuid
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

OrderStatus = Literal["Placed", "Shipped", "Delivered", "Cancelled"]
PaymentMethod = Literal["cod", "card"]


def new_id() -> str:
    return str(uuid.uuid4())


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Users ----------
class UserPublic(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    address: str = ""
    is_admin: bool = False
    is_active: bool = True
    created_at: str


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=15, pattern=r"^[0-9+\- ]+$")
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class ProfileUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    phone: str = Field(min_length=7, max_length=15, pattern=r"^[0-9+\- ]+$")
    address: str = Field(default="", max_length=400)


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=6, max_length=128)


# ---------- Catalogue ----------
class Category(BaseModel):
    id: str
    name: str
    product_count: int = 0


class CategoryIn(BaseModel):
    name: str = Field(min_length=2, max_length=60)


class Product(BaseModel):
    id: str
    category_id: str
    category_name: str = ""
    name: str
    description: str
    price: float
    mrp: float | None = None          # MRP / original price (for strikethrough)
    offer_label: str | None = None    # e.g. "SALE", "20% OFF", "LIMITED"
    stock: int
    image_url: str
    created_at: str


class ProductIn(BaseModel):
    category_id: str = Field(min_length=1)
    name: str = Field(min_length=2, max_length=120)
    description: str = Field(default="", max_length=2000)
    price: float = Field(gt=0, le=10_000_000)
    mrp: float | None = Field(default=None, gt=0, le=10_000_000)
    offer_label: str | None = Field(default=None, max_length=30)
    stock: int = Field(ge=0, le=1_000_000)
    image_url: str = Field(min_length=1, max_length=1_500_000)  # URL or uploaded data: URL


class ProductPage(BaseModel):
    items: list[Product]
    total: int
    page: int
    pages: int


# ---------- Cart ----------
class CartItem(BaseModel):
    id: str
    product_id: str
    quantity: int
    product: Product
    line_total: float


class Cart(BaseModel):
    items: list[CartItem]
    total: float
    count: int


class CartAdd(BaseModel):
    product_id: str
    quantity: int = Field(default=1, ge=1, le=100)


class CartUpdate(BaseModel):
    quantity: int = Field(ge=1, le=100)


# ---------- Orders ----------
class OrderItem(BaseModel):
    id: str
    product_id: str
    name: str
    image_url: str
    quantity: int
    unit_price: float


class Order(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    items: list[OrderItem]
    total: float
    status: OrderStatus
    payment_method: PaymentMethod
    payment_status: Literal["pending", "paid", "refunded"]
    card_last4: str | None = None
    delivery_address: str
    created_at: str


class CardIn(BaseModel):
    holder: str = Field(min_length=2, max_length=80)
    number: str = Field(min_length=12, max_length=23)
    expiry: str = Field(pattern=r"^(0[1-9]|1[0-2])/\d{2}$")
    cvv: str = Field(pattern=r"^\d{3,4}$")


class CheckoutIn(BaseModel):
    delivery_address: str = Field(min_length=10, max_length=400)
    payment_method: PaymentMethod
    card: CardIn | None = None


class StatusUpdate(BaseModel):
    status: OrderStatus


# ---------- Admin ----------
class AdminStats(BaseModel):
    orders: int
    products: int
    customers: int
    categories: int
    revenue: float
    placed_orders: int
    out_of_stock: int


class ActiveUpdate(BaseModel):
    is_active: bool
