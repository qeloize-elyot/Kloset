"""Estilo com IA: Groq (prioridade) ou Gemini."""
from __future__ import annotations

import json
import re
from typing import Any

import httpx

from app.core.config import get_settings

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash:generateContent"
)


def has_ai_key() -> bool:
    s = get_settings()
    return bool((s.GROQ_API_KEY or "").strip() or (s.GEMINI_API_KEY or "").strip())


def _extract_json(text: str) -> Any:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        text = text[start : end + 1]
    return json.loads(text)


async def _call_groq(prompt: str) -> str:
    key = (get_settings().GROQ_API_KEY or "").strip()
    if not key:
        raise RuntimeError("GROQ_API_KEY ausente")
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Voce e um estilista editorial brasileiro: criativo, sincero, "
                    "sem bajulacao e sem cliches de moda. Responda apenas JSON valido."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.85,
        "max_tokens": 2048,
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            GROQ_URL,
            json=payload,
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
        )
        r.raise_for_status()
        data = r.json()
    return data["choices"][0]["message"]["content"]


async def _call_gemini(prompt: str) -> str:
    key = (get_settings().GEMINI_API_KEY or "").strip()
    if not key:
        raise RuntimeError("GEMINI_API_KEY ausente")
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.85, "maxOutputTokens": 2048},
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            f"{GEMINI_URL}?key={key}",
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        r.raise_for_status()
        data = r.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]


async def _call_llm(prompt: str) -> str:
    s = get_settings()
    errors: list[str] = []
    if (s.GROQ_API_KEY or "").strip():
        try:
            return await _call_groq(prompt)
        except Exception as e:
            errors.append(f"Groq: {e}")
    if (s.GEMINI_API_KEY or "").strip():
        try:
            return await _call_gemini(prompt)
        except Exception as e:
            errors.append(f"Gemini: {e}")
    raise RuntimeError("; ".join(errors) or "Nenhuma chave de IA configurada")


async def generate_looks_with_ai(
    wardrobe: list[dict],
    occasion: str,
    temperature: float | None,
    count: int = 3,
) -> list[dict]:
    wardrobe_json = json.dumps(wardrobe, ensure_ascii=False, indent=2)
    temp_line = (
        f"Temperatura: {temperature:.0f} C."
        if temperature is not None
        else "Temperatura nao informada."
    )
    prompt = f"""Monte {count} looks DIFERENTES entre si, usando APENAS as pecas abaixo (IDs numericos).
Ocasiao: {occasion}
{temp_line}

Seja criativo de verdade:
- Evite o obvio (camiseta + jeans sempre iguais).
- Explore contraste de cor, textura, proporcao e uma peca ancora.
- Titulos curtos e com personalidade (nao "Look casual 1").
- Justificativa honesta, 2-3 frases, como estilista de revista.
- Prefira look completo: cima+baixo (+ calcado/casaco se fizer sentido).

Guarda-roupa:
{wardrobe_json}

JSON:
{{"looks":[{{"title":"...","rationale":"...","item_ids":[1,2,3]}}]}}
"""
    raw = await _call_llm(prompt)
    parsed = _extract_json(raw)
    looks = parsed.get("looks") if isinstance(parsed, dict) else parsed
    if not isinstance(looks, list):
        raise RuntimeError("IA nao retornou lista de looks")
    return looks


async def evaluate_look_with_ai(
    items: list[dict],
    occasion: str | None = None,
    temperature: float | None = None,
) -> dict:
    items_json = json.dumps(items, ensure_ascii=False, indent=2)
    ctx = []
    if occasion:
        ctx.append(f"Ocasiao: {occasion}")
    if temperature is not None:
        ctx.append(f"Temperatura: {temperature:.0f} C")
    context = "\n".join(ctx) if ctx else "Contexto nao informado."
    prompt = f"""Avalie este look com sinceridade editorial (sem bajular).

{context}

Pecas:
{items_json}

Criterios: cores, formalidade, clima, proporcao, risco de parecer generico ou forçado.

JSON:
{{"score":7,"verdict":"frase curta","pros":["..."],"cons":["..."],"suggestions":["..."]}}
"""
    raw = await _call_llm(prompt)
    parsed = _extract_json(raw)
    if not isinstance(parsed, dict):
        raise RuntimeError("Avaliacao invalida")
    return parsed
