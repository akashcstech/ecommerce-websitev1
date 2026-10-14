"""Per-account cart (/api/cart). One row per product in a customer's cart."""

from fastapi import APIRouter, Depends, HTTPException

from lib.auth import current_customer
from lib.db import db
from models.shop import Cart, CartAdd, CartItem, CartUpdate, new_id, now_iso
from routers.catalog import category_map, to_product

router = APIRouter(prefix="/cart", tags=["cart"])


async def build_cart(user_id: str) -> Cart:
    rows = await db.carts.find({"user_id": user_id}, {"_id": 0}).sort("added_at", 1).to_list(500)
    ids = [r["product_id"] for r in rows]
    products = {p["id"]: p async for p in db.products.find({"id": {"$in": ids}}, {"_id": 0})}
    cats = await category_map()
    items: list[CartItem] = []
    for r in rows:
        p = products.get(r["product_id"])
        if not p:  # product was deleted by admin — drop the stale row
            await db.carts.delete_one({"id": r["id"]})
            continue
        product = to_product(p, cats)
        items.append(
            CartItem(
                id=r["id"],
                product_id=r["product_id"],
                quantity=r["quantity"],
                product=product,
                line_total=round(product.price * r["quantity"], 2),
            )
        )
    return Cart(
        items=items,
        total=round(sum(i.line_total for i in items), 2),
        count=sum(i.quantity for i in items),
    )


@router.get("", response_model=Cart)
async def get_cart(user: dict = Depends(current_customer)):
    return await build_cart(user["id"])


@router.post("/items", response_model=Cart)
async def add_item(body: CartAdd, user: dict = Depends(current_customer)):
    product = await db.products.find_one({"id": body.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product["stock"] <= 0:
        raise HTTPException(status_code=400, detail="This product is out of stock")
    existing = await db.carts.find_one({"user_id": user["id"], "product_id": body.product_id})
    new_qty = body.quantity + (existing["quantity"] if existing else 0)
    if new_qty > product["stock"]:
        raise HTTPException(status_code=400, detail=f"Only {product['stock']} left in stock")
    if existing:
        await db.carts.update_one({"id": existing["id"]}, {"$set": {"quantity": new_qty}})
    else:
        await db.carts.insert_one(
            {
                "id": new_id(),
                "user_id": user["id"],
                "product_id": body.product_id,
                "quantity": new_qty,
                "added_at": now_iso(),
            }
        )
    return await build_cart(user["id"])


@router.patch("/items/{id}", response_model=Cart)
async def update_item(id: str, body: CartUpdate, user: dict = Depends(current_customer)):
    row = await db.carts.find_one({"id": id, "user_id": user["id"]})
    if not row:
        raise HTTPException(status_code=404, detail="Cart item not found")
    product = await db.products.find_one({"id": row["product_id"]})
    if not product or body.quantity > product["stock"]:
        stock = product["stock"] if product else 0
        raise HTTPException(status_code=400, detail=f"Only {stock} left in stock")
    await db.carts.update_one({"id": id}, {"$set": {"quantity": body.quantity}})
    return await build_cart(user["id"])


@router.delete("/items/{id}", response_model=Cart)
async def remove_item(id: str, user: dict = Depends(current_customer)):
    await db.carts.delete_one({"id": id, "user_id": user["id"]})
    return await build_cart(user["id"])
