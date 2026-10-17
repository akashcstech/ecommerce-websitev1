import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB connection
from lib.db import client, ensure_indexes  # noqa: E402
from routers import admin, auth, cart, catalog, export, orders  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.index_task = asyncio.create_task(ensure_indexes())
    yield
    client.close()


app = FastAPI(title="Bazaarline Online Shopping", lifespan=lifespan)

# Every route lives under /api
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Bazaarline API is running"}


for module in (auth, catalog, cart, orders, admin, export):
    api_router.include_router(module.router)

cors_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",") if o.strip()]
if cors_origins == ["*"] or "*" in cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_credentials=True,
        allow_origin_regex=r"^https?://.*",
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_credentials=True,
        allow_origins=cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Include the router in the main app
app.include_router(api_router)

# Mount local static assets (hero + product images)
assets_dir = ROOT_DIR.parent / "frontend" / "public" / "assets"
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
