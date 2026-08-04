"""Configurações centralizadas da aplicação."""
import os


class Config:
    """Configuração base da aplicação Flask."""

    # Paths
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(BASE_DIR, "dados")

    # Arquivos de dados
    OPERADORA_MUNICIPIO_PATH = os.path.join(DATA_DIR, "operadora_por_municipio.parquet")
    DIM_MUNICIPIO_PATH = os.path.join(DATA_DIR, "dim_municipio.parquet")
    DIM_OPERADORA_PATH = os.path.join(DATA_DIR, "dim_operadora.parquet")

    # Flask
    DEBUG = True
    HOST = "0.0.0.0"
    PORT = 5000
    SECRET_KEY = os.environ.get("SECRET_KEY", "ans-dashboard-dev-key")

    # Encoding
    SOURCE_ENCODING = "latin-1"
