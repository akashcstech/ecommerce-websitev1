"""Password hashing + httpOnly cookie sessions (JWT) + FastAPI auth dependencies."""

import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Cookie, Depends, HTTPException, Response

from lib.db import db  # also loads backend/.env

JWT_SECRET = os.environ["JWT_SECRET"]
COOKIE_NAME = "session"
SESSION_DAYS = 7


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except ValueError:
        return False


def set_session(response: Response, user_id: str) -> None:
    exp = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)
    token = jwt.encode({"sub": user_id, "exp": exp}, JWT_SECRET, algorithm="HS256")
    response.set_cookie(
        COOKIE_NAME, token, httponly=True, samesite="lax", max_age=SESSION_DAYS * 86400, path="/"
    )


def clear_session(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/")


async def current_user(session: str | None = Cookie(default=None)) -> dict:
    if not session:
        raise HTTPException(status_code=401, detail="Please log in")
    try:
        payload = jwt.decode(session, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Session expired, please log in again")
    user = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Account not found")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Your account has been deactivated")
    return user


async def current_customer(user: dict = Depends(current_user)) -> dict:
    if user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admins cannot shop with the admin account")
    return user


async def current_admin(user: dict = Depends(current_user)) -> dict:
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access only")
    return user
