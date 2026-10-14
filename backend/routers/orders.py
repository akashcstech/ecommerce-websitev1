"""Checkout, order history and customer cancellation (/api/orders)."""

import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from lib.auth import current_customer, current_user
from lib.db import db
from models.shop import CardIn, CheckoutIn, Order, new_id, now_iso
from routers.cart import build_cart

router = APIRouter(prefix="/orders", tags=["orders"])


def validate_card(card: CardIn | None) -> str:
    """Simulated payment: validate the card shape and return its last 4 digits. No card data is stored."""
    if card is None:
        raise HTTPException(status_code=400, detail="Card details are required for card payment")
    digits = re.sub(r"[\s-]", "", card.number)
    if not digits.isdigit() or not 12 <= len(digits) <= 19:
        raise HTTPException(status_code=400, detail="Card number must be 12-19 digits")
    month, year = card.expiry.split("/")
    now = datetime.now(timezone.utc)
    if (2000 + int(year), int(month)) < (now.year, now.month):
        raise HTTPException(status_code=400, detail="Card has expired")
    if digits.endswith("0000"):
        raise HTTPException(status_code=402, detail="Payment declined by the bank (simulated)")
    return digits[-4:]


async def restore_stock(items: list[dict]) -> None:
    for it in items:
        await db.products.update_one({"id": it["product_id"]}, {"$inc": {"stock": it["quantity"]}})


@router.post("/checkout", response_model=Order)
async def checkout(body: CheckoutIn, user: dict = Depends(current_customer)):
    cart = await build_cart(user["id"])
    if not cart.items:
        raise HTTPException(status_code=400, detail="Your cart is empty")
    card_last4 = validate_card(body.card) if body.payment_method == "card" else None

    # Reserve stock item by item with a conditional decrement; roll back on any failure
    # so a failed order leaves no partial data (two buyers can't both take the last unit).
    reserved: list[dict] = []
    for item in cart.items:
        res = await db.products.update_one(
            {"id": item.product_id, "stock": {"$gte": item.quantity}},
            {"$inc": {"stock": -item.quantity}},
        )
        if res.modified_count != 1:
            await restore_stock(reserved)
            raise HTTPException(
                status_code=400,
                detail=f"'{item.product.name}' does not have enough stock. Please update your cart.",
            )
        reserved.append({"product_id": item.product_id, "quantity": item.quantity})

    order = {
        "id": new_id(),
        "user_id": user["id"],
        "user_name": user["name"],
        "user_email": user["email"],
        "items": [
            {
                "id": new_id(),
                "product_id": i.product_id,
                "name": i.product.name,
                "image_url": i.product.image_url,
                "quantity": i.quantity,
                "unit_price": i.product.price,
            }
            for i in cart.items
        ],
        "total": cart.total,
        "status": "Placed",
        "payment_method": body.payment_method,
        "payment_status": "paid" if body.payment_method == "card" else "pending",
        "card_last4": card_last4,
        "delivery_address": body.delivery_address.strip(),
        "created_at": now_iso(),
    }
    try:
        await db.orders.insert_one(dict(order))
    except Exception:
        await restore_stock(reserved)
        raise HTTPException(status_code=500, detail="Could not place order, please retry")
    await db.carts.delete_many({"user_id": user["id"]})
    if not user.get("address"):
        await db.users.update_one({"id": user["id"]}, {"$set": {"address": order["delivery_address"]}})
    return Order(**order)


@router.get("", response_model=list[Order])
async def my_orders(user: dict = Depends(current_customer)):
    docs = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [Order(**d) for d in docs]


@router.get("/{id}", response_model=Order)
async def get_order(id: str, user: dict = Depends(current_user)):
    doc = await db.orders.find_one({"id": id}, {"_id": 0})
    if not doc or (doc["user_id"] != user["id"] and not user.get("is_admin")):
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**doc)


@router.post("/{id}/cancel", response_model=Order)
async def cancel_order(id: str, user: dict = Depends(current_customer)):
    doc = await db.orders.find_one({"id": id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    res = await db.orders.update_one(
        {"id": id, "status": "Placed"},
        {"$set": {"status": "Cancelled", "payment_status": "refunded" if doc["payment_status"] == "paid" else doc["payment_status"]}},
    )
    if res.modified_count != 1:
        raise HTTPException(status_code=400, detail="Only orders in 'Placed' status can be cancelled")
    await restore_stock(doc["items"])
    return Order(**(await db.orders.find_one({"id": id}, {"_id": 0})))
