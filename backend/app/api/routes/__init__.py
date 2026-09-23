from fastapi import APIRouter

from app.api.routes import auth, clothing, looks, weather

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(clothing.router)
api_router.include_router(looks.router)
api_router.include_router(weather.router)
