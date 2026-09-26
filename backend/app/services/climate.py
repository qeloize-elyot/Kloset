"""Clima informado pelo usuario — sem cidade, GPS ou API externa."""

CLIMATE_PRESETS = {
    "frio": {"temperature": 12.0, "label": "frio"},
    "ameno": {"temperature": 20.0, "label": "ameno"},
    "calor": {"temperature": 30.0, "label": "calor"},
    "chuva": {"temperature": 18.0, "label": "chuva"},
    "vento": {"temperature": 16.0, "label": "vento"},
}


def resolve_climate(
    climate: str | None,
    temperature: float | None,
) -> tuple[float | None, str | None]:
    """Retorna (temperatura efetiva, rotulo do clima)."""
    condition = None
    temp = temperature

    if climate:
        key = climate.strip().lower()
        preset = CLIMATE_PRESETS.get(key)
        if preset:
            condition = preset["label"]
            if temp is None:
                temp = preset["temperature"]
        else:
            condition = key

    return temp, condition
