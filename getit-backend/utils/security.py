import bcrypt
from jose import jwt
from datetime import datetime, timedelta, timezone
import os, random, string

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(days=7)
    return jwt.encode(payload, os.getenv("JWT_SECRET"), algorithm="HS256")

def generate_otp(length=6) -> str:
    return ''.join(random.choices(string.digits, k=length))