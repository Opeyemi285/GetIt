from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from database import supabase
from utils.security import hash_password, verify_password, create_access_token, generate_otp
from utils.email import send_verification_email
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/auth", tags=["Auth"])


class RegisterStartRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr

@router.post("/register/start")
def register_start(data: RegisterStartRequest):
    existing = supabase.table("users").select("id").eq("email", data.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    otp = generate_otp()
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()

    supabase.table("email_verifications").upsert({
        "email": data.email,
        "code": otp,
        "expires_at": expires_at,
        "used": False
    }, on_conflict="email").execute()

    send_verification_email(data.email, otp, data.first_name)
    return {"message": "Verification code sent"}


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    code: str

@router.post("/register/verify")
def verify_otp(data: VerifyOTPRequest):
    result = supabase.table("email_verifications") \
        .select("*").eq("email", data.email).eq("used", False).execute()

    if not result.data:
        raise HTTPException(status_code=400, detail="No pending verification found")

    record = result.data[0]

    if record["code"] != data.code:
        raise HTTPException(status_code=400, detail="Invalid code")

    if datetime.now(timezone.utc) > datetime.fromisoformat(record["expires_at"]):
        raise HTTPException(status_code=400, detail="Code has expired")

    supabase.table("email_verifications").update({"used": True}).eq("id", record["id"]).execute()
    return {"message": "Email verified successfully"}


class RegisterCompleteRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str

@router.post("/register/complete")
def register_complete(data: RegisterCompleteRequest):
    if len(data.password) > 72:
        raise HTTPException(status_code=400, detail="Password cannot be longer than 72 characters.")

    verified = supabase.table("email_verifications") \
        .select("*").eq("email", data.email).eq("used", True).execute()

    if not verified.data:
        raise HTTPException(status_code=400, detail="Email not verified")

    password_hash = hash_password(data.password)

    user = supabase.table("users").insert({
        "first_name": data.first_name,
        "last_name": data.last_name,
        "email": data.email,
        "password_hash": password_hash,
        "is_verified": True
    }).execute()

    token = create_access_token({
        "user_id": user.data[0]["id"],
        "email": data.email
    })
    return {"access_token": token, "token_type": "bearer"}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/login")
def login(data: LoginRequest):
    result = supabase.table("users").select("*").eq("email", data.email).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="No account found with this email address.")

    user = result.data[0]

    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")

    token = create_access_token({
        "user_id": user["id"],
        "email": user["email"]
    })
    return {"access_token": token, "token_type": "bearer"}