"""
train.py — pipeline de treino da Pred 2 (ocorrência 24h).

Fluxo:
    1. Carrega parquet → adiciona grid 0.25° + features temporais
    2. Constrói exemplos (cell_id, data) — positivos + negativos amostrados
    3. Adiciona features agregadas históricas da célula (perfil estático)
    4. Encoda bioma da célula (modal)
    5. Treina XGBClassifier com scale_pos_weight
    6. Salva: modelo, encoder, cell_stats (lookup pra API), metadata

Uso:
    python -m src.train
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    average_precision_score,
    classification_report,
    roc_auc_score,
    mean_squared_error,
    mean_absolute_error,
    r2_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier, XGBRegressor

from src.config import (
    CELL_STATS_PATH,
    ENCODER_BIOMA_PATH,
    FEATURES,
    MAX_POSITIVOS,
    METADATA_PATH,
    MODELO_OCORRENCIA_PATH,
    MODELO_SEVERIDADE_PATH,
    MODELS_DIR,
    NEG_PER_POS,
    RANDOM_STATE,
    TEST_SIZE,
    XGB_PARAMS,
    XGB_PARAMS_FRP,
)
from src.data_loader import load
from src.features import add_grid_cell, add_temporal_features


def construir_exemplos(df: pd.DataFrame, rng: np.random.Generator) -> pd.DataFrame:
    """
    Gera exemplos (cell_id, data, incendio).

    - Positivos: tuplas únicas (cell, data) onde houve foco. Cap em MAX_POSITIVOS.
    - Negativos: NEG_PER_POS por positivo, amostrando aleatoriamente
      (cell histórica × dia do período), removendo colisões com positivos.
    """
    print("Construindo exemplos...")
    df = df.copy()
    df["data"] = df["data_hora"].dt.normalize()

    cols_group = ["cell_id", "lat_grid", "lon_grid", "data"]
    if "frp" in df.columns:
        positivos = df.groupby(cols_group)["frp"].max().reset_index().rename(columns={"frp": "frp_target"})
    else:
        positivos = df[cols_group].drop_duplicates().reset_index(drop=True)
        positivos["frp_target"] = 0.0
    print(f"  Positivos brutos: {len(positivos):,}")

    if len(positivos) > MAX_POSITIVOS:
        positivos = positivos.sample(
            MAX_POSITIVOS, random_state=RANDOM_STATE
        ).reset_index(drop=True)
        print(f"  Positivos amostrados (cap): {len(positivos):,}")

    positivos["incendio"] = 1

    # Universo: células que tiveram ao menos 1 foco + dias do período
    celulas = df[["cell_id", "lat_grid", "lon_grid"]].drop_duplicates().reset_index(drop=True)
    dias = pd.DatetimeIndex(df["data"].unique()).sort_values()
    print(f"  Células únicas: {len(celulas):,}  |  Dias: {len(dias):,}")

    n_neg = len(positivos) * NEG_PER_POS

    idx_celulas = rng.integers(0, len(celulas), size=n_neg)
    idx_dias = rng.integers(0, len(dias), size=n_neg)

    negativos = celulas.iloc[idx_celulas].reset_index(drop=True)
    negativos["data"] = dias[idx_dias].values
    negativos["incendio"] = 0
    negativos["frp_target"] = 0.0

    # Remove negativos que coincidem com positivos (mesma célula+dia)
    chave_pos = set(zip(positivos["cell_id"], positivos["data"]))
    mask_keep = [
        (cid, d) not in chave_pos
        for cid, d in zip(negativos["cell_id"], negativos["data"])
    ]
    negativos = negativos[mask_keep].reset_index(drop=True)
    print(f"  Negativos (após dedup): {len(negativos):,}")

    exemplos = pd.concat([positivos, negativos], ignore_index=True)
    print(f"  Total exemplos: {len(exemplos):,}  (pos={positivos.shape[0]:,}, neg={negativos.shape[0]:,})")
    return exemplos


def computar_cell_stats(df: pd.DataFrame) -> pd.DataFrame:
    """
    Agrega perfil histórico estático da célula:
        media_risco, media_dias_seco, media_precip, n_historico, bioma_modal
    """
    print("Computando estatísticas por célula...")
    agg_dict = {
        "lat_grid": ("lat_grid", "first"),
        "lon_grid": ("lon_grid", "first"),
        "media_risco": ("risco_fogo", "mean"),
        "media_dias_seco": ("dias_sem_chuva", "mean"),
        "media_precip": ("precipitacao", "mean"),
        "n_historico": ("data_hora", "count"),
    }
    
    if "frp" in df.columns:
        agg_dict["media_frp_historico"] = ("frp", "mean")
    else:
        df["frp_dummy"] = 0.0
        agg_dict["media_frp_historico"] = ("frp_dummy", "mean")

    stats = df.groupby("cell_id").agg(**agg_dict).reset_index()

    # Bioma modal (mais comum) por célula
    bioma_modal = (
        df.groupby("cell_id")["bioma"]
        .agg(lambda s: s.mode().iloc[0] if len(s) > 0 else "Desconhecido")
        .reset_index()
        .rename(columns={"bioma": "bioma_modal"})
    )

    stats = stats.merge(bioma_modal, on="cell_id", how="left")
    print(f"  {len(stats):,} células com estatísticas")
    return stats


def treinar(
    exemplos: pd.DataFrame,
    cell_stats: pd.DataFrame,
    encoder: LabelEncoder,
) -> tuple[XGBClassifier, dict]:
    """
    Junta features, treina XGBClassifier, retorna (modelo, métricas).
    """
    print("Preparando matriz de treino...")
    cell_stats = cell_stats.copy()
    cell_stats["bioma_enc"] = encoder.transform(cell_stats["bioma_modal"])

    feature_cols_celula = [
        "cell_id",
        "media_risco",
        "media_dias_seco",
        "media_precip",
        "media_frp_historico",
        "n_historico",
        "bioma_enc",
    ]
    df_full = exemplos.merge(cell_stats[feature_cols_celula], on="cell_id", how="left")
    df_full["mes"] = df_full["data"].dt.month
    df_full["dia_do_ano"] = df_full["data"].dt.dayofyear

    X = df_full[FEATURES].fillna(-1)
    y = df_full["incendio"]

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )

    pos = int((y_tr == 1).sum())
    neg = int((y_tr == 0).sum())
    print(f"  Treino: {len(X_tr):,}  |  Teste: {len(X_te):,}  |  pos/neg treino: {pos:,}/{neg:,}")

    modelo = XGBClassifier(scale_pos_weight=neg / pos, **XGB_PARAMS)

    print("Treinando XGBClassifier...")
    modelo.fit(X_tr, y_tr, eval_set=[(X_te, y_te)], verbose=False)

    y_prob = modelo.predict_proba(X_te)[:, 1]
    y_pred = (y_prob >= 0.5).astype(int)

    auc = float(roc_auc_score(y_te, y_prob))
    ap = float(average_precision_score(y_te, y_prob))

    from sklearn.metrics import accuracy_score
    acc = float(accuracy_score(y_te, y_pred))

    print(f"\n  AUC-ROC : {auc:.4f}")
    print(f"  Avg Prec: {ap:.4f}")
    print(f"  Acurácia: {acc:.4f}")
    print(f"\n{classification_report(y_te, y_pred, target_names=['sem_foco', 'com_foco'])}")

    metricas = {
        "auc_roc": auc,
        "average_precision": ap,
        "accuracy": acc,
        "n_treino": len(X_tr),
        "n_teste": len(X_te),
        "n_positivos_treino": pos,
        "n_negativos_treino": neg,
    }
    return modelo, metricas


def treinar_severidade(
    exemplos: pd.DataFrame,
    cell_stats: pd.DataFrame,
    encoder: LabelEncoder,
) -> tuple[XGBRegressor, dict]:
    """
    Treina XGBRegressor para prever o FRP (severidade) apenas nas instâncias com fogo.
    """
    print("\nPreparando matriz de treino para severidade (FRP)...")
    df_pos = exemplos[exemplos["incendio"] == 1].copy()

    cell_stats_tmp = cell_stats.copy()
    cell_stats_tmp["bioma_enc"] = encoder.transform(cell_stats_tmp["bioma_modal"])

    feature_cols_celula = [
        "cell_id", "media_risco", "media_dias_seco", "media_precip", 
        "media_frp_historico", "n_historico", "bioma_enc"
    ]
    df_full = df_pos.merge(cell_stats_tmp[feature_cols_celula], on="cell_id", how="left")
    df_full["mes"] = df_full["data"].dt.month
    df_full["dia_do_ano"] = df_full["data"].dt.dayofyear

    X = df_full[FEATURES].fillna(-1)
    y = df_full["frp_target"]

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )

    print(f"  Treino severidade: {len(X_tr):,}  |  Teste: {len(X_te):,}")

    modelo = XGBRegressor(**XGB_PARAMS_FRP)
    print("Treinando XGBRegressor (Severidade FRP)...")
    modelo.fit(X_tr, y_tr, eval_set=[(X_te, y_te)], verbose=False)

    y_pred = modelo.predict(X_te)
    
    mse = float(mean_squared_error(y_te, y_pred)) if y_te.shape[0] > 0 else 0.0
    rmse = mse ** 0.5
    mae = float(mean_absolute_error(y_te, y_pred)) if y_te.shape[0] > 0 else 0.0
    r2 = float(r2_score(y_te, y_pred)) if y_te.shape[0] > 0 else 0.0

    print(f"\n  RMSE : {rmse:.4f}")
    print(f"  MAE  : {mae:.4f}")
    print(f"  R2   : {r2:.4f}")

    metricas = {
        "rmse": rmse,
        "mae": mae,
        "r2": r2,
        "n_treino": len(X_tr),
        "n_teste": len(X_te),
    }
    return modelo, metricas


def salvar_artefatos(
    modelo: XGBClassifier,
    modelo_sev: XGBRegressor,
    encoder: LabelEncoder,
    cell_stats: pd.DataFrame,
    metricas_occ: dict,
    metricas_sev: dict,
    df_origem: pd.DataFrame,
) -> None:
    """Persiste tudo que o sidecar FastAPI precisa para servir."""
    print("\nSalvando artefatos...")
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    joblib.dump(modelo, MODELO_OCORRENCIA_PATH)
    joblib.dump(modelo_sev, MODELO_SEVERIDADE_PATH)
    joblib.dump(encoder, ENCODER_BIOMA_PATH)

    cell_stats_para_salvar = cell_stats.copy()
    cell_stats_para_salvar["bioma_enc"] = encoder.transform(
        cell_stats_para_salvar["bioma_modal"]
    )
    cell_stats_para_salvar.to_parquet(CELL_STATS_PATH, index=False)

    metadata = {
        "treinado_em": datetime.now(timezone.utc).isoformat(),
        "modelos": ["XGBClassifier", "XGBRegressor"],
        "predicoes": ["ocorrencia_24h", "severidade_frp"],
        "horizonte": "24h",
        "grid_resolucao_graus": 0.25,
        "features": FEATURES,
        "hiperparametros_ocorrencia": {k: v for k, v in XGB_PARAMS.items() if k != "n_jobs"},
        "hiperparametros_severidade": {k: v for k, v in XGB_PARAMS_FRP.items() if k != "n_jobs"},
        "neg_per_pos": NEG_PER_POS,
        "metricas_ocorrencia": metricas_occ,
        "metricas_severidade": metricas_sev,
        "dataset": {
            "linhas_origem": int(len(df_origem)),
            "periodo_inicio": str(df_origem["data_hora"].min()),
            "periodo_fim": str(df_origem["data_hora"].max()),
            "n_celulas_modeladas": int(len(cell_stats)),
        },
        "limitacoes": [
            "Features são agregados históricos estáticos da célula — modelo aprende propensão geográfica.",
            "Cobertura limitada às células com ao menos um foco no período de treino.",
        ],
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2, ensure_ascii=False))

    print(f"  modelo ocorrência:  {MODELO_OCORRENCIA_PATH}")
    print(f"  modelo severidade:  {MODELO_SEVERIDADE_PATH}")
    print(f"  encoder:            {ENCODER_BIOMA_PATH}")
    print(f"  cell_stats:         {CELL_STATS_PATH}")
    print(f"  metadata:           {METADATA_PATH}")


def main() -> None:
    rng = np.random.default_rng(RANDOM_STATE)

    print("== Etapa 1/4 — Carregando dados ==")
    df = load()
    print(f"  {len(df):,} linhas após dedup\n")

    print("== Etapa 2/4 — Feature engineering ==")
    df = add_grid_cell(df)
    df = add_temporal_features(df)
    print(f"  Células únicas: {df['cell_id'].nunique():,}\n")

    print("== Etapa 3/4 — Construindo exemplos + features ==")
    exemplos = construir_exemplos(df, rng)
    cell_stats = computar_cell_stats(df)

    encoder = LabelEncoder().fit(cell_stats["bioma_modal"])
    print(f"  Biomas encodados: {list(encoder.classes_)}\n")

    print("== Etapa 4/5 — Treino Ocorrência ==")
    modelo, metricas_occ = treinar(exemplos, cell_stats, encoder)

    print("== Etapa 5/5 — Treino Severidade ==")
    modelo_sev, metricas_sev = treinar_severidade(exemplos, cell_stats, encoder)

    salvar_artefatos(modelo, modelo_sev, encoder, cell_stats, metricas_occ, metricas_sev, df)
    print("\n[OK] Treino concluído.")


if __name__ == "__main__":
    main()
