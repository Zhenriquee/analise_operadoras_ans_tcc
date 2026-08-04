"""
Módulo responsável pela carga e cache dos dados Parquet.

Implementa o padrão Singleton para garantir que os DataFrames
sejam carregados apenas uma vez durante o ciclo de vida da aplicação.
"""
import pandas as pd
from config import Config


class DataLoader:
    """Singleton que carrega e pré-processa os dados Parquet."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._load_and_process()

    def _fix_encoding(self, df: pd.DataFrame) -> pd.DataFrame:
        """Corrige encoding de colunas string (latin-1 → UTF-8)."""
        for col in df.select_dtypes(include=["object", "string"]).columns:
            try:
                df[col] = df[col].apply(
                    lambda x: x.encode("latin-1").decode("utf-8")
                    if isinstance(x, str)
                    else x
                )
            except (UnicodeDecodeError, UnicodeEncodeError):
                # Coluna já está em UTF-8 ou não precisa de conversão
                pass
        return df

    def _load_and_process(self):
        """Carrega os 3 Parquets, trata encoding e realiza merge."""
        print("[DataLoader] Carregando dados...")

        # Carregar Parquets
        self._op_mun = pd.read_parquet(Config.OPERADORA_MUNICIPIO_PATH)
        self._dim_mun = pd.read_parquet(Config.DIM_MUNICIPIO_PATH)
        self._dim_op = pd.read_parquet(Config.DIM_OPERADORA_PATH)

        # Corrigir encoding
        self._op_mun = self._fix_encoding(self._op_mun)
        self._dim_mun = self._fix_encoding(self._dim_mun)
        self._dim_op = self._fix_encoding(self._dim_op)

        # Tratar NaN nas colunas numéricas populacionais
        fill_cols = ["populacao_2022", "populacao_estimada_2025", "qtd_pessoas_contratadas"]
        for col in fill_cols:
            if col in self._op_mun.columns:
                self._op_mun[col] = self._op_mun[col].fillna(0).astype(int)

        # Merge: operadora_por_municipio + dim_municipio (trazer nome_uf)
        self._op_mun_full = self._op_mun.merge(
            self._dim_mun[["codigo_municipio", "nome_uf"]],
            on="codigo_municipio",
            how="left",
        )

        print(
            f"[DataLoader] Dados carregados: "
            f"{len(self._op_mun)} registros, "
            f"{self._op_mun['codigo_registro_operadora'].nunique()} operadoras, "
            f"{self._op_mun['codigo_municipio'].nunique()} municípios"
        )

    @property
    def op_mun(self) -> pd.DataFrame:
        """DataFrame principal com UF (merge já realizado)."""
        return self._op_mun_full

    @property
    def dim_mun(self) -> pd.DataFrame:
        """Dimensão de municípios (com polígonos)."""
        return self._dim_mun

    @property
    def dim_op(self) -> pd.DataFrame:
        """Dimensão de operadoras."""
        return self._dim_op
