from fastapi import APIRouter, HTTPException, Depends
from database import supabase
from routers.auth import get_current_user_id
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/cart", tags=["Cart"])


class CartItemIn(BaseModel):
    product_id: str
    store_id: str
    quantity: int = 1
    selected_size: Optional[str] = None
    selected_color: Optional[str] = None


class CartQuantityUpdate(BaseModel):
    quantity: int


@router.get("")
def get_cart(user_id: str = Depends(get_current_user_id)):
    result = supabase.table("cart_items") \
        .select("id, quantity, selected_size, selected_color, products(id, name, price, image_url, category, store_id)") \
        .eq("user_id", user_id) \
        .execute()

    items = []
    for row in (result.data or []):
        product = row.get("products") or {}
        items.append({
            "cart_item_id": row["id"],
            "quantity": row["quantity"],
            "selected_size": row.get("selected_size"),
            "selected_color": row.get("selected_color"),
            "product": {
                "id": product.get("id"),
                "title": product.get("name"),
                "price": product.get("price"),
                "image": product.get("image_url"),
                "category": product.get("category"),
                "store_id": product.get("store_id"),
            },
        })
    return items


@router.post("")
def add_to_cart(item: CartItemIn, user_id: str = Depends(get_current_user_id)):
    query = supabase.table("cart_items") \
        .select("id, quantity") \
        .eq("user_id", user_id) \
        .eq("product_id", item.product_id)

    if item.selected_size is None:
        query = query.is_("selected_size", "null")
    else:
        query = query.eq("selected_size", item.selected_size)

    if item.selected_color is None:
        query = query.is_("selected_color", "null")
    else:
        query = query.eq("selected_color", item.selected_color)

    existing = query.execute()

    if existing.data:
        row = existing.data[0]
        new_qty = row["quantity"] + item.quantity
        supabase.table("cart_items").update({"quantity": new_qty}).eq("id", row["id"]).execute()
        return {"id": row["id"], "quantity": new_qty}

    result = supabase.table("cart_items").insert({
        "user_id": user_id,
        "product_id": item.product_id,
        "store_id": item.store_id,
        "quantity": item.quantity,
        "selected_size": item.selected_size,
        "selected_color": item.selected_color,
    }).execute()
    return result.data[0]

@router.patch("/{cart_item_id}")
def update_cart_item(cart_item_id: str, body: CartQuantityUpdate, user_id: str = Depends(get_current_user_id)):
    if body.quantity <= 0:
        supabase.table("cart_items").delete().eq("id", cart_item_id).eq("user_id", user_id).execute()
        return {"deleted": True}

    result = supabase.table("cart_items") \
        .update({"quantity": body.quantity}) \
        .eq("id", cart_item_id) \
        .eq("user_id", user_id) \
        .execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return result.data[0]


@router.delete("/{cart_item_id}")
def remove_cart_item(cart_item_id: str, user_id: str = Depends(get_current_user_id)):
    supabase.table("cart_items").delete().eq("id", cart_item_id).eq("user_id", user_id).execute()
    return {"deleted": True}


@router.delete("")
def clear_cart(user_id: str = Depends(get_current_user_id)):
    supabase.table("cart_items").delete().eq("user_id", user_id).execute()
    return {"cleared": True}