from fastapi import APIRouter, Depends
from database import supabase
from routers.auth import get_current_user_id
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/messages", tags=["Messages"])


class SendMessageIn(BaseModel):
    text: str


class MarkReadIn(BaseModel):
    conversation_id: str


# ─── Get all conversations for the current user ───────────────────────────────

@router.get("")
def get_conversations(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("conversations") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("updated_at", desc=True) \
        .execute()

    conversations = []
    for row in (result.data or []):
        conversations.append({
            "id": row["id"],
            "senderName": row["sender_name"],
            "senderPhoto": row.get("sender_photo") or "",
            "lastMessage": row.get("last_message") or "",
            "time": row.get("time") or "",
            "unread": row.get("unread") or 0,
            "isRunner": row.get("is_runner") or False,
        })

    return conversations


# ─── Get messages inside a conversation thread ────────────────────────────────

@router.get("/{conversation_id}")
def get_thread(conversation_id: str, user_id: str = Depends(get_current_user_id)):
    # Verify the conversation belongs to this user
    conv = supabase.table("conversations") \
        .select("id") \
        .eq("id", conversation_id) \
        .eq("user_id", user_id) \
        .execute()

    if not conv.data:
        return []

    result = supabase.table("messages") \
        .select("*") \
        .eq("conversation_id", conversation_id) \
        .order("created_at", asc=True) \
        .execute()

    messages = []
    for row in (result.data or []):
        messages.append({
            "id": row["id"],
            "text": row["text"],
            "fromMe": row["from_me"],
            "time": row.get("time") or "",
        })

    return messages


# ─── Send a message in a thread ───────────────────────────────────────────────

@router.post("/{conversation_id}")
def send_message(
    conversation_id: str,
    body: SendMessageIn,
    user_id: str = Depends(get_current_user_id),
):
    # Verify the conversation belongs to this user
    conv = supabase.table("conversations") \
        .select("id") \
        .eq("id", conversation_id) \
        .eq("user_id", user_id) \
        .execute()

    if not conv.data:
        return {"error": "Conversation not found"}

    now = datetime.now().strftime("%-I:%M %p")

    # Insert the message
    result = supabase.table("messages").insert({
        "conversation_id": conversation_id,
        "text": body.text,
        "from_me": True,
        "time": now,
    }).execute()

    # Update conversation's last_message and timestamp
    supabase.table("conversations").update({
        "last_message": body.text,
        "time": now,
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("id", conversation_id).execute()

    row = result.data[0]
    return {
        "id": row["id"],
        "text": row["text"],
        "fromMe": row["from_me"],
        "time": row["time"],
    }


# ─── Mark a conversation as read (clear unread count) ────────────────────────

@router.patch("/{conversation_id}/read")
def mark_read(conversation_id: str, user_id: str = Depends(get_current_user_id)):
    supabase.table("conversations") \
        .update({"unread": 0}) \
        .eq("id", conversation_id) \
        .eq("user_id", user_id) \
        .execute()

    return {"ok": True}