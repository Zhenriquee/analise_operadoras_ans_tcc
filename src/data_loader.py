"""
Módulo responsável pela carga e cache dos dados Parquet.

Implementa o padrão Singleton para garantir que os DataFrames
sejam carregados apenas uma vez durante o ciclo de vida da aplicação.
"""
import ast
import pandas as pd
from shapely import wkb
from shapely.geometry import mapping
from config import Config


class DataLoader:
    """Singleton que carrega e pré-processa os 6 datasets do Star Schema."""

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
        """Carrega os 6 Parquets e pré-processa dados."""
        print("[DataLoader] Carregando dados...")

        # 1. Dimensão Operadora
        self._dim_operadora = pd.read_parquet(Config.DIM_OPERADORA_PATH)
        self._dim_operadora = self._fix_encoding(self._dim_operadora)

        # 2. Área de Comercialização
        self._area_comercializacao = pd.read_parquet(Config.AREA_COMERCIALIZACAO_PATH)

        # 3. Fato Beneficiário por Município
        self._fato_beneficiario = pd.read_parquet(Config.FATO_BENEFICIARIO_PATH)

        # 4. Dimensão Município Score Mercado (tabela inteligente com ML)
        self._dim_municipio_score = pd.read_parquet(Config.DIM_MUNICIPIO_SCORE_PATH)
        self._dim_municipio_score = self._fix_encoding(self._dim_municipio_score)

        # 5. Fato População Contratada (CAGED)
        self._fato_populacao = pd.read_parquet(Config.FATO_POPULACAO_PATH)

        # 6. Raio 50km Municípios Viáveis
        self._raio_50km = pd.read_parquet(Config.RAIO_50KM_PATH)
        self._raio_50km = self._fix_encoding(self._raio_50km)
        # Converter WKB binário para WKT string para uso posterior
        self._raio_50km["poligono_raio_50km_geojson"] = self._raio_50km[
            "poligono_raio_50km"
        ].apply(self._wkb_to_geojson_safe)
        # Parse dos vizinhos: string "[110032, 110037]" → list de ints
        self._raio_50km["vizinhos_list"] = self._raio_50km[
            "codigo_municipio_vizinhos_validos"
        ].apply(self._parse_vizinhos)

        print(
            f"[DataLoader] Dados carregados: "
            f"{len(self._dim_operadora)} operadoras, "
            f"{len(self._dim_municipio_score)} municípios score, "
            f"{len(self._fato_beneficiario)} registros beneficiário, "
            f"{len(self._raio_50km)} registros raio 50km"
        )

    @staticmethod
    def _wkb_to_geojson_safe(wkb_data):
        """Converte WKB binário para dict GeoJSON geometry de forma segura."""
        if wkb_data is None or (isinstance(wkb_data, float) and pd.isna(wkb_data)):
            return None
        try:
            geom = wkb.loads(wkb_data)
            return mapping(geom)
        except Exception:
            return None

    @staticmethod
    def _parse_vizinhos(val):
        """Converte string '[110032, 110037]' para lista de inteiros."""
        if val is None or (isinstance(val, float) and pd.isna(val)):
            return []
        try:
            parsed = ast.literal_eval(str(val))
            if isinstance(parsed, list):
                return [int(x) for x in parsed]
            return []
        except (ValueError, SyntaxError):
            return []

    # ---- Properties para acesso aos datasets ----

    @property
    def dim_operadora(self) -> pd.DataFrame:
        """Dimensão de operadoras (cadastro)."""
        return self._dim_operadora

    @property
    def area_comercializacao(self) -> pd.DataFrame:
        """Municípios onde cada operadora pode atuar (permissão ANS)."""
        return self._area_comercializacao

    @property
    def fato_beneficiario(self) -> pd.DataFrame:
        """Fato: contagem de vidas por operadora × município (granularidade demográfica)."""
        return self._fato_beneficiario

    @property
    def dim_municipio_score(self) -> pd.DataFrame:
        """Dimensão inteligente de municípios (ML clusters, HHI, população, etc.)."""
        return self._dim_municipio_score

    @property
    def fato_populacao(self) -> pd.DataFrame:
        """Fato: dados CAGED de empregos CLT por município × competência."""
        return self._fato_populacao

    @property
    def raio_50km(self) -> pd.DataFrame:
        """Dimensão logística: raio de 50km e municípios vizinhos validados."""
        return self._raio_50km
