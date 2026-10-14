"""Customer + admin authentication and profile routes (/api/auth/*)."""

from fastapi import APIRouter, Depends, HTTPException, Response

from lib.auth import clear_session, current_user, hash_password, set_session, verify_password
from lib.db import db
from models.shop import (
    LoginIn,
    PasswordChange,
    ProfileUpdate,
    RegisterIn,
    UserPublic,
    new_id,
    now_iso,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def to_public(user: dict) -> UserPublic:
    return UserPublic(**{k: v for k, v in user.items() if k != "password_hash"})


@router.post("/register", response_model=UserPublic)
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    user = {
        "id": new_id(),
        "name": body.name.strip(),
        "email": email,
        "phone": body.phone.strip(),
        "address": "",
        "password_hash": hash_password(body.password),
        "is_admin": False,
        "is_active": True,
        "created_at": now_iso(),
    }
    await db.users.insert_one(dict(user))
    set_session(response, user["id"])
    return to_public(user)


async def _login(body: LoginIn, response: Response, admin: bool) -> UserPublic:
    user = await db.users.find_one({"email": body.email.lower()}, {"_id": 0})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Your account has been deactivated")
    if admin and not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="This account is not an administrator")
    if not admin and user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Administrators must use the admin login")
    set_session(response, user["id"])
    return to_public(user)


@router.post("/login", response_model=UserPublic)
async def login(body: LoginIn, response: Response):
    return await _login(body, response, admin=False)


@router.post("/admin/login", response_model=UserPublic)
async def admin_login(body: LoginIn, response: Response):
    return await _login(body, response, admin=True)


@router.post("/logout")
async def logout(response: Response):
    clear_session(response)
    return {"ok": True}


@router.get("/me", response_model=UserPublic)
async def me(user: dict = Depends(current_user)):
    return to_public(user)


@router.put("/profile", response_model=UserPublic)
async def update_profile(body: ProfileUpdate, user: dict = Depends(current_user)):
    update = {"name": body.name.strip(), "phone": body.phone.strip(), "address": body.address.strip()}
    await db.users.update_one({"id": user["id"]}, {"$set": update})
    return to_public({**user, **update})


@router.post("/password")
async def change_password(body: PasswordChange, user: dict = Depends(current_user)):
    if not verify_password(body.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await db.users.update_one(
        {"id": user["id"]}, {"$set": {"password_hash": hash_password(body.new_password)}}
    )
    return {"ok": True}
