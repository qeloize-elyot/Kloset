from fastapi import APIRouter, Query

from app.services import weather as weather_service

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("")
async def get_weather(city: str = Query(..., min_length=2, max_length=80)):
    return await weather_service.get_weather_by_city(city)
