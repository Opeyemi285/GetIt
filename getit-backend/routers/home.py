from fastapi import APIRouter, HTTPException, Depends, Query
from database import supabase
from routers.auth import get_current_user_id  # reuse your existing auth dependency

router = APIRouter(prefix="/home", tags=["Home"])

VALID_CATEGORIES = ["Grocery", "Pharmacy", "Restaurant", "Toiletries", "Electronics"]


@router.get("/{category}")
def get_home_data(
    category: str,
    user_id: str = Depends(get_current_user_id),
):
    """
    Returns featured stores, popular items, and recommended products
    for a given category. All image_url fields are Cloudinary URLs
    stored directly in Supabase — no extra work needed.
    """
    if category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Must be one of: {', '.join(VALID_CATEGORIES)}"
        )

    # --- Featured Stores ---
    stores_result = supabase.table("stores") \
        .select("id, name, image_url") \
        .eq("category", category) \
        .execute()

    stores = stores_result.data or []

    # --- Popular Items (non-recommended, limit 6) ---
    popular_result = supabase.table("products") \
        .select("id, name, price, image_url") \
        .eq("category", category) \
        .eq("is_recommended", False) \
        .limit(6) \
        .execute()

    popular_items = popular_result.data or []

    # --- Recommended for You ---
    recommended_result = supabase.table("products") \
        .select("id, name, price, image_url, stores(name)") \
        .eq("category", category) \
        .eq("is_recommended", True) \
        .limit(8) \
        .execute()

    # Flatten the joined store name
    recommended = []
    for item in (recommended_result.data or []):
        store_name = ""
        if item.get("stores") and isinstance(item["stores"], dict):
            store_name = item["stores"].get("name", "")
        recommended.append({
            "id": item["id"],
            "name": item["name"],
            "price": item["price"],
            "image_url": item.get("image_url"),
            "store": store_name,
        })

    return {
        "category": category,
        "stores": stores,
        "popular_items": popular_items,
        "recommended": recommended,
    }


@router.get("/search/products")
def search_products(
    q: str = Query(..., min_length=1, description="Search term"),
    user_id: str = Depends(get_current_user_id),
):
    """
    Full-text search across products and stores.
    Returns matched products with store name, and matched stores.
    """
    term = f"%{q.strip()}%"

    # Search products by name
    products_result = supabase.table("products") \
        .select("id, name, price, image_url, category, stores(name)") \
        .ilike("name", term) \
        .limit(20) \
        .execute()

    products = []
    for item in (products_result.data or []):
        store_name = ""
        if item.get("stores") and isinstance(item["stores"], dict):
            store_name = item["stores"].get("name", "")
        products.append({
            "id": item["id"],
            "name": item["name"],
            "price": item["price"],
            "image_url": item.get("image_url"),
            "category": item["category"],
            "store": store_name,
        })

    # Search stores by name
    stores_result = supabase.table("stores") \
        .select("id, name, category, image_url") \
        .ilike("name", term) \
        .limit(10) \
        .execute()

    return {
        "products": products,
        "stores": stores_result.data or [],
    }