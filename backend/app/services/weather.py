"""Clima atual via Open-Meteo (gratuito, sem API key)."""
from __future__ import annotations

import httpx
from fastapi import HTTPException, status

GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

WEATHER_CODES = {
    0: "ceu limpo",
    1: "principalmente limpo",
    2: "parcialmente nublado",
    3: "nublado",
    45: "nevoa",
    48: "nevoa gelada",
    51: "garoa fraca",
    53: "garoa",
    55: "garoa forte",
    61: "chuva fraca",
    63: "chuva",
    65: "chuva forte",
    71: "neve fraca",
    73: "neve",
    75: "neve forte",
    80: "pancadas de chuva",
    81: "pancadas de chuva",
    82: "pancadas fortes",
    95: "trovoada",
    96: "trovoada com granizo",
    99: "trovoada com granizo",
}


async def get_weather_by_city(city: str) -> dict:
    city = (city or "").strip()
    if len(city) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Informe uma cidade valida.",
        )

    async with httpx.AsyncClient(timeout=20.0) as client:
        geo = await client.get(
            GEOCODE_URL,
            params={"name": city, "count": 1, "language": "pt", "format": "json"},
        )
        geo.raise_for_status()
        data = geo.json()
        results = data.get("results") or []
        if not results:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cidade nao encontrada: {city}",
            )

        place = results[0]
        lat = place["latitude"]
        lon = place["longitude"]
        label = place.get("name") or city
        if place.get("admin1"):
            label = f"{label}, {place['admin1']}"
        if place.get("country_code"):
            label = f"{label} ({place['country_code']})"

        forecast = await client.get(
            FORECAST_URL,
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,weather_code,apparent_temperature,precipitation,wind_speed_10m",
                "timezone": "auto",
            },
        )
        forecast.raise_for_status()
        current = forecast.json().get("current") or {}

    code = current.get("weather_code")
    condition = WEATHER_CODES.get(code, "condicao desconhecida")

    return {
        "city": label,
        "temperature": current.get("temperature_2m"),
        "feels_like": current.get("apparent_temperature"),
        "condition": condition,
        "weather_code": code,
        "precipitation": current.get("precipitation"),
        "wind_speed": current.get("wind_speed_10m"),
        "latitude": lat,
        "longitude": lon,
    }
