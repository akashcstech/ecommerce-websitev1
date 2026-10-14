"""Public catalogue: categories and products with search, filter, sort and pagination."""

import math
import re
from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from lib.db import db
from models.shop import Category, Product, ProductPage

router = APIRouter(tags=["catalog"])


async def category_map() -> dict[str, str]:
    cats = await db.categories.find({}, {"_id": 0}).to_list(1000)
    return {c["id"]: c["name"] for c in cats}


def to_product(doc: dict, cats: dict[str, str]) -> Product:
    return Product(**{**doc, "category_name": cats.get(doc["category_id"], "Uncategorised")})


@router.get("/categories", response_model=list[Category])
async def list_categories():
    cats = await db.categories.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    counts = {
        row["_id"]: row["n"]
        async for row in db.products.aggregate([{"$group": {"_id": "$category_id", "n": {"$sum": 1}}}])
    }
    return [Category(id=c["id"], name=c["name"], product_count=counts.get(c["id"], 0)) for c in cats]


@router.get("/products", response_model=ProductPage)
async def list_products(
    q: str = "",
    category_id: str = "",
    sort: Literal["newest", "price_asc", "price_desc", "name"] = "newest",
    in_stock: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=200),
):
    query: dict = {}
    if q.strip():
        query["name"] = {"$regex": re.escape(q.strip()), "$options": "i"}
    if category_id:
        query["category_id"] = category_id
    if in_stock:
        query["stock"] = {"$gt": 0}
    sort_spec = {
        "newest": [("created_at", -1)],
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "name": [("name", 1)],
    }[sort]
    total = await db.products.count_documents(query)
    docs = (
        await db.products.find(query, {"_id": 0})
        .sort(sort_spec)
        .skip((page - 1) * page_size)
        .limit(page_size)
        .to_list(page_size)
    )
    cats = await category_map()
    return ProductPage(
        items=[to_product(d, cats) for d in docs],
        total=total,
        page=page,
        pages=max(1, math.ceil(total / page_size)),
    )


@router.get("/products/{id}", response_model=Product)
async def get_product(id: str):
    doc = await db.products.find_one({"id": id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return to_product(doc, await category_map())
