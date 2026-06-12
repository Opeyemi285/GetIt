from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
import os, random, string

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password[:72])

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain[:72], hashed)

def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(days=7)
    return jwt.encode(payload, os.getenv("JWT_SECRET"), algorithm="HS256")

def generate_otp(length=6) -> str:
    return ''.join(random.choices(string.digits, k=length))