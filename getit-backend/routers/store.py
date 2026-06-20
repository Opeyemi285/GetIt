from fastapi import APIRouter, HTTPException, Depends
from database import supabase
from routers.auth import get_current_user_id

router = APIRouter(prefix="/store", tags=["Store"])

@router.get("/{store_id}/products")
def get_store_products(
    store_id: str,
    user_id: str = Depends(get_current_user_id),
):
    # Fetch products for the given store_id
    products_result = supabase.table("products") \
        .select("id, name, price, category, image_url, is_recommended") \
        .eq("store_id", store_id) \
        .execute()
        
    products = products_result.data or []
    
    # Format the data to match the frontend StoreProduct type as close as possible
    formatted_products = []
    for p in products:
        formatted_products.append({
            "id": p["id"],
            "name": p["name"],
            "price": p["price"],
            "image_url": p.get("image_url") or "",
            "category": p.get("category") or "",
            "unit": "1 pc", # default since it's not in DB
            "tag": "New" if p.get("is_recommended") else None
        })
        
    return formatted_products
