"""Configurações centralizadas da aplicação."""
import os


class Config:
    """Configuração base da aplicação Flask."""

    # Paths
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(BASE_DIR, "dados")

    # Arquivos de dados — Star Schema
    DIM_OPERADORA_PATH = os.path.join(DATA_DIR, "entidade_dim_operadora.parquet")
    AREA_COMERCIALIZACAO_PATH = os.path.join(
        DATA_DIR, "entidade_dimensao_area_comercializacao_operadora.parquet"
    )
    FATO_BENEFICIARIO_PATH = os.path.join(
        DATA_DIR, "entidade_fato_beneficiario_por_municipio.parquet"
    )
    DIM_MUNICIPIO_SCORE_PATH = os.path.join(
        DATA_DIR, "dim_municipio_score_mercado.parquet"
    )
    FATO_POPULACAO_PATH = os.path.join(
        DATA_DIR, "entidade_fato_populacao_contratada.parquet"
    )
    RAIO_50KM_PATH = os.path.join(
        DATA_DIR, "dimensao_raio_50km_municipios_viaveis.parquet"
    )

    # Flask
    DEBUG = True
    HOST = "0.0.0.0"
    PORT = 5500
    SECRET_KEY = os.environ.get("SECRET_KEY", "ans-dashboard-dev-key")

    # Encoding
    SOURCE_ENCODING = "latin-1"
