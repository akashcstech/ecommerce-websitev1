"""Shared Mongo handle — import `client`/`db` from here (server.py, routers, seed.py)."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel

load_dotenv(Path(__file__).parent.parent / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

logger = logging.getLogger(__name__)

# One entry per collection: every field a route filters, sorts, or dedupes on. Applied by ensure_indexes() at startup.
INDEXES: dict[str, list[IndexModel]] = {
    "users": [IndexModel([("id", ASCENDING)], name="id", unique=True), IndexModel([("email", ASCENDING)], name="email", unique=True)],
    "categories": [IndexModel([("id", ASCENDING)], name="id", unique=True), IndexModel([("name", ASCENDING)], name="name")],
    "products": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("name", ASCENDING)], name="name"),
        IndexModel([("category_id", ASCENDING), ("created_at", DESCENDING)], name="category_created"),
        IndexModel([("price", ASCENDING)], name="price"),
    ],
    "carts": [IndexModel([("id", ASCENDING)], name="id", unique=True), IndexModel([("user_id", ASCENDING), ("product_id", ASCENDING)], name="user_product", unique=True)],
    "orders": [IndexModel([("id", ASCENDING)], name="id", unique=True), IndexModel([("user_id", ASCENDING), ("created_at", DESCENDING)], name="user_created"), IndexModel([("status", ASCENDING), ("created_at", DESCENDING)], name="status_created")],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:  # one at a time so a bad spec skips only itself
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:  # never block boot on an index; the log line names what to fix
                logger.error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)
