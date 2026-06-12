import sys
from database import supabase

# Mock data definition
mock_stores = [
    {
        "name": "FreshMart Organic",
        "category": "Grocery",
        "image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Organic Honey (500g)", "price": 3500.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80"},
            {"name": "Fresh Strawberries (500g)", "price": 2500.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&auto=format&fit=crop&q=80"},
            {"name": "Whole Grain Bread", "price": 1200.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80"},
            {"name": "Greek Yogurt Plain", "price": 1800.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80"},
        ]
    },
    {
        "name": "MegaCare Pharmacy",
        "category": "Pharmacy",
        "image_url": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Multivitamin Gummies", "price": 4500.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80"},
            {"name": "Vitamin C 1000mg", "price": 2200.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1616679911721-eff6eec18fcd?w=600&auto=format&fit=crop&q=80"},
            {"name": "Premium First Aid Kit", "price": 9500.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&auto=format&fit=crop&q=80"},
            {"name": "Instant Hand Sanitizer", "price": 800.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80"},
        ]
    },
    {
        "name": "The Gourmet Bistro",
        "category": "Restaurant",
        "image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Grilled Chicken Salad", "price": 5000.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80"},
            {"name": "Cheese Burger & Fries", "price": 4200.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80"},
            {"name": "Pasta Carbonara", "price": 5800.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=600&auto=format&fit=crop&q=80"},
            {"name": "Margherita Pizza", "price": 4800.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&auto=format&fit=crop&q=80"},
        ]
    },
    {
        "name": "Scented Oasis",
        "category": "Toiletries",
        "image_url": "https://images.unsplash.com/photo-1608248597481-496100c8c836?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Lavender Body Wash", "price": 3200.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80"},
            {"name": "Charcoal Face Scrub", "price": 2900.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&auto=format&fit=crop&q=80"},
            {"name": "Sandalwood Shampoo", "price": 3600.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80"},
            {"name": "Moisturizing Aloe Lotion", "price": 2700.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80"},
        ]
    },
    {
        "name": "TechZone Electronics",
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Wireless Earbuds Pro", "price": 15000.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80"},
            {"name": "Powerbank 20000mAh", "price": 8500.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1609592424109-dd57d605c108?w=600&auto=format&fit=crop&q=80"},
            {"name": "Bluetooth Speaker Lite", "price": 12000.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80"},
            {"name": "USB-C Fast Charger", "price": 3500.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80"},
        ]
    }
]

def seed():
    print("Clearing existing products and stores...")
    # Delete dependent products first due to foreign key cascade, then stores
    supabase.table("products").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    supabase.table("stores").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    
    print("Seeding stores and products...")
    for s in mock_stores:
        # Insert store
        store_res = supabase.table("stores").insert({
            "name": s["name"],
            "category": s["category"],
            "image_url": s["image_url"]
        }).execute()
        
        if not store_res.data:
            print(f"Failed to insert store: {s['name']}")
            continue
            
        store_id = store_res.data[0]["id"]
        print(f"Inserted store '{s['name']}' with ID: {store_id}")
        
        # Insert products for this store
        products_to_insert = []
        for p in s["products"]:
            products_to_insert.append({
                "store_id": store_id,
                "name": p["name"],
                "price": p["price"],
                "category": s["category"],
                "image_url": p["image_url"],
                "is_recommended": p["is_recommended"]
            })
            
        prod_res = supabase.table("products").insert(products_to_insert).execute()
        print(f"Inserted {len(prod_res.data)} products for '{s['name']}'")
        
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed()
