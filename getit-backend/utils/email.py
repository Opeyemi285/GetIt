import resend
from dotenv import load_dotenv
import os

load_dotenv()
resend.api_key = os.getenv("RESEND_API_KEY")

def send_verification_email(to_email: str, otp: str, first_name: str):
    resend.Emails.send({
        "from": "onboarding@resend.dev",  # Replace with your verified Resend domain
        "to": to_email,
        "subject": "Your verification code",
        "html": f"""
            <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px;">
                <h2>Hi {first_name}</h2>
                <p>Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
                <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; margin: 24px 0; color: #1a1a1a;">
                    {otp}
                </div>
                <p style="color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
        """
    })