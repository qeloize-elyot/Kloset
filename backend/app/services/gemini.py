"""Integracao com Google Gemini para estilo e avaliacao de looks."""
from __future__ import annotations

import json
import re
from typing import Any

import httpx

from app.core.config import get_settings

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash:generateContent"
)


def _extract_json(text: str) -> Any:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


async def _call_gemini(prompt: str) -> str:
    settings = get_settings()
    key = (settings.GEMINI_API_KEY or "").strip()
    if not key:
        raise RuntimeError("GEMINI_API_KEY nao configurada")

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 2048,
        },
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            f"{GEMINI_URL}?key={key}",
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        r.raise_for_status()
        data = r.json()

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError) as e:
        raise RuntimeError(f"Resposta inesperada do Gemini: {data}") from e


async def generate_looks_with_ai(
    wardrobe: list[dict],
    occasion: str,
    temperature: float | None,
    count: int = 3,
) -> list[dict]:
    """
    Retorna lista de dicts:
    { title, rationale, item_ids: [int, ...] }
    """
    wardrobe_json = json.dumps(wardrobe, ensure_ascii=False, indent=2)
    temp_line = (
        f"Temperatura: {temperature:.0f} C."
        if temperature is not None
        else "Temperatura nao informada."
    )

    prompt = f"""Voce e um estilista experiente e sincero. Nao elogie por educacao.
Monte {count} looks diferentes usando APENAS as pecas do guarda-roupa abaixo (use os IDs).
Ocasião: {occasion}
{temp_line}

Regras:
- Cada look deve combinar cores, proporcao e formalidade com a ocasiao.
- Se algo nao combina, nao force.
- Justifique de forma direta e honesta (2-4 frases).
- Prefira looks completos (parte de cima + parte de baixo; casaco se frio).

Guarda-roupa (JSON):
{wardrobe_json}

Responda SOMENTE com JSON valido, sem markdown, neste formato:
{{
  "looks": [
    {{
      "title": "nome curto do look",
      "rationale": "justificativa sincera",
      "item_ids": [1, 2, 3]
    }}
  ]
}}
"""

    raw = await _call_gemini(prompt)
    parsed = _extract_json(raw)
    looks = parsed.get("looks") if isinstance(parsed, dict) else parsed
    if not isinstance(looks, list):
        raise RuntimeError("Gemini nao retornou lista de looks")
    return looks


async def evaluate_look_with_ai(
    items: list[dict],
    occasion: str | None = None,
    temperature: float | None = None,
) -> dict:
    """
    Avaliacao sincera de um look montado pelo usuario.
    Retorna: { score: 0-10, verdict, pros: [], cons: [], suggestions: [] }
    """
    items_json = json.dumps(items, ensure_ascii=False, indent=2)
    ctx = []
    if occasion:
        ctx.append(f"Ocasião: {occasion}")
    if temperature is not None:
        ctx.append(f"Temperatura: {temperature:.0f} C")
    context = "\n".join(ctx) if ctx else "Contexto nao informado."

    prompt = f"""Voce e um estilista critico e honesto. Nao elogie sem motivo.
Avalie este look com sinceridade.

{context}

Pecas:
{items_json}

Criterios: harmonia de cores, formalidade vs ocasiao, clima, proporcao, risco de excesso ou pobreza visual.

Responda SOMENTE com JSON valido, sem markdown:
{{
  "score": 7,
  "verdict": "frase curta (ex: Funciona bem / Precisa ajuste / Evite assim)",
  "pros": ["ponto positivo 1"],
  "cons": ["ponto negativo 1"],
  "suggestions": ["sugestao pratica 1"]
}}
"""

    raw = await _call_gemini(prompt)
    parsed = _extract_json(raw)
    if not isinstance(parsed, dict):
        raise RuntimeError("Avaliacao invalida do Gemini")
    return parsed
