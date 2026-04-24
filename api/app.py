"""
FastAPI sidecar — serve a Pred 2 (ocorrência 24h) e severidade (FRP).

Endpoints:
    GET  /health                    → status
    GET  /modelo/info               → metadata.json
    POST /predict/ocorrencia        → P(foco em 24h) na célula da coordenada e severidade

Iniciar:
    cd ariranha-ds && uvicorn api.app:app --host 0.0.0.0 --port 5000
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.config import (
    CELL_STATS_PATH,
    ENCODER_BIOMA_PATH,
    FEATURES,
    METADATA_PATH,
    MODELO_OCORRENCIA_PATH,
    MODELO_SEVERIDADE_PATH,
    classificar_risco,
    classificar_severidade,
)
from src.features import cell_id_from_coords

app = FastAPI(title="Ariranha DS API", description="Sidecar de predição de risco de incêndio e severidade")

# ── Carregamento eager dos artefatos ─────────────────────────────────────────
try:
    modelo = joblib.load(MODELO_OCORRENCIA_PATH)
    modelo_sev = joblib.load(MODELO_SEVERIDADE_PATH)
    encoder_bioma = joblib.load(ENCODER_BIOMA_PATH)
    cell_stats_df = pd.read_parquet(CELL_STATS_PATH)
    metadata = json.loads(METADATA_PATH.read_text())

    # Lookup O(1) por cell_id
    CELL_STATS = cell_stats_df.set_index("cell_id").to_dict("index")
    print(f"[OK] {len(CELL_STATS):,} células carregadas em memória")
except FileNotFoundError as e:
    print(f"[AVISO] artefato ausente: {e}. Rode `python -m src.train` primeiro.")
    modelo = None
    modelo_sev = None
    encoder_bioma = None
    CELL_STATS = {}
    metadata = {}


# ── Helpers ──────────────────────────────────────────────────────────────────
def _modelo_pronto() -> bool:
    return modelo is not None and modelo_sev is not None and len(CELL_STATS) > 0


class PredictRequest(BaseModel):
    latitude: float
    longitude: float
    data_hora: Optional[str] = None


# ── Endpoints ────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok" if _modelo_pronto() else "degraded",
        "modelo_carregado": modelo is not None,
        "modelo_sev_carregado": modelo_sev is not None,
        "n_celulas": len(CELL_STATS),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/modelo/info")
def modelo_info():
    return metadata or {"aviso": "metadata.json ausente"}


@app.post("/predict/ocorrencia")
def predict_ocorrencia(req: PredictRequest):
    """
    Body JSON:
        {
            "latitude":  -10.0,
            "longitude": -52.0,
            "data_hora": "2026-04-24T14:00:00"   // opcional, default=agora
        }

    Resposta:
        {
            "probabilidade":  0.74,
            "classe":         "Alto",
            "horizonte":      "24h",
            "cell_id":        "-10.0_-52.0",
            "lat_grid":       -10.0,
            "lon_grid":       -52.0,
            "n_historico_celula": 1842,
            "severidade_frp": 120.5,
            "classe_severidade": "Alta"
        }

    404 se a coordenada cai em célula sem histórico no período de treino.
    """
    if not _modelo_pronto():
        raise HTTPException(status_code=503, detail="Modelos não carregados. Rode src.train.")

    lat_grid, lon_grid, cell_id = cell_id_from_coords(req.latitude, req.longitude)

    stats = CELL_STATS.get(cell_id)
    if stats is None:
        raise HTTPException(
            status_code=404,
            detail={
                "erro": "Célula sem histórico no período de treino — fora da cobertura do modelo",
                "cell_id": cell_id,
                "limitacao": "Modelo treinado apenas em células com ao menos 1 foco no período"
            }
        )

    if req.data_hora:
        try:
            dt = pd.to_datetime(req.data_hora)
        except Exception:
            raise HTTPException(status_code=400, detail="data_hora inválida (use ISO 8601)")
    else:
        dt = pd.Timestamp.now()

    X = pd.DataFrame(
        [
            {
                "lat_grid": lat_grid,
                "lon_grid": lon_grid,
                "media_risco": stats["media_risco"],
                "media_dias_seco": stats["media_dias_seco"],
                "media_precip": stats["media_precip"],
                "media_frp_historico": stats.get("media_frp_historico", 0.0),
                "n_historico": stats["n_historico"],
                "bioma_enc": stats["bioma_enc"],
                "mes": dt.month,
                "dia_do_ano": dt.dayofyear,
            }
        ]
    )[FEATURES].fillna(-1)

    prob = float(modelo.predict_proba(X)[0][1])
    
    frp_pred = 0.0
    classe_sev = "N/A"
    if prob >= 0.30:  # Somente prediz severidade se houver algum risco
        frp_pred = float(modelo_sev.predict(X)[0])
        # FRP não pode ser negativo
        frp_pred = max(0.0, frp_pred)
        classe_sev = classificar_severidade(frp_pred)

    return {
        "probabilidade": round(prob, 4),
        "classe": classificar_risco(prob),
        "horizonte": "24h",
        "cell_id": cell_id,
        "lat_grid": lat_grid,
        "lon_grid": lon_grid,
        "n_historico_celula": int(stats["n_historico"]),
        "bioma_modal": stats.get("bioma_modal"),
        "severidade_frp": round(frp_pred, 2) if prob >= 0.30 else None,
        "classe_severidade": classe_sev if prob >= 0.30 else None,
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 5000))
    uvicorn.run("api.app:app", host="0.0.0.0", port=port, reload=False)
