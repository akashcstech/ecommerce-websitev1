"""Idempotent seed: admin + demo customer, 5 categories, 24 products with local assets. Run: cd backend && python seed.py"""

import asyncio

from lib.auth import hash_password
from lib.db import db, ensure_indexes
from models.shop import new_id, now_iso

ASSETS_BASE = "/assets/images/products"

CATEGORIES = ["Audio & Tech", "Footwear", "Apparel", "Accessories", "Home & Living"]

PRODUCTS = [
    # name, category, price, stock, image_file, description, mrp, offer_label
    ("Aura Studio ANC Wireless Headphones", "Audio & Tech", 14999, 25, "aura-studio-anc-wireless-headphones.jpg", "High-fidelity spatial audio with active noise cancellation, 40-hour battery and memory-foam earcups.", 19999, "33% OFF"),
    ("Nordic Soundcraft Reference Over-Ear", "Audio & Tech", 18499, 12, "nordic-soundcraft-reference-over-ear.jpg", "Studio reference headphones in matte titanium and premium leather for balanced, honest sound.", 22999, "SALE"),
    ("Pulse Air Wireless Earbuds", "Audio & Tech", 6999, 40, "pulse-air-wireless-earbuds.jpg", "Low-latency earbuds with dual drivers and a magnetic wireless charging case.", 9499, "26% OFF"),
    ("Chrono Fit Smartwatch", "Audio & Tech", 11999, 18, "chrono-fit-smartwatch.jpg", "AMOLED fitness smartwatch with heart-rate, SpO2, GPS and 7-day battery life.", 14999, "20% OFF"),
    ("Chrono Fit Smartwatch Lite", "Audio & Tech", 7999, 0, "chrono-fit-smartwatch-lite.jpg", "Lightweight everyday smartwatch with step tracking, sleep insights and notifications.", 9999, "SALE"),
    ("Midnight Pro Watch Series", "Audio & Tech", 32999, 6, "midnight-pro-watch-series.jpg", "Premium aluminium smartwatch with ECG, always-on display and cellular support.", 39999, "LIMITED"),
    ("Monolith Retro Low-Top Sneakers", "Footwear", 7499, 30, "monolith-retro-low-top-sneakers.jpg", "Minimalist leather sneakers with cushioned crepe sole and tonal stitching.", 9999, "25% OFF"),
    ("Aero Minimalist Street Runner", "Footwear", 8999, 22, "aero-minimalist-street-runner.jpg", "Breathable knit upper with a shock-absorbing composite midsole for all-day comfort.", 10999, "18% OFF"),
    ("Urban Noir High-Top", "Footwear", 9499, 3, "urban-noir-high-top.jpg", "Sleek noir silhouette with reinforced ankle support and weather-resistant canvas.", 12999, "SALE"),
    ("Weekend Canvas Classics", "Footwear", 3499, 0, "weekend-canvas-classics.jpg", "Timeless canvas shoes with vulcanised rubber soles. Restocking soon.", 4999, "30% OFF"),
    ("Everyday Cotton Polo", "Apparel", 1499, 60, "everyday-cotton-polo.jpg", "Breathable 100% combed-cotton polo with a relaxed, structured collar.", 1999, "25% OFF"),
    ("Advanz Graphic Tee Pack", "Apparel", 1999, 45, "advanz-graphic-tee-pack.jpg", "Two-pack of heavyweight graphic tees in black and white, pre-shrunk cotton.", 2799, "29% OFF"),
    ("Studio Essentials Tee", "Apparel", 999, 80, "studio-essentials-tee.jpg", "Soft, mid-weight crew-neck tee in a modern regular fit. Your daily staple.", 1499, "SALE"),
    ("Merino Knit Beanie", "Apparel", 899, 35, "merino-knit-beanie.jpg", "Fine merino-blend beanie that keeps you warm without the itch.", 1299, "31% OFF"),
    ("Classic Wayfarer Sunglasses", "Accessories", 4999, 20, "classic-wayfarer-sunglasses.jpg", "UV400 polarised lenses in a hand-polished acetate wayfarer frame with case.", 6499, "23% OFF"),
    ("Heritage Leather Bifold Wallet", "Accessories", 2499, 28, "heritage-leather-bifold-wallet.jpg", "Full-grain leather bifold with 6 card slots and RFID-blocking lining.", 3499, "29% OFF"),
    ("Quilted Crossbody Bag", "Accessories", 5999, 9, "quilted-crossbody-bag.jpg", "Quilted vegan-leather crossbody with gold hardware and adjustable chain strap.", 7999, "25% OFF"),
    ("Round Tortoise Reading Glasses", "Accessories", 1799, 50, "round-tortoise-reading-glasses.jpg", "Featherlight round frames with anti-glare, blue-light filtering lenses.", 2499, "SALE"),
    ("Everyday Carry Kit", "Accessories", 3999, 15, "everyday-carry-kit.jpg", "Curated everyday carry: card holder, pen, notebook and cable organiser.", 5499, "27% OFF"),
    ("Teacup Pendant Lamp", "Home & Living", 3299, 14, "teacup-pendant-lamp.jpg", "Playful enamel teacup pendant lamp in mint green, E27 bulb holder included.", 4499, "27% OFF"),
    ("Stoneware Morning Mug", "Home & Living", 599, 120, "stoneware-morning-mug.jpg", "Hand-glazed 350 ml stoneware mug, microwave and dishwasher safe.", 899, "33% OFF"),
    ("Amber Glass Table Lamp", "Home & Living", 4499, 7, "amber-glass-table-lamp.jpg", "Vintage-inspired amber glass base with a warm linen shade.", 5999, "25% OFF"),
    ("Feather Print Ceramic Mug", "Home & Living", 699, 90, "feather-print-ceramic-mug.jpg", "Gold-feather print ceramic mug — a cosy companion for slow evenings.", 999, "SALE"),
    ("Potted Succulent Duo", "Home & Living", 849, 0, "potted-succulent-duo.jpg", "Low-maintenance succulent in a hand-thrown terracotta pot.", 1199, "29% OFF"),
]


