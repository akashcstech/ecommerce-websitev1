"""Admin panel API (/api/admin/*) — staff only."""

from fastapi import APIRouter, Depends, HTTPException

from lib.auth import current_admin
from lib.db import db
from models.shop import (
    ActiveUpdate,
    AdminStats,
    Category,
    CategoryIn,
    Order,
    OrderStatus,
    Product,
    ProductIn,
    StatusUpdate,
    UserPublic,
    new_id,
    now_iso,
)
from routers.catalog import category_map, to_product
from routers.orders import restore_stock

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(current_admin)])


# ---------- Dashboard ----------
@router.get("/stats", response_model=AdminStats)
async def stats():
    revenue_rows = await db.orders.aggregate(
        [{"$match": {"status": {"$ne": "Cancelled"}}}, {"$group": {"_id": None, "sum": {"$sum": "$total"}}}]
    ).to_list(1)
    return AdminStats(
        orders=await db.orders.count_documents({}),
        products=await db.products.count_documents({}),
        customers=await db.users.count_documents({"is_admin": False}),
        categories=await db.categories.count_documents({}),
        revenue=round(revenue_rows[0]["sum"], 2) if revenue_rows else 0,
        placed_orders=await db.orders.count_documents({"status": "Placed"}),
        out_of_stock=await db.products.count_documents({"stock": {"$lte": 0}}),
    )


# ---------- Categories ----------
async def _unique_category(name: str, exclude_id: str | None = None) -> None:
    import re

    q: dict = {"name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}}
    if exclude_id:
        q["id"] = {"$ne": exclude_id}
    if await db.categories.find_one(q):
        raise HTTPException(status_code=400, detail="A category with this name already exists")


@router.post("/categories", response_model=Category)
async def create_category(body: CategoryIn):
    name = body.name.strip()
    await _unique_category(name)
    cat = {"id": new_id(), "name": name}
    await db.categories.insert_one(dict(cat))
    return Category(**cat)


@router.put("/categories/{id}", response_model=Category)
async def update_category(id: str, body: CategoryIn):
    name = body.name.strip()
    await _unique_category(name, exclude_id=id)
    res = await db.categories.update_one({"id": id}, {"$set": {"name": name}})
    if res.matched_count != 1:
        raise HTTPException(status_code=404, detail="Category not found")
    return Category(id=id, name=name, product_count=await db.products.count_documents({"category_id": id}))


@router.delete("/categories/{id}")
async def delete_category(id: str):
    if await db.products.count_documents({"category_id": id}):
        raise HTTPException(status_code=400, detail="Move or delete this category's products first")
    res = await db.categories.delete_one({"id": id})
    if res.deleted_count != 1:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"ok": True}


# ---------- Products ----------
async def _check_category(category_id: str) -> None:
    if not await db.categories.find_one({"id": category_id}):
        raise HTTPException(status_code=400, detail="Category does not exist")


@router.post("/products", response_model=Product)
async def create_product(body: ProductIn):
    await _check_category(body.category_id)
    doc = {"id": new_id(), **body.model_dump(), "created_at": now_iso()}
    doc["name"] = doc["name"].strip()
    await db.products.insert_one(dict(doc))
    return to_product(doc, await category_map())


@router.put("/products/{id}", response_model=Product)
async def update_product(id: str, body: ProductIn):
    await _check_category(body.category_id)
    res = await db.products.update_one({"id": id}, {"$set": body.model_dump()})
    if res.matched_count != 1:
        raise HTTPException(status_code=404, detail="Product not found")
    doc = await db.products.find_one({"id": id}, {"_id": 0})
    return to_product(doc, await category_map())


@router.delete("/products/{id}")
async def delete_product(id: str):
    res = await db.products.delete_one({"id": id})
    if res.deleted_count != 1:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.carts.delete_many({"product_id": id})
    return {"ok": True}


# ---------- Orders ----------
@router.get("/orders", response_model=list[Order])
async def all_orders(status: OrderStatus | None = None):
    q = {"status": status} if status else {}
    docs = await db.orders.find(q, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return [Order(**d) for d in docs]


@router.patch("/orders/{id}/status", response_model=Order)
async def set_order_status(id: str, body: StatusUpdate):
    doc = await db.orders.find_one({"id": id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    if doc["status"] == "Cancelled" and body.status != "Cancelled":
        raise HTTPException(status_code=400, detail="A cancelled order cannot be reopened")
    update: dict = {"status": body.status}
    if body.status == "Cancelled" and doc["status"] != "Cancelled":
        await restore_stock(doc["items"])
        if doc["payment_status"] == "paid":
            update["payment_status"] = "refunded"
    if body.status == "Delivered" and doc["payment_method"] == "cod":
        update["payment_status"] = "paid"  # cash collected on delivery
    await db.orders.update_one({"id": id}, {"$set": update})
    return Order(**{**doc, **update})


# ---------- Customers ----------
@router.get("/customers", response_model=list[UserPublic])
async def customers():
    docs = await db.users.find({"is_admin": False}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(5000)
    return [UserPublic(**d) for d in docs]


@router.patch("/customers/{id}/active", response_model=UserPublic)
async def set_active(id: str, body: ActiveUpdate):
    res = await db.users.update_one({"id": id, "is_admin": False}, {"$set": {"is_active": body.is_active}})
    if res.matched_count != 1:
        raise HTTPException(status_code=404, detail="Customer not found")
    doc = await db.users.find_one({"id": id}, {"_id": 0, "password_hash": 0})
    return UserPublic(**doc)
