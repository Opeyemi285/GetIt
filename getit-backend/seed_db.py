import sys
from database import supabase

# Comprehensive Nigerian market mock stores and products matching user screenshots
mock_stores = [
    # ─── GROCERY STORES (8 stores) ───
    {
        "name": "SPAR",
        "category": "Grocery",
        "image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "CeraVe Face Wash (24ml)", "price": 8000.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&auto=format&fit=crop&q=80"},
            {"name": "Nivea Body Lotion (454g)", "price": 5700.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1608248597481-496100c8c836?w=600&auto=format&fit=crop&q=80"},
            {"name": "Plum Serum (30ml)", "price": 9000.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80"},
            {"name": "Original Honey (50ml)", "price": 3500.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80"},
            {"name": "Basmati Rice (5kg)", "price": 12000.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80"},
            {"name": "Ofada Rice (Local)", "price": 15000.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1516685018646-549198525c1b?w=600&auto=format&fit=crop&q=80"},
            {"name": "Indomie Instant Noodles (Carton)", "price": 8500.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1612966608967-dfdec40745dd?w=600&auto=format&fit=crop&q=80"},
            {"name": "Peak Milk Powder (400g)", "price": 3800.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80"},
            {"name": "Lipton Yellow Label (100 bags)", "price": 2200.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80"},
            {"name": "Kings Vegetable Oil (1L)", "price": 4500.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80"}
        ]
    },
    {
        "name": "Justrite Superstore",
        "category": "Grocery",
        "image_url": "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Full Cream Milk (1L)", "price": 3500.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80"},
            {"name": "Sliced White Bread", "price": 1200.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80"},
            {"name": "Farm Fresh Eggs (Crate)", "price": 2800.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=600&auto=format&fit=crop&q=80"},
            {"name": "Corned Beef (Exeter)", "price": 2200.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=600&auto=format&fit=crop&q=80"},
            {"name": "Golden Penny Sugar (1kg)", "price": 1800.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1527018601619-a508a2be00cd?w=600&auto=format&fit=crop&q=80"},
            {"name": "Saint Mamet Peaches", "price": 3600.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&auto=format&fit=crop&q=80"},
            {"name": "Pringles Sour Cream (165g)", "price": 3200.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=600&auto=format&fit=crop&q=80"}
        ]
    },
    {
        "name": "Prince Ebeano",
        "category": "Grocery",
        "image_url": "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Golden Morn Cereal", "price": 2400.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1521485950395-bcfb5fc5d291?w=600&auto=format&fit=crop&q=80"},
            {"name": "Milo Chocolate Drink", "price": 4200.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=600&auto=format&fit=crop&q=80"},
            {"name": "Spaghetti (Golden Penny)", "price": 950.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=600&auto=format&fit=crop&q=80"}
        ]
    },
    {
        "name": "Hubmart Stores",
        "category": "Grocery",
        "image_url": "https://images.unsplash.com/photo-1583258292688-d0213df4a3a8?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Premium Basmati Rice", "price": 13500.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80"},
            {"name": "Sunflower Cooking Oil", "price": 9500.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80"}
        ]
    },
    {
        "name": "Mega Plaza Supermarket",
        "category": "Grocery",
        "image_url": "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Corned Beef Premium", "price": 2500.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=600&auto=format&fit=crop&q=80"},
            {"name": "Millet Cereal Pack", "price": 1800.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=600&auto=format&fit=crop&q=80"}
        ]
    },
    {
        "name": "SuperMart.ng",
        "category": "Grocery",
        "image_url": "https://images.unsplash.com/photo-1543168256-418811576931?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Irish Potatoes (1kg)", "price": 2300.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80"},
            {"name": "Red Onions (1kg)", "price": 1500.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1508747703725-719ae257c26a?w=600&auto=format&fit=crop&q=80"}
        ]
    },
    {
        "name": "Addide Supermarket",
        "category": "Grocery",
        "image_url": "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Noodles (Indomie Giant)", "price": 400.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1612966608967-dfdec40745dd?w=600&auto=format&fit=crop&q=80"}
        ]
    },
    {
        "name": "Daytona Supermarket",
        "category": "Grocery",
        "image_url": "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Canned Sardines", "price": 900.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80"}
        ]
    },

    # ─── PHARMACIES (5 stores) ───
    {
        "name": "Medplus",
        "category": "Pharmacy",
        "image_url": "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Emzor Paracetamol (Card)", "price": 600.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80"},
            {"name": "Vervain Dried Leaf (Tea)", "price": 14000.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80"},
            {"name": "Wolfs Baine Extract", "price": 12500.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1616679911721-eff6eec18fcd?w=600&auto=format&fit=crop&q=80"},
            {"name": "Vitamin C Drops", "price": 3200.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80"},
            {"name": "Gaviscon Double Action (150ml)", "price": 5500.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80"},
            {"name": "Amartem Soft Gel", "price": 3800.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80"},
            {"name": "Strepsils Honey & Lemon", "price": 1800.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1616679911721-eff6eec18fcd?w=600&auto=format&fit=crop&q=80"}
        ]
    },
    {
        "name": "HealthPlus",
        "category": "Pharmacy",
        "image_url": "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Blood Pressure Monitor", "price": 18500.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&auto=format&fit=crop&q=80"},
            {"name": "Multivitamin Complex", "price": 6500.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80"},
            {"name": "Hand Sanitizer (1L)", "price": 2800.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80"}
        ]
    },
    {
        "name": "L’Avante Pharmacy",
        "category": "Pharmacy",
        "image_url": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Vervain Root Extract", "price": 13500.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80"},
            {"name": "Daily Cod Liver Oil", "price": 4500.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1616679911721-eff6eec18fcd?w=600&auto=format&fit=crop&q=80"}
        ]
    },
    {
        "name": "Health Depot",
        "category": "Pharmacy",
        "image_url": "https://images.unsplash.com/photo-1607619275048-24722480f875?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "First Aid Bandages", "price": 1200.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&auto=format&fit=crop&q=80"}
        ]
    },
    {
        "name": "Good Health Pharmacy",
        "category": "Pharmacy",
        "image_url": "https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Pediatric Cough Syrup", "price": 2100.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80"}
        ]
    },

    # ─── RESTAURANTS (5 stores) ───
    {
        "name": "Bukka Hut",
        "category": "Restaurant",
        "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Jollof Rice & Beef", "price": 4500.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&auto=format&fit=crop&q=80"},
            {"name": "Pounded Yam & Egusi", "price": 5500.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80"},
            {"name": "Amala & Abula Special", "price": 4000.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80"},
            {"name": "White Rice & Stew", "price": 2800.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&auto=format&fit=crop&q=80"},
            {"name": "Plantain Portion (Dodo)", "price": 1200.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80"}
        ]
    },
    {
        "name": "The Place Restaurant",
        "category": "Restaurant",
        "image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Fried Rice & Turkey", "price": 5200.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80"},
            {"name": "Beef Shawarma Roll", "price": 3500.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80"}
        ]
    },
    {
        "name": "Chicken Republic",
        "category": "Restaurant",
        "image_url": "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Refuel Meal Combo", "price": 3200.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600&auto=format&fit=crop&q=80"},
            {"name": "Crunchy Chicken Wings", "price": 2500.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600&auto=format&fit=crop&q=80"}
        ]
    },
    {
        "name": "Sweet Sensation",
        "category": "Restaurant",
        "image_url": "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Beef Meat Pie", "price": 1200.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&auto=format&fit=crop&q=80"}
        ]
    },
    {
        "name": "Yellow Chilli",
        "category": "Restaurant",
        "image_url": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Peppered Gizzard Snack", "price": 3000.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80"}
        ]
    },

    # ─── ELECTRONICS (4 stores) ───
    {
        "name": "Slot Systems",
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Android Smartphone Neo", "price": 180000.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80"},
            {"name": "Wireless Charging Pad", "price": 12000.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1609592424109-dd57d605c108?w=600&auto=format&fit=crop&q=80"},
            {"name": "Noise Cancelling Headset", "price": 45000.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80"},
            {"name": "Powerbank 20000mAh Pro", "price": 14500.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1609592424109-dd57d605c108?w=600&auto=format&fit=crop&q=80"},
            {"name": "SanDisk 64GB MicroSD", "price": 4800.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80"},
            {"name": "Bluetooth Neckband Pro", "price": 9500.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80"}
        ]
    },
    {
        "name": "Micro Station",
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1558885561-56c2a4e2f3bc?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Smart Fitness Band", "price": 28000.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"},
            {"name": "USB-C Fast Charger Hub", "price": 8500.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80"}
        ]
    },
    {
        "name": "Pointek",
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1468436139062-f60a71c5c892?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Bluetooth Smart Speaker", "price": 35000.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80"},
            {"name": "Powerbank 30000mAh", "price": 15000.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1609592424109-dd57d605c108?w=600&auto=format&fit=crop&q=80"}
        ]
    },
    {
        "name": "Polo Office",
        "category": "Electronics",
        "image_url": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Wireless Ergonomic Mouse", "price": 11500.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80"}
        ]
    },

    # ─── TOILETRIES & COSMETICS (4 stores) ───
    {
        "name": "Miniso Cosmetics",
        "category": "Toiletries",
        "image_url": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Lavender Essential Oil", "price": 5500.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80"},
            {"name": "Face Moisture Mask Set", "price": 1800.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&auto=format&fit=crop&q=80"},
            {"name": "Scented Body Mist Spray", "price": 6500.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80"},
            {"name": "Rose Water Toner", "price": 3500.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&auto=format&fit=crop&q=80"},
            {"name": "Facial Cleansing Wipes", "price": 2400.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80"}
        ]
    },
    {
        "name": "Casa Bella",
        "category": "Toiletries",
        "image_url": "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Shea Butter Hand Cream", "price": 4200.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80"},
            {"name": "Exfoliating Scrub Brush", "price": 3100.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80"}
        ]
    },
    {
        "name": "Nectar Beauty Hub",
        "category": "Toiletries",
        "image_url": "https://images.unsplash.com/photo-1608248597481-496100c8c836?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Tea Tree Oil Shampoo", "price": 5800.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop&q=80"},
            {"name": "Organic Coconut Soap", "price": 1400.00, "is_recommended": True, "image_url": "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80"}
        ]
    },
    {
        "name": "Essence Cosmetics",
        "category": "Toiletries",
        "image_url": "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&auto=format&fit=crop&q=80",
        "products": [
            {"name": "Charcoal Peel-Off Mask", "price": 2900.00, "is_recommended": False, "image_url": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&auto=format&fit=crop&q=80"}
        ]
    }
]

def seed():
    print("Clearing existing products and stores...")
    # Delete dependent products first due to foreign key cascade, then stores
    supabase.table("products").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    supabase.table("stores").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    
    print("Seeding stores and products...")
    total_stores = 0
    total_products = 0
    
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
        total_stores += 1
        print(f"[{total_stores}] Inserted store '{s['name']}' ({s['category']})")
        
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
        total_products += len(prod_res.data)
        print(f"    -> Inserted {len(prod_res.data)} products")
        
    print(f"\nDatabase seeding completed successfully!")
    print(f"Total Stores Seeded: {total_stores}")
    print(f"Total Products Seeded: {total_products}")

if __name__ == "__main__":
    seed()
