from fastapi import APIRouter, HTTPException, Depends
from database import supabase
from routers.auth import get_current_user_id
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/orders", tags=["Orders"])

class OrderItemIn(BaseModel):
    product_id: str
    name: str
    qty: int
    unit: Optional[str] = None
    price: float
    image_url: Optional[str] = None

class OrderCreate(BaseModel):
    store_id: str
    items: List[OrderItemIn]
    delivery_address: Optional[str] = None
    delivery_notes: Optional[str] = None
    payment_method: Optional[str] = None


@router.post("")
def create_order(
    order: OrderCreate,
    user_id: str = Depends(get_current_user_id),
):
    if not order.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    total = sum(item.price * item.qty for item in order.items)

    order_result = supabase.table("orders").insert({
        "user_id": user_id,
        "store_id": order.store_id,
        "status": "In Progress",
        "total": total,
    }).execute()

    new_order = order_result.data[0]
    order_id = new_order["id"]

    items_payload = [
        {
            "order_id": order_id,
            "product_id": item.product_id,
            "name": item.name,
            "qty": item.qty,
            "unit": item.unit,
            "price": item.price,
            "image_url": item.image_url,
        }
        for item in order.items
    ]
    supabase.table("order_items").insert(items_payload).execute()

    return {"id": order_id, "status": "In Progress", "total": total}


@router.get("")
def get_orders(user_id: str = Depends(get_current_user_id)):
    orders_result = supabase.table("orders") \
        .select("id, status, total, created_at, stores(name, image_url), order_items(*)") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .execute()

    orders = []
    for o in (orders_result.data or []):
        store = o.get("stores") or {}
        orders.append({
            "id": o["id"],
            "storeName": store.get("name", ""),
            "storeLogo": store.get("image_url", ""),
            "date": o["created_at"],
            "status": o["status"],
            "total": o["total"],
            "items": [
                {
                    "id": item["id"],
                    "name": item["name"],
                    "qty": item["qty"],
                    "unit": item.get("unit", ""),
                    "price": item["price"],
                    "image": item.get("image_url", ""),
                }
                for item in o.get("order_items", [])
            ],
        })

    return orders