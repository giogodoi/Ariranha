"""
config.py — paths e constantes do sidecar de DS Ariranha.

Único lugar para mudar caminhos, resolução de grid e thresholds.
"""

from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent.parent
MODELS_DIR = PROJECT_ROOT / "models"
DATA_DIR = PROJECT_ROOT / "data"

PARQUET_PATH = DATA_DIR / "dataset.parquet"

MODELO_OCORRENCIA_PATH = MODELS_DIR / "modelo_ocorrencia.joblib"
MODELO_SEVERIDADE_PATH = MODELS_DIR / "modelo_severidade.joblib"
ENCODER_BIOMA_PATH = MODELS_DIR / "encoder_bioma.joblib"
CELL_STATS_PATH = MODELS_DIR / "cell_stats.parquet"
METADATA_PATH = MODELS_DIR / "metadata.json"

# ── Grid geoespacial ─────────────────────────────────────────────────────────
GRID_RESOLUCAO = 0.25  # graus (~27km na latitude do Brasil)

# ── Treino ───────────────────────────────────────────────────────────────────
RANDOM_STATE = 42
TEST_SIZE = 0.2
NEG_PER_POS = 5  # 5 negativos sintéticos por positivo
MAX_POSITIVOS = 1_500_000  # cap pra controlar memória

# Hiperparâmetros XGBoost aprimorados para modelo de ocorrência
XGB_PARAMS = {
    "n_estimators": 400,
    "max_depth": 7,
    "learning_rate": 0.05,
    "subsample": 0.85,
    "colsample_bytree": 0.85,
    "eval_metric": "logloss",
    "random_state": RANDOM_STATE,
    "n_jobs": -1,
}

# Hiperparâmetros XGBoost para modelo de severidade (FRP)
XGB_PARAMS_FRP = {
    "n_estimators": 300,
    "max_depth": 6,
    "learning_rate": 0.05,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "eval_metric": "rmse",
    "random_state": RANDOM_STATE,
    "n_jobs": -1,
}

# ── Features do modelo ───────────────────────────────────────────────────────
FEATURES = [
    "lat_grid",
    "lon_grid",
    "media_risco",
    "media_dias_seco",
    "media_precip",
    "media_frp_historico",
    "n_historico",
    "bioma_enc",
    "mes",
    "dia_do_ano",
]

# ── Classificação de risco (output do endpoint) ──────────────────────────────
THRESHOLDS_RISCO = [
    (0.30, "Baixo"),
    (0.60, "Moderado"),
    (0.80, "Alto"),
    (1.01, "Crítico"),
]


def classificar_risco(prob: float) -> str:
    for limite, label in THRESHOLDS_RISCO:
        if prob < limite:
            return label
    return "Crítico"

# ── Classificação de severidade (FRP) ─────────────────────────────────────────
# Valores típicos de FRP: < 50 baixo, 50-100 moderado, > 100 alto
THRESHOLDS_SEVERIDADE = [
    (30.0, "Baixa"),
    (100.0, "Moderada"),
    (500.0, "Alta"),
    (float('inf'), "Extrema"),
]

def classificar_severidade(frp: float) -> str:
    for limite, label in THRESHOLDS_SEVERIDADE:
        if frp < limite:
            return label
    return "Extrema"
