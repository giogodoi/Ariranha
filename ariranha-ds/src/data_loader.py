"""
data_loader.py — leitura e limpeza mínima do parquet INPE.

Espera schema:
    data_hora, estado, municipio, latitude, longitude, bioma,
    dias_sem_chuva, precipitacao, risco_fogo
"""

import pandas as pd
from pathlib import Path

from src.config import PARQUET_PATH


def load(path: Path = PARQUET_PATH) -> pd.DataFrame:
    """
    Lê o parquet, deduplica por (data_hora, lat, lon), preenche NaN.

    Retorna DataFrame com tipos canônicos:
        data_hora       datetime64[us]
        estado          str
        municipio       str
        latitude        float64
        longitude       float64
        bioma           str
        dias_sem_chuva  float64  (NaN → -1)
        precipitacao    float64
        risco_fogo      float64  (NaN → -1)
    """
    df = pd.read_parquet(path)

    df = df.dropna(subset=["latitude", "longitude", "data_hora"])

    # Sem coluna `id` no parquet — deduplica por (data, lat, lon)
    df = df.drop_duplicates(subset=["data_hora", "latitude", "longitude"])

    df["dias_sem_chuva"] = df["dias_sem_chuva"].fillna(-1.0)
    df["risco_fogo"] = df["risco_fogo"].fillna(-1.0)
    if "frp" in df.columns:
        df["frp"] = df["frp"].fillna(0.0)
    
    df["bioma"] = df["bioma"].fillna("Desconhecido")
    df["estado"] = df["estado"].fillna("Desconhecido")

    return df.reset_index(drop=True)


if __name__ == "__main__":
    df = load()
    print(f"Linhas após dedup: {len(df):,}")
    print(f"Período: {df['data_hora'].min()} → {df['data_hora'].max()}")
    print(f"Memória: {df.memory_usage(deep=True).sum() / 1e6:.0f} MB")
    print()
    print("Schema:")
    print(df.dtypes)
