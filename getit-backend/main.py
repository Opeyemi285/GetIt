from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, home, store, orders, cart

app = FastAPI(title="GetIt API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(home.router)
app.include_router(store.router)
app.include_router(orders.router)
app.include_router(cart.router)

@app.get("/")
def root():
    return {"status": "GetIt API is running"}