async def seed() -> None:
    await ensure_indexes()
    users = [
        ("Store Admin", "admin@store.com", "9000000001", "admin123", True, "Bazaarline HQ, MG Road, Bengaluru 560001"),
        ("Priya Sharma", "customer@store.com", "9876543210", "customer123", False, "12 Lake View Apartments, Indiranagar, Bengaluru 560038"),
    ]
    for name, email, phone, pw, is_admin, address in users:
        if not await db.users.find_one({"email": email}):
            await db.users.insert_one(
                {
                    "id": new_id(),
                    "name": name,
                    "email": email,
                    "phone": phone,
                    "address": address,
                    "password_hash": hash_password(pw),
                    "is_admin": is_admin,
                    "is_active": True,
                    "created_at": now_iso(),
                }
            )
        else:  # keep demo credentials working
            await db.users.update_one(
                {"email": email},
                {"$set": {"password_hash": hash_password(pw), "is_admin": is_admin, "is_active": True}},
            )

    cat_ids: dict[str, str] = {}
    for name in CATEGORIES:
        doc = await db.categories.find_one({"name": name})
        if not doc:
            doc = {"id": new_id(), "name": name}
            await db.categories.insert_one(dict(doc))
        cat_ids[name] = doc["id"]

    for name, cat, price, stock, img_file, desc, mrp, offer_label in PRODUCTS:
        image_url = f"{ASSETS_BASE}/{img_file}"
        existing = await db.products.find_one({"name": name})
        if existing:
            # Always update mrp, offer_label, and fix image_url
            update_fields: dict = {"mrp": float(mrp), "offer_label": offer_label}
            if existing.get("image_url", "").startswith("https://images.unsplash.com") or existing.get("image_url") != image_url:
                update_fields["image_url"] = image_url
            await db.products.update_one({"_id": existing["_id"]}, {"$set": update_fields})
            continue
        await db.products.insert_one(
            {
                "id": new_id(),
                "category_id": cat_ids[cat],
                "name": name,
                "description": desc,
                "price": float(price),
                "mrp": float(mrp),
                "offer_label": offer_label,
                "stock": stock,
                "image_url": image_url,
                "created_at": now_iso(),
            }
        )
    print(f"Seeded: {await db.users.count_documents({})} users, {await db.categories.count_documents({})} categories, {await db.products.count_documents({})} products")


if __name__ == "__main__":
    asyncio.run(seed())
