"""
features.py — feature engineering geoespacial e temporal.

Portado do AVE com adaptação para grid 0.25°.
"""

import pandas as pd

from src.config import GRID_RESOLUCAO


def add_grid_cell(
    df: pd.DataFrame,
    resolucao: float = GRID_RESOLUCAO,
    lat_col: str = "latitude",
    lon_col: str = "longitude",
) -> pd.DataFrame:
    """
    Adiciona célula geoespacial discreta:
        lat_grid, lon_grid : centro da célula em graus
        cell_id            : "<lat_grid>_<lon_grid>"
    """
    df = df.copy()
    df["lat_grid"] = (df[lat_col] / resolucao).round(0) * resolucao
    df["lon_grid"] = (df[lon_col] / resolucao).round(0) * resolucao
    df["cell_id"] = (
        df["lat_grid"].round(4).astype(str) + "_" + df["lon_grid"].round(4).astype(str)
    )
    return df


def add_temporal_features(
    df: pd.DataFrame, col_datetime: str = "data_hora"
) -> pd.DataFrame:
    """
    Adiciona mes, dia_do_ano, hora, dia_semana a partir do datetime.
    """
    df = df.copy()
    dt = pd.to_datetime(df[col_datetime])
    df["mes"] = dt.dt.month
    df["dia_do_ano"] = dt.dt.dayofyear
    df["hora"] = dt.dt.hour
    df["dia_semana"] = dt.dt.dayofweek
    df["ano"] = dt.dt.year
    return df


def cell_id_from_coords(lat: float, lon: float, resolucao: float = GRID_RESOLUCAO) -> tuple:
    """
    Versão escalar (para uso no endpoint Flask) — retorna (lat_grid, lon_grid, cell_id).
    """
    lat_grid = round(lat / resolucao) * resolucao
    lon_grid = round(lon / resolucao) * resolucao
    cell_id = f"{round(lat_grid, 4)}_{round(lon_grid, 4)}"
    return lat_grid, lon_grid, cell_id